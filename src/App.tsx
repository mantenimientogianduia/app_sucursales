import React, { useState, useEffect } from 'react';
import { ItemEsperado, ItemEscaneado, LocalUsuario, RecepcionResumen } from './types';
import {
  getSesionActual,
  logoutLocal,
  registrarEscaneoQr,
  registrarCargaManual,
  finalizarRecepcionActual,
  getCatalogoProductos,
  getHistorialRecepciones,
  getRecepcionHoy,
  RecepcionDiaDetalle
} from './services/apiService';
import { LoginScreen } from './components/LoginScreen';
import { HomeScreen } from './components/HomeScreen';
import { ChecklistScreen } from './components/ChecklistScreen';
import { DiaScreen } from './components/DiaScreen';
import { RecepcionesScreen } from './components/RecepcionesScreen';
import { CameraScannerModal } from './components/CameraScannerModal';
import { ManualEntryModal } from './components/ManualEntryModal';
import { StockScreen } from './components/StockScreen';
import { ExhibidoraScreen } from './components/ExhibidoraScreen';

type PantallaNavegacion = 'login' | 'inicio' | 'checklist' | 'dia' | 'stock' | 'exhibidora' | 'recepciones';

export default function App() {
  const [pantalla, setPantalla] = useState<PantallaNavegacion>('login');
  const [local, setLocal] = useState<LocalUsuario | null>(null);

  // Fecha del dia que muestra DiaScreen (el "hub" al que se entra desde
  // cualquier fila del historial, o desde el CTA de Inicio para hoy).
  const [fechaDia, setFechaDia] = useState<string | null>(null);

  // Datos de la recepción en curso (checklist)
  const [esperados, setEsperados] = useState<ItemEsperado[]>([]);
  const [escaneados, setEscaneados] = useState<ItemEscaneado[]>([]);

  // Estado autoritativo de "hoy": nada, en_curso, o cerrada. Lo resuelve el
  // servidor (GET /api/recepciones/hoy) — nunca se infiere del historial.
  const [recepcionHoy, setRecepcionHoy] = useState<RecepcionDiaDetalle | null>(null);
  const [cargandoRecepcionHoy, setCargandoRecepcionHoy] = useState(false);

  // Historial de recepciones (últimos 7 días) para Inicio y el listado completo
  const [historial, setHistorial] = useState<RecepcionResumen[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  // Catálogo de productos para la carga manual (Carga Manual busca acá)
  const [productos, setProductos] = useState<
    Array<{ idProd: string; nombreProducto: string; categoria: string | null }>
  >([]);
  const [cargandoProductos, setCargandoProductos] = useState(false);

  // Estado Modales
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);

  // Inicializar sesión
  useEffect(() => {
    let active = true;
    getSesionActual().then((localSesion) => {
      if (active && localSesion) {
        setLocal(localSesion);
        setPantalla('inicio');
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // El servicio de API dispara este evento cuando el token vencio o dejo de
  // ser valido (401) — volvemos a login en vez de dejar pantallas mostrando
  // datos vacios enganosos.
  useEffect(() => {
    const handleSesionExpirada = () => {
      setLocal(null);
      setPantalla('login');
    };
    window.addEventListener('sesion-local-expirada', handleSesionExpirada);
    return () => window.removeEventListener('sesion-local-expirada', handleSesionExpirada);
  }, []);

  // Estado de "hoy" + historial de 7 días: se recargan juntos cada vez que
  // se entra a Inicio o al listado completo.
  useEffect(() => {
    if (!local || (pantalla !== 'inicio' && pantalla !== 'recepciones')) return;
    let active = true;
    setCargandoHistorial(true);
    setCargandoRecepcionHoy(true);
    Promise.all([getHistorialRecepciones(), getRecepcionHoy()])
      .then(([hist, hoy]) => {
        if (!active) return;
        setHistorial(hist);
        setRecepcionHoy(hoy);
      })
      .catch(() => {
        if (!active) return;
        setHistorial([]);
        setRecepcionHoy(null);
      })
      .finally(() => {
        if (active) {
          setCargandoHistorial(false);
          setCargandoRecepcionHoy(false);
        }
      });
    return () => {
      active = false;
    };
  }, [local, pantalla]);

  // Handlers de navegación y autenticación
  const handleLoginSuccess = (localAuth: LocalUsuario) => {
    setLocal(localAuth);
    setPantalla('inicio');
  };

  const handleLogout = async () => {
    await logoutLocal();
    setLocal(null);
    setPantalla('login');
  };

  const cargarCatalogoProductos = () => {
    setCargandoProductos(true);
    getCatalogoProductos()
      .then(setProductos)
      .catch(() => setProductos([]))
      .finally(() => setCargandoProductos(false));
  };

  // Abrir la pantalla "Día" para una fecha puntual: viene del CTA de hoy en
  // Inicio, o de cualquier fila del historial/listado completo.
  const handleAbrirDia = (fecha: string) => {
    setFechaDia(fecha);
    setPantalla('dia');
  };

  const handleAbrirDiaDeHoy = () => {
    if (recepcionHoy) handleAbrirDia(recepcionHoy.fecha);
  };

  // DiaScreen ya trajo esperados/escaneados (via iniciar, continuar o
  // reabrir) — solo queda mostrarlos en el checklist.
  const handleIrAChecklist = (esp: ItemEsperado[], esc: ItemEscaneado[]) => {
    setEsperados(esp);
    setEscaneados(esc);
    setPantalla('checklist');
    cargarCatalogoProductos();
  };

  // Agregar un item ya confirmado por el servidor a la lista visual.
  // Cada captura es una fila propia (una partida fisica = un escaneo), no se
  // agrupan/suman en el cliente para no perder la trazabilidad 1:1 con el
  // servidor.
  const handleAgregarEscaneo = (nuevoItem: ItemEscaneado) => {
    setEscaneados((prev) => [nuevoItem, ...prev]);
  };

  // Procesar resultado de escáner QR de cámara o simulador: el texto crudo se
  // manda al servidor, que decodifica la partida y decide si matchea. No
  // cierra el modal — el escaneo es continuo (pensado para 200/300 partidas
  // seguidas), así que devuelve el resultado para que el modal muestre un
  // feedback rápido sin interrumpir el flujo con un alert bloqueante.
  const handleScanResult = async (
    qrRawText: string
  ): Promise<{ matched: boolean; nombreProducto: string } | null> => {
    try {
      const nuevoEscaneo = await registrarEscaneoQr(qrRawText);
      handleAgregarEscaneo(nuevoEscaneo);
      return { matched: nuevoEscaneo.matched, nombreProducto: nuevoEscaneo.nombreProducto };
    } catch (err: any) {
      console.error('Error al registrar escaneo:', err.message);
      return null;
    }
  };

  // Procesar submit de carga manual: se manda al servidor, no se decide nada
  // del lado del cliente.
  const handleSubmitManual = async (dataManual: {
    idProd: string;
    nombreProducto: string;
    cantidad: number;
    venc: string | null;
  }) => {
    try {
      const nuevoEscaneo = await registrarCargaManual({
        idProd: dataManual.idProd,
        cantidad: dataManual.cantidad,
        venc: dataManual.venc,
      });
      handleAgregarEscaneo(nuevoEscaneo);
    } catch (err: any) {
      alert(err.message || 'No se pudo registrar la carga manual.');
    }
  };

  // Finalizar la recepción que se está escaneando activamente. Vuelve a la
  // pantalla "Día" (misma fecha), que se re-consulta sola al montar y ya
  // muestra el comprobante final con la opción de reabrir.
  const handleFinalizarRecepcion = async () => {
    try {
      await finalizarRecepcionActual();
      setPantalla('dia');
    } catch (err: any) {
      alert(err.message || 'No se pudo finalizar la recepción.');
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink selection:bg-terracotta selection:text-white">
      {pantalla === 'login' && <LoginScreen onLoginSuccess={handleLoginSuccess} />}

      {pantalla === 'inicio' && local && (
        <HomeScreen
          local={local}
          recepcionHoy={recepcionHoy}
          cargandoRecepcionHoy={cargandoRecepcionHoy}
          historial={historial}
          cargandoHistorial={cargandoHistorial}
          onAbrirDiaDeHoy={handleAbrirDiaDeHoy}
          onAbrirDia={handleAbrirDia}
          onVerHistorialCompleto={() => setPantalla('recepciones')}
          onIrAStock={() => setPantalla('stock')}
          onIrAExhibidora={() => setPantalla('exhibidora')}
          onLogout={handleLogout}
        />
      )}

      {pantalla === 'recepciones' && (
        <RecepcionesScreen
          recepciones={historial}
          cargando={cargandoHistorial}
          onVolver={() => setPantalla('inicio')}
          onAbrir={handleAbrirDia}
        />
      )}

      {pantalla === 'stock' && (
        <StockScreen onVolver={() => setPantalla('inicio')} onIrAExhibidora={() => setPantalla('exhibidora')} />
      )}

      {pantalla === 'exhibidora' && (
        <ExhibidoraScreen onVolver={() => setPantalla('inicio')} onIrAStock={() => setPantalla('stock')} />
      )}

      {pantalla === 'dia' && fechaDia && local && (
        <DiaScreen
          fecha={fechaDia}
          nombreLocal={local.nombreLocal}
          onVolver={() => setPantalla('inicio')}
          onIrAChecklist={handleIrAChecklist}
        />
      )}

      {pantalla === 'checklist' && (
        <ChecklistScreen
          esperados={esperados}
          escaneados={escaneados}
          onOpenScanner={() => setIsScannerOpen(true)}
          onOpenManual={() => setIsManualOpen(true)}
          onFinalizar={handleFinalizarRecepcion}
          onVolver={() => setPantalla('dia')}
        />
      )}

      <CameraScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanResult={handleScanResult}
        totalEscaneados={escaneados.length}
      />

      <ManualEntryModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
        onSubmitManual={handleSubmitManual}
        productos={productos}
        cargandoProductos={cargandoProductos}
      />
    </div>
  );
}
