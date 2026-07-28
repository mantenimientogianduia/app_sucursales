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
  getEsperadosHoy,
  decodificarQR,
  enviarRecepcionFinalizada
} from './services/apiService';
import { LoginScreen } from './components/LoginScreen';
import { HomeScreen } from './components/HomeScreen';
import { ChecklistScreen } from './components/ChecklistScreen';
import { ResumenScreen } from './components/ResumenScreen';
import { CameraScannerModal } from './components/CameraScannerModal';
import { ManualEntryModal } from './components/ManualEntryModal';

type PantallaNavegacion = 'login' | 'inicio' | 'checklist' | 'resumen';

export default function App() {
  const [pantalla, setPantalla] = useState<PantallaNavegacion>('login');
  const [local, setLocal] = useState<LocalUsuario | null>(null);

  // Datos de la recepción en curso
  const [esperados, setEsperados] = useState<ItemEsperado[]>([]);
  const [escaneados, setEscaneados] = useState<ItemEscaneado[]>([]);
  const [recepcionFinal, setRecepcionFinal] = useState<RecepcionGuardada | null>(null);

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

  // Iniciar una nueva recepción
  const handleIniciarRecepcion = async () => {
    const dataEsperados = await getEsperadosHoy();
    setEsperados(dataEsperados);
    setEscaneados([]);
    setRecepcionFinal(null);
    setPantalla('checklist');
  };

  // Agregar un item escaneado / capturado
  const handleAgregarEscaneo = (nuevoItem: ItemEscaneado) => {
    // Si ya existe este producto con origen idéntico y partida idéntica, incrementamos
    setEscaneados((prev) => {
      const indexExistente = prev.findIndex(
        (i) => i.idProd === nuevoItem.idProd && i.partida === nuevoItem.partida
      );

      if (indexExistente >= 0) {
        const copy = [...prev];
        copy[indexExistente] = {
          ...copy[indexExistente],
          cantidad: copy[indexExistente].cantidad + nuevoItem.cantidad,
          timestamp: nuevoItem.timestamp,
        };
        return copy;
      }
      return [nuevoItem, ...prev];
    });
  };

  // Modificar cantidad de un escaneo existente
  const handleActualizarCantidadEscaneado = (id: string, delta: number) => {
    setEscaneados((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nuevaCant = item.cantidad + delta;
            return nuevaCant > 0 ? { ...item, cantidad: nuevaCant } : null;
          }
          return item;
        })
        .filter((i): i is ItemEscaneado => i !== null)
    );
  };

  // Eliminar un escaneo
  const handleEliminarEscaneado = (id: string) => {
    setEscaneados((prev) => prev.filter((i) => i.id !== id));
  };

  // Procesar resultado de escáner QR de cámara o simulador
  const handleScanResult = (qrRawText: string) => {
    setIsScannerOpen(false);

    const decoded = decodificarQR(qrRawText);
    const espMatch = esperados.find((e) => e.idProd === decoded.idProd);

    const nuevoEscaneo: ItemEscaneado = {
      id: 'ESC-' + Date.now() + '-' + Math.floor(Math.random() * 899 + 100),
      idProd: decoded.idProd,
      nombreProducto: decoded.nombreProducto,
      partida: decoded.partida,
      venc: decoded.venc,
      cantidad: 1,
      origenCarga: 'qr',
      matched: Boolean(espMatch),
      timestamp: new Date().toLocaleTimeString().slice(0, 5),
    };

    handleAgregarEscaneo(nuevoEscaneo);
  };

  // Procesar submit de carga manual
  const handleSubmitManual = (dataManual: {
    idProd: string;
    nombreProducto: string;
    cantidad: number;
    partida: string | null;
    venc: string | null;
  }) => {
    const espMatch = esperados.find((e) => e.idProd === dataManual.idProd);

    const nuevoEscaneo: ItemEscaneado = {
      id: 'MAN-' + Date.now() + '-' + Math.floor(Math.random() * 899 + 100),
      idProd: dataManual.idProd,
      nombreProducto: dataManual.nombreProducto,
      partida: dataManual.partida,
      venc: dataManual.venc,
      cantidad: dataManual.cantidad,
      origenCarga: 'manual',
      matched: Boolean(espMatch),
      timestamp: new Date().toLocaleTimeString().slice(0, 5),
    };

    handleAgregarEscaneo(nuevoEscaneo);
  };

  // Finalizar Recepción
  const handleFinalizarRecepcion = async () => {
    if (!local) return;
    const res = await enviarRecepcionFinalizada(
      esperados,
      escaneados,
      local.nombreLocal
    );
    if (res.ok) {
      setRecepcionFinal(res.recepcion);
      setPantalla('resumen');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5EDE1] text-[#3B2417] selection:bg-[#C1502E] selection:text-white">
      {/* 1. Pantalla de Login */}
      {pantalla === 'login' && (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      )}

      {/* 2. Pantalla Inicio */}
      {pantalla === 'inicio' && local && (
        <HomeScreen
          local={local}
          onIniciarRecepcion={handleIniciarRecepcion}
          onLogout={handleLogout}
        />
      )}

      {/* 3. Pantalla Checklist en Vivo */}
      {pantalla === 'checklist' && (
        <ChecklistScreen
          esperados={esperados}
          escaneados={escaneados}
          onAgregarEscaneo={handleAgregarEscaneo}
          onActualizarCantidadEscaneado={handleActualizarCantidadEscaneado}
          onEliminarEscaneado={handleEliminarEscaneado}
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

      {/* Modal Cáncer Cámara QR */}
      <CameraScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanResult={handleScanResult}
      />

      {/* Modal Carga Manual */}
      <ManualEntryModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
        onSubmitManual={handleSubmitManual}
      />
    </div>
  );
}

