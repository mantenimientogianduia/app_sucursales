import React, { useState, useEffect } from 'react';
import {
  ItemEsperado,
  ItemEscaneado,
  LocalUsuario,
  RecepcionGuardada
} from './types';
import {
  getSesionActual,
  logoutLocal,
  iniciarRecepcion,
  registrarEscaneoQr,
  registrarCargaManual,
  enviarRecepcionFinalizada,
  getCatalogoProductos
} from './services/apiService';
import { LoginScreen } from './components/LoginScreen';
import { HomeScreen } from './components/HomeScreen';
import { ChecklistScreen } from './components/ChecklistScreen';
import { ResumenScreen } from './components/ResumenScreen';
import { CameraScannerModal } from './components/CameraScannerModal';
import { ManualEntryModal } from './components/ManualEntryModal';
import { StockScreen } from './components/StockScreen';
import { ExhibidoraScreen } from './components/ExhibidoraScreen';

type PantallaNavegacion = 'login' | 'inicio' | 'checklist' | 'resumen' | 'stock' | 'exhibidora';

export default function App() {
  const [pantalla, setPantalla] = useState<PantallaNavegacion>('login');
  const [local, setLocal] = useState<LocalUsuario | null>(null);

  // Datos de la recepción en curso
  const [esperados, setEsperados] = useState<ItemEsperado[]>([]);
  const [escaneados, setEscaneados] = useState<ItemEscaneado[]>([]);
  const [recepcionFinal, setRecepcionFinal] = useState<RecepcionGuardada | null>(null);

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

  // Iniciar una nueva recepción: la crea en el servidor y trae lo esperado hoy
  const handleIniciarRecepcion = async () => {
    try {
      const dataEsperados = await iniciarRecepcion();
      setEsperados(dataEsperados);
      setEscaneados([]);
      setRecepcionFinal(null);
      setPantalla('checklist');

      setCargandoProductos(true);
      getCatalogoProductos()
        .then(setProductos)
        .catch(() => setProductos([]))
        .finally(() => setCargandoProductos(false));
    } catch (err: any) {
      alert(err.message || 'No se pudo iniciar la recepción.');
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

  // Finalizar Recepción
  const handleFinalizarRecepcion = async () => {
    if (!local) return;
    try {
      const res = await enviarRecepcionFinalizada(esperados, escaneados, local.nombreLocal);
      if (res.ok) {
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
          onIniciarRecepcion={handleIniciarRecepcion}
          onIrAStock={() => setPantalla('stock')}
          onIrAExhibidora={() => setPantalla('exhibidora')}
          onLogout={handleLogout}
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
        />
      )}

      {/* 4. Pantalla Resumen Final */}
      {pantalla === 'resumen' && recepcionFinal && (
        <ResumenScreen
          recepcion={recepcionFinal}
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

