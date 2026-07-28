import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Zap, AlertCircle, Sparkles, Check, RefreshCw } from 'lucide-react';
import { PRESETS_QR_SIMULADOR } from '../data/mockData';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult: (qrRawText: string) => void;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScanResult
}) => {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [customQrInput, setCustomQrInput] = useState('');
  const [activeTab, setActiveTab] = useState<'camera' | 'simulador'>('camera');
  
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    // Al abrir modal, intentar iniciar cámara en el div id="reader-container"
    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    setIsScanning(true);

    try {
      // Breve timeout para asegurar que el DOM existe
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
          // Éxito en lectura de QR
          stopCamera();
          onScanResult(decodedText);
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
    setIsScanning(false);
  };

  const handleSimularPreset = (qrString: string) => {
    stopCamera();
    onScanResult(qrString);
  };

  const handleSimularCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQrInput.trim()) return;
    stopCamera();
    onScanResult(customQrInput.trim());
    setCustomQrInput('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#1A100A] text-white flex flex-col justify-between overflow-hidden">
      {/* Top Bar con Botón Cancelar Gigante */}
      <div className="p-4 bg-[#28180E] border-b border-[#3B2417] flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-xl bg-[#C1502E] flex items-center justify-center">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-serif font-bold text-white leading-none">
              Escanear QR de Fábrica
            </h3>
            <span className="text-xs text-[#D5C4B1]">Lote y Partida de Balde / Pote</span>
          </div>
        </div>

        {/* Botón grande para cerrar/cancelar */}
        <button
          onClick={onClose}
          className="btn-tactile px-4 h-12 bg-[#3B2417] hover:bg-[#4A2F1E] text-[#E8DDD0] rounded-2xl border border-[#523725] font-semibold text-sm flex items-center space-x-1.5 cursor-pointer"
        >
          <X className="w-5 h-5 text-[#C1502E]" />
          <span>Cancelar</span>
        </button>
      </div>

      {/* Switcher Modo Cámara vs Simulador */}
      <div className="bg-[#28180E] px-4 py-2 flex border-b border-[#3B2417] shrink-0">
        <button
          onClick={() => {
            setActiveTab('camera');
            startCamera();
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 cursor-pointer transition-colors ${
            activeTab === 'camera'
              ? 'bg-[#C1502E] text-white shadow-sm'
              : 'text-[#C5B4A3] hover:text-white'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Cámara Real</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('simulador');
            stopCamera();
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 cursor-pointer transition-colors ${
            activeTab === 'simulador'
              ? 'bg-[#C1502E] text-white shadow-sm'
              : 'text-[#C5B4A3] hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Simulador de QR</span>
        </button>
      </div>

      {/* ÁREA PRINCIPAL SCANNER */}
      <div className="flex-1 relative flex flex-col justify-center items-center p-4 overflow-y-auto">
        {activeTab === 'camera' ? (
          <div className="w-full max-w-sm flex flex-col items-center justify-center my-auto">
            {/* Marco Guía del Visor QR */}
            <div className="relative w-72 h-72 rounded-3xl overflow-hidden border-4 border-[#C1502E] bg-black shadow-2xl flex items-center justify-center">
              {/* Target ID para html5-qrcode */}
              <div id="qr-reader-target" className="w-full h-full object-cover"></div>

              {/* Guías ópticas en las 4 esquinas */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-white pointer-events-none"></div>
              <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-white pointer-events-none"></div>
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-white pointer-events-none"></div>
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-white pointer-events-none"></div>

              {/* Línea Láser Animada */}
              {isScanning && (
                <div className="absolute w-full h-1 bg-[#C1502E] shadow-[0_0_12px_#C1502E] top-0 animate-[pulse_1.5s_infinite] pointer-events-none"></div>
              )}
            </div>

            <p className="text-center text-xs text-[#D5C4B1] mt-4 max-w-xs">
              Apuntá la cámara al código QR impreso en la etiqueta de la caja o balde de helado.
            </p>

            {cameraError && (
              <div className="mt-4 p-3 bg-[#B91C1C]/20 border border-[#B91C1C] rounded-2xl text-xs text-red-200 text-center flex flex-col items-center space-y-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span>{cameraError}</span>
              </div>
            )}
          </div>
        ) : null}

        {/* MODO SIMULADOR (Ideal para testing instantáneo sin cámara) */}
        {(activeTab === 'simulador' || cameraError) && (
          <div className="w-full max-w-sm space-y-4 my-auto py-2">
            <div className="bg-[#28180E] p-4 rounded-3xl border border-[#3B2417]">
              <div className="flex items-center space-x-2 mb-3">
                <Zap className="w-5 h-5 text-[#C1502E]" />
                <h4 className="text-sm font-serif font-bold text-white">
                  Presets de prueba rápida
                </h4>
              </div>
              <p className="text-xs text-[#C5B4A3] mb-4">
                Tocá un botón para simular la lectura de un código QR de fábrica:
              </p>

              <div className="grid grid-cols-1 gap-2.5">
                {PRESETS_QR_SIMULADOR.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSimularPreset(preset.qrString)}
                    className="btn-tactile w-full h-14 px-4 rounded-2xl border text-left font-medium text-xs flex items-center justify-between cursor-pointer transition-colors bg-[#3B2417]/40 border-[#523725] text-[#E8DDD0] hover:bg-[#3B2417]/60"
                  >
                    <div className="space-y-0.5">
                      <span className="block font-bold text-sm text-white">
                        {preset.etiqueta}
                      </span>
                      <span className="block text-[11px] opacity-70 font-mono truncate max-w-[220px]">
                        {preset.qrString}
                      </span>
                    </div>
                    <Check className="w-5 h-5 shrink-0 ml-2" />
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[#C5B4A3] mt-3">
                El servidor decide si cada uno coincide con lo esperado hoy — acá solo se simula la lectura.
              </p>
            </div>

            {/* Input Manual QR genérico */}
            <form onSubmit={handleSimularCustom} className="bg-[#28180E] p-4 rounded-3xl border border-[#3B2417]">
              <label className="block text-xs font-semibold text-[#D5C4B1] mb-2">
                O ingresá texto directo de QR
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={customQrInput}
                  onChange={(e) => setCustomQrInput(e.target.value)}
                  placeholder="ej. PT-HEL-197PT-HEL-19728/07/2026 10:00:0028/01/2027 4.000"
                  className="flex-1 h-12 bg-[#1A100A] border border-[#3B2417] rounded-xl px-3 text-xs text-white focus:outline-none focus:border-[#C1502E]"
                />
                <button
                  type="submit"
                  className="px-4 h-12 bg-[#C1502E] hover:bg-[#A84224] text-white font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Procesar
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Bottom Bar Info */}
      <div className="p-4 bg-[#28180E] border-t border-[#3B2417] text-center text-xs text-[#C5B4A3] shrink-0">
        <span>El sistema analiza automáticamente si el producto coincide con el pedido de hoy.</span>
      </div>
    </div>
  );
};
