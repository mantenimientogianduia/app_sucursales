import React, { useState, useEffect } from 'react';
import {
  ItemEsperado,
  ItemEscaneado,
  LocalUsuario,
  RecepcionGuardada,
  RecepcionResumen
} from './types';
import {
  getSesionActual,
  logoutLocal,
  iniciarRecepcion,
  registrarEscaneoQr,
  registrarCargaManual,
  enviarRecepcionFinalizada,
  getCatalogoProductos,
  getHistorialRecepciones,
  getRecepcionHoy,
  getRecepcionDetalle,
  reabrirRecepcion,
  finalizarRecepcion,
  construirRecepcionGuardada,
  RecepcionDetalle
} from './services/apiService';
import { LoginScreen } from './components/LoginScreen';
import { HomeScreen } from './components/HomeScreen';
import { ChecklistScreen } from './components/ChecklistScreen';
import { ResumenScreen } from './components/ResumenScreen';
import { RecepcionesScreen } from './components/RecepcionesScreen';
import { CameraScannerModal } from './components/CameraScannerModal';
import { ManualEntryModal } from './components/ManualEntryModal';
import { StockScreen } from './components/StockScreen';
import { ExhibidoraScreen } from './components/ExhibidoraScreen';

type PantallaNavegacion = 'login' | 'inicio' | 'checklist' | 'resumen' | 'stock' | 'exhibidora' | 'recepciones';

