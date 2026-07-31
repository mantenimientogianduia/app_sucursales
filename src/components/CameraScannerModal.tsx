import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Zap, AlertCircle, Sparkles, Check, CheckCircle2 } from 'lucide-react';
import { PRESETS_QR_SIMULADOR } from '../data/mockData';
import { ItemEscaneado } from '../types';

type ResultadoEscaneo = { matched: boolean; nombreProducto: string } | null;

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult: (qrRawText: string) => Promise<ResultadoEscaneo>;
  totalEscaneados: number;
  escaneados: ItemEscaneado[];
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScanResult,
  totalEscaneados,
  escaneados,
}) => {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [customQrInput, setCustomQrInput] = useState('');
  const [activeTab, setActiveTab] = useState<'camera' | 'simulador'>('camera');
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  // Evita procesar el mismo QR varias veces mientras sigue en cuadro y
  // evita disparar un segundo escaneo mientras el anterior todavia esta
  // esperando la respuesta del servidor.
  const procesandoRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }
    startCamera();
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const mostrarFeedback = (resultado: ResultadoEscaneo) => {
    if (!resultado) {
      setFeedback({ text: 'No se pudo registrar, reintentá', ok: false });
    } else {
      setFeedback({
        text: resultado.matched ? resultado.nombreProducto : `NO ESPERADO: ${resultado.nombreProducto}`,
        ok: resultado.matched,
      });
    }
    window.setTimeout(() => setFeedback(null), 1100);
  };

  // Punto único de entrada para procesar un texto de QR, venga de la cámara
  // real, de un preset del simulador, o del input manual. Pausa la cámara
  // mientras espera al servidor y la retoma sola al terminar (con un
  // cooldown, ver abajo) — así el operario no tiene que volver a abrir el
  // escáner entre partida y partida.
  const procesarQr = async (qrRawText: string) => {
    if (procesandoRef.current) return;
    procesandoRef.current = true;

    if (html5QrcodeRef.current) {
      try {
        await html5QrcodeRef.current.pause(true);
      } catch {
        // si ya estaba pausada o no soporta pause, seguimos igual
      }
    }

    // Duplicado: esta misma partida (texto crudo del QR) ya fue escaneada en
    // esta sesión. Se corta antes de llamar al servidor — no tiene sentido
    // registrar la misma partida física dos veces, y esto es justamente lo
    // que pasa seguido cuando el código sigue en cuadro después de leerse.
    const yaEscaneado = escaneados.some((e) => e.partida === qrRawText);
    if (yaEscaneado) {
      setFeedback({ text: 'Ya escaneado', ok: false });
      window.setTimeout(() => setFeedback(null), 1100);
    } else {
      const resultado = await onScanResult(qrRawText);
      mostrarFeedback(resultado);
    }

    // Cooldown: espera un instante antes de reanudar la cámara. Si el mismo
    // QR sigue en cuadro (el operario no llegó a moverla), evita que se
    // vuelva a leer y procesar de inmediato.
    window.setTimeout(() => {
      procesandoRef.current = false;
      if (html5QrcodeRef.current) {
        try {
          html5QrcodeRef.current.resume();
        } catch {
          // si el modal se cerró mientras esperábamos, no hay nada que retomar
        }
      }
    }, 1000);
  };

  const startCamera = async () => {
    setCameraError(null);
    setIsScanning(true);

    try {
      await new Promise((r) => setTimeout(r, 100));

      const element = document.getElementById('qr-reader-target');
      if (!element) return;

      const html5QrCode = new Html5Qrcode('qr-reader-target');
      html5QrcodeRef.current = html5QrCode;

      const config = { fps: 10, qrbox: { width: 250, height: 250 } };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          procesarQr(decodedText);
        },
        () => {
          // Ignorar frames sin QR
        }
      );
    } catch (err: any) {
      console.warn('Cámara no disponible o denegada:', err);
      setCameraError('Cámara no disponible en este entorno. Usá los botones de simulación abajo.');
      setActiveTab('simulador');
      setIsScanning(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrcodeRef.current) {
      try {
        if (html5QrcodeRef.current.isScanning) {
          await html5QrcodeRef.current.stop();
        }
        html5QrcodeRef.current.clear();
      } catch (err) {
        console.warn('Error al detener cámara:', err);
      }
      html5QrcodeRef.current = null;
    }
    procesandoRef.current = false;
    setIsScanning(false);
  };

  const handleSimularPreset = (qrString: string) => {
    procesarQr(qrString);
  };

  const handleSimularCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQrInput.trim()) return;
    procesarQr(customQrInput.trim());
    setCustomQrInput('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-terracotta-deep text-paper-raised flex flex-col justify-between overflow-hidden">
      {/* Top Bar */}
      <div className="p-4 bg-black/25 border-b border-white/10 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-full bg-terracotta flex items-center justify-center shrink-0">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-display font-bold leading-none truncate">
              Escanear QR de fábrica
            </h3>
            <span className="text-[11px] font-ticket text-paper-raised/60">{totalEscaneados} escaneadas</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="btn-tactile shrink-0 px-4 h-12 bg-white/10 hover:bg-white/20 text-paper-raised font-semibold text-sm flex items-center gap-1.5 cursor-pointer"
        >
          <X className="w-4.5 h-4.5 text-terracotta" />
          <span>Listo</span>
        </button>
      </div>

      {/* FEEDBACK RÁPIDO, NO BLOQUEANTE */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.94 }}
            className={`fixed top-24 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-full sm:max-w-md z-40 p-3.5 shadow-xl text-sm font-bold text-white flex items-center justify-between border-2 ${
              feedback.ok ? 'bg-ok border-white/30' : 'bg-danger border-white/30'
            }`}
          >
            <span className="truncate pr-2">{feedback.text}</span>
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Switcher */}
      <div className="bg-black/15 px-3 py-2 flex border-b border-white/10 shrink-0 gap-1">
        <button
          onClick={() => {
            setActiveTab('camera');
            startCamera();
          }}
          className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'camera' ? 'bg-terracotta text-white' : 'text-paper-raised/50 hover:text-paper-raised'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Cámara real</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('simulador');
            stopCamera();
          }}
          className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'simulador' ? 'bg-terracotta text-white' : 'text-paper-raised/50 hover:text-paper-raised'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Simulador</span>
        </button>
      </div>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 relative flex flex-col justify-center items-center p-4 overflow-y-auto">
        {activeTab === 'camera' ? (
          <div className="w-full max-w-sm flex flex-col items-center justify-center my-auto">
            <div className="relative w-72 h-72 overflow-hidden border-4 border-terracotta bg-black shadow-2xl flex items-center justify-center">
              <div id="qr-reader-target" className="w-full h-full object-cover"></div>

              <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-white pointer-events-none"></div>
              <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-white pointer-events-none"></div>
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-white pointer-events-none"></div>
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-white pointer-events-none"></div>

              {isScanning && (
                <div className="absolute w-full h-1 bg-terracotta shadow-[0_0_12px_#C1502E] top-0 animate-[pulse_1.5s_infinite] pointer-events-none"></div>
              )}
            </div>

            <p className="text-center text-xs text-paper-raised/60 mt-4 max-w-xs">
              Apuntá y escaneá seguido — cada lectura se registra sola y la cámara sigue activa para la próxima partida.
            </p>

            {cameraError && (
              <div className="mt-4 p-3 bg-danger/20 border border-danger text-red-200 text-xs text-center flex flex-col items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span>{cameraError}</span>
              </div>
            )}
          </div>
        ) : null}

        {(activeTab === 'simulador' || cameraError) && (
          <div className="w-full max-w-sm space-y-3 my-auto py-2">
            <div className="bg-black/20 p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-terracotta" />
                <h4 className="text-sm font-display font-bold">Presets de prueba rápida</h4>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {PRESETS_QR_SIMULADOR.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSimularPreset(preset.qrString)}
                    className="btn-tactile w-full h-14 px-4 border border-white/15 text-left font-medium text-xs flex items-center justify-between cursor-pointer transition-colors bg-white/5 hover:bg-white/10"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <span className="block font-bold text-sm truncate">{preset.etiqueta}</span>
                      <span className="block text-[11px] opacity-60 font-ticket truncate max-w-[220px]">
                        {preset.qrString}
                      </span>
                    </div>
                    <Check className="w-5 h-5 shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSimularCustom} className="bg-black/20 p-4 border border-white/10">
              <label className="block text-xs font-semibold text-paper-raised/70 mb-2">
                O ingresá texto directo de QR
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customQrInput}
                  onChange={(e) => setCustomQrInput(e.target.value)}
                  placeholder="ej. PT-HEL-197..."
                  className="flex-1 h-12 bg-black/30 border border-white/15 px-3 text-xs text-white focus:outline-none focus:border-terracotta"
                />
                <button
                  type="submit"
                  className="px-4 h-12 bg-terracotta hover:bg-terracotta-dark text-white font-semibold text-xs cursor-pointer"
                >
                  Procesar
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <div className="p-3 bg-black/25 border-t border-white/10 text-center text-[11px] text-paper-raised/50 shrink-0">
        El sistema analiza automáticamente si el producto coincide con el pedido de hoy.
      </div>
    </div>
  );
};