export default function App() {
  const [pantalla, setPantalla] = useState<PantallaNavegacion>('login');
  const [local, setLocal] = useState<LocalUsuario | null>(null);

  // Datos de la recepción en curso (checklist)
  const [esperados, setEsperados] = useState<ItemEsperado[]>([]);
  const [escaneados, setEscaneados] = useState<ItemEscaneado[]>([]);

  // Datos de la pantalla de resumen (final, preliminar, o "de hoy")
  const [recepcionFinal, setRecepcionFinal] = useState<RecepcionGuardada | null>(null);
  const [idRecepcionResumen, setIdRecepcionResumen] = useState<number | string | null>(null);
  const [resumenPreliminar, setResumenPreliminar] = useState(false);
  const [resumenPuedeReabrir, setResumenPuedeReabrir] = useState(false);

  // Estado autoritativo de "hoy": nada, en_curso, o cerrada. Lo resuelve el
  // servidor (GET /api/recepciones/hoy) — nunca se infiere del historial.
  const [recepcionHoy, setRecepcionHoy] = useState<RecepcionDetalle | null>(null);
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
        // Muestra directamente inicio si ya hay local
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
  // se entra a Inicio o al listado completo, para reflejar cambios hechos
  // desde otra pestaña/sesión.
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

  // Arma la pantalla de Resumen (final, o preliminar si es una recepción
  // en_curso abandonada de un día anterior) a partir de un detalle ya
  // resuelto por el servidor.
  const mostrarResumenDesdeDetalle = (detalle: RecepcionDetalle) => {
    if (!local || !detalle.recepcion) return;
    const { recepcion, esperados: esp, escaneados: esc, reclamos } = detalle;

    const abandonada = recepcion.estado === 'en_curso' && !recepcion.editable;
    const puedeReabrir = recepcion.estado === 'cerrada' && recepcion.fecha === recepcionHoy?.recepcion?.fecha;

    setIdRecepcionResumen(recepcion.idRecepcion);
    setResumenPreliminar(abandonada);
    setResumenPuedeReabrir(puedeReabrir);
    setRecepcionFinal(construirRecepcionGuardada(recepcion, esp, esc, reclamos, local.nombreLocal));
    setPantalla('resumen');
  };

  // Punto de entrada común: si la recepción es editable (en_curso y de
  // hoy), entra al checklist para seguir escaneando; si no, muestra el
  // resumen (final o preliminar según corresponda).
  const abrirDesdeDetalle = (detalle: RecepcionDetalle) => {
    if (!detalle.recepcion) return;
    setRecepcionFinal(null);

    if (detalle.recepcion.editable) {
      setEsperados(detalle.esperados);
      setEscaneados(detalle.escaneados);
      setPantalla('checklist');
      cargarCatalogoProductos();
      return;
    }

    mostrarResumenDesdeDetalle(detalle);
  };

  // Iniciar (o recuperar, de forma idempotente) la recepción de hoy.
  const handleIniciarRecepcion = async () => {
    try {
      const detalle = await iniciarRecepcion();
      abrirDesdeDetalle(detalle);
    } catch (err: any) {
      alert(err.message || 'No se pudo iniciar la recepción.');
    }
  };

  // CTA de Inicio cuando ya hay algo para hoy: usa el detalle que ya se
  // trajo con GET /api/recepciones/hoy, sin otra ida y vuelta al servidor.
  const handleAbrirRecepcionHoy = () => {
    if (recepcionHoy) abrirDesdeDetalle(recepcionHoy);
  };

  // Abrir una recepción puntual desde el historial (puede ser de hoy o de
  // un día anterior, en_curso o cerrada).
  const handleAbrirRecepcion = async (resumen: RecepcionResumen) => {
    try {
      const detalle = await getRecepcionDetalle(resumen.idRecepcion);
      abrirDesdeDetalle(detalle);
    } catch (err: any) {
      alert(err.message || 'No se pudo abrir la recepción.');
    }
  };

  // Reabrir la recepción de hoy (ya cerrada) para seguir escaneando.
  const handleReabrir = async () => {
    if (idRecepcionResumen === null) return;
    try {
      const detalle = await reabrirRecepcion(idRecepcionResumen);
      abrirDesdeDetalle(detalle);
    } catch (err: any) {
      alert(err.message || 'No se pudo reabrir la recepción.');
    }
  };

  // Cerrar ahora una recepción abandonada de un día anterior: la finaliza
  // (persistiendo reclamos de verdad) y refresca el resumen a la versión
  // final.
  const handleCerrarAhora = async () => {
    if (idRecepcionResumen === null) return;
    try {
      await finalizarRecepcion(idRecepcionResumen);
      const detalleActualizado = await getRecepcionDetalle(idRecepcionResumen);
      mostrarResumenDesdeDetalle(detalleActualizado);
    } catch (err: any) {
      alert(err.message || 'No se pudo cerrar la recepción.');
    }
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

  // Finalizar la recepción que se está escaneando activamente. Al terminar
  // queda como la recepción cerrada de hoy, así que siempre admite reabrir.
  const handleFinalizarRecepcion = async () => {
    if (!local) return;
    try {
      const res = await enviarRecepcionFinalizada(esperados, escaneados, local.nombreLocal);
      if (res.ok) {
        setIdRecepcionResumen(res.recepcion.id.replace('REC-', ''));
        setResumenPreliminar(false);
        setResumenPuedeReabrir(true);
        setRecepcionFinal(res.recepcion);
        setPantalla('resumen');
      }
    } catch (err: any) {
      alert(err.message || 'No se pudo finalizar la recepción.');
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink selection:bg-terracotta selection:text-white">
      {/* 1. Pantalla de Login */}
      {pantalla === 'login' && (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      )}

      {/* 2. Pantalla Inicio */}
      {pantalla === 'inicio' && local && (
        <HomeScreen
          local={local}
          recepcionHoy={recepcionHoy}
          cargandoRecepcionHoy={cargandoRecepcionHoy}
          historial={historial}
          cargandoHistorial={cargandoHistorial}
          onIniciarRecepcion={handleIniciarRecepcion}
          onAbrirRecepcionHoy={handleAbrirRecepcionHoy}
          onAbrirRecepcion={handleAbrirRecepcion}
          onVerHistorialCompleto={() => setPantalla('recepciones')}
          onIrAStock={() => setPantalla('stock')}
          onIrAExhibidora={() => setPantalla('exhibidora')}
          onLogout={handleLogout}
        />
      )}

      {/* Listado completo de recepciones recientes */}
      {pantalla === 'recepciones' && (
        <RecepcionesScreen
          recepciones={historial}
          cargando={cargandoHistorial}
          onVolver={() => setPantalla('inicio')}
          onAbrir={handleAbrirRecepcion}
        />
      )}

      {/* Stock del depósito */}
      {pantalla === 'stock' && (
        <StockScreen
          onVolver={() => setPantalla('inicio')}
          onIrAExhibidora={() => setPantalla('exhibidora')}
        />
      )}

      {/* Exhibidora */}
      {pantalla === 'exhibidora' && (
        <ExhibidoraScreen
          onVolver={() => setPantalla('inicio')}
          onIrAStock={() => setPantalla('stock')}
        />
      )}

      {/* 3. Pantalla Checklist en Vivo */}
      {pantalla === 'checklist' && (
        <ChecklistScreen
          esperados={esperados}
          escaneados={escaneados}
          onOpenScanner={() => setIsScannerOpen(true)}
          onOpenManual={() => setIsManualOpen(true)}
          onFinalizar={handleFinalizarRecepcion}
          onVolver={() => setPantalla('inicio')}
        />
      )}

      {/* 4. Pantalla Resumen (final, preliminar, o de hoy) */}
      {pantalla === 'resumen' && recepcionFinal && (
        <ResumenScreen
          recepcion={recepcionFinal}
          preliminar={resumenPreliminar}
          onCerrarAhora={handleCerrarAhora}
          puedeReabrir={resumenPuedeReabrir}
          onReabrir={handleReabrir}
          onVolverInicio={() => setPantalla('inicio')}
        />
      )}

      {/* Modal Cámara QR — escaneo continuo, se cierra solo con "Listo" */}
      <CameraScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanResult={handleScanResult}
        totalEscaneados={escaneados.length}
      />

      {/* Modal Carga Manual */}
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
