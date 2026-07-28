import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  QrCode,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Sparkles,
  PackageCheck,
  ChevronDown,
  Trash2,
  Info
} from 'lucide-react';
import { ItemEsperado, ItemEscaneado } from '../types';
import { decodificarQR } from '../services/apiService';

interface ChecklistScreenProps {
  esperados: ItemEsperado[];
  escaneados: ItemEscaneado[];
  onAgregarEscaneo: (item: ItemEscaneado) => void;
  onActualizarCantidadEscaneado: (id: string, delta: number) => void;
  onEliminarEscaneado: (id: string) => void;
  onOpenScanner: () => void;
  onOpenManual: () => void;
  onFinalizar: () => void;
}

export const ChecklistScreen: React.FC<ChecklistScreenProps> = ({
  esperados,
  escaneados,
  onAgregarEscaneo,
  onActualizarCantidadEscaneado,
  onEliminarEscaneado,
  onOpenScanner,
  onOpenManual,
  onFinalizar,
}) => {
  const [filtro, setFiltro] = useState<'todos' | 'pendientes' | 'coinciden' | 'extra'>('todos');
  const [lastScannedId, setLastScannedId] = useState<string | null>(null);
  const [lastScanType, setLastScanType] = useState<'match' | 'no_esperado' | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'match' | 'extra' } | null>(null);

  // Calcular totales de progreso
  const totalEsperadosDistintos = esperados.length;
  
  // Conteo de cuántos ítems esperados ya tienen al menos 1 unidad recibida o completa
  const esperadosCumplidosCount = esperados.filter(esp => {
    const sum = escaneados
      .filter(esc => esc.idProd === esp.idProd)
      .reduce((a, b) => a + b.cantidad, 0);
    return sum >= esp.cantidad;
  }).length;

  const totalUnidadesEsperadas = esperados.reduce((a, b) => a + b.cantidad, 0);
  const totalUnidadesRecibidasOk = esperados.reduce((acc, esp) => {
    const sum = escaneados
      .filter(esc => esc.idProd === esp.idProd)
      .reduce((a, b) => a + b.cantidad, 0);
    return acc + Math.min(sum, esp.cantidad);
  }, 0);

  const porcentajeProgreso = Math.round((totalUnidadesRecibidasOk / Math.max(1, totalUnidadesEsperadas)) * 100);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  // Handler para cuando se procesa un QR escaneado
  const handleProcessQR = (qrRawText: string) => {
    const decoded = decodificarQR(qrRawText);
    const espMatch = esperados.find(e => e.idProd === decoded.idProd);

    const isMatch = Boolean(espMatch);
    const nuevoEscaneo: ItemEscaneado = {
      id: 'ESC-' + Date.now() + '-' + Math.floor(Math.random() * 100),
      idProd: decoded.idProd,
      nombreProducto: decoded.nombreProducto,
      partida: decoded.partida,
      venc: decoded.venc,
      cantidad: 1,
      origenCarga: 'qr',
      matched: isMatch,
      timestamp: new Date().toLocaleTimeString().slice(0, 5),
    };

    onAgregarEscaneo(nuevoEscaneo);
    setLastScannedId(nuevoEscaneo.id);
    setLastScanType(isMatch ? 'match' : 'no_esperado');

    if (isMatch) {
      setToastMsg({
        text: `✓ Coincide: ${decoded.nombreProducto}`,
        type: 'match'
      });
    } else {
      setToastMsg({
        text: `⚠ NO ESPERADO: ${decoded.nombreProducto}`,
        type: 'extra'
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F5EDE1] text-[#3B2417] pb-36 max-w-md mx-auto relative">
      
      {/* 1. CONTADOR FIJO ARRIBA */}
      <div className="sticky top-0 z-30 bg-[#28180E] text-white shadow-md border-b border-[#3B2417]">
        <div className="p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#D5C4B1] block">
              Progreso de Recepción
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-serif font-bold text-white">
                {esperadosCumplidosCount} de {totalEsperadosDistintos}
              </span>
              <span className="text-xs text-[#C5B4A3]">esperados listos</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xl font-bold font-serif text-[#C1502E]">
              {porcentajeProgreso}%
            </span>
            <span className="block text-[10px] text-[#C5B4A3]">
              {totalUnidadesRecibidasOk}/{totalUnidadesEsperadas} u.
            </span>
          </div>
        </div>

        {/* Barra de Progreso Visual */}
        <div className="w-full bg-[#1A100A] h-2">
          <div
            className="h-full bg-[#C1502E] transition-all duration-300 ease-out"
            style={{ width: `${porcentajeProgreso}%` }}
          ></div>
        </div>

        {/* Filtros rápidos */}
        <div className="flex px-2 py-1.5 bg-[#20130B] border-t border-[#3B2417] space-x-1 overflow-x-auto text-xs">
          <button
            onClick={() => setFiltro('todos')}
            className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors whitespace-nowrap ${
              filtro === 'todos' ? 'bg-[#3B2417] text-white' : 'text-[#C5B4A3] hover:text-white'
            }`}
          >
            Todos ({esperados.length})
          </button>
          <button
            onClick={() => setFiltro('pendientes')}
            className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors whitespace-nowrap ${
              filtro === 'pendientes' ? 'bg-[#B45309] text-white' : 'text-[#C5B4A3] hover:text-white'
            }`}
          >
            Pendientes ({esperados.length - esperadosCumplidosCount})
          </button>
          <button
            onClick={() => setFiltro('coinciden')}
            className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors whitespace-nowrap ${
              filtro === 'coinciden' ? 'bg-[#1E5128] text-white' : 'text-[#C5B4A3] hover:text-white'
            }`}
          >
            Coincidieron ({esperadosCumplidosCount})
          </button>
          <button
            onClick={() => setFiltro('extra')}
            className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors whitespace-nowrap ${
              filtro === 'extra' ? 'bg-[#B91C1C] text-white' : 'text-[#C5B4A3] hover:text-white'
            }`}
          >
            No Esperados ({escaneados.filter(e => !e.matched).length})
          </button>
        </div>
      </div>

      {/* TOAST FLOTANTE DE RETROALIMENTACIÓN RÁPIDA */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-32 left-4 right-4 z-40 p-3.5 rounded-2xl shadow-xl text-xs font-bold text-white flex items-center justify-between border ${
              toastMsg.type === 'match'
                ? 'bg-[#1E5128] border-green-400 shadow-green-950/30'
                : 'bg-[#B91C1C] border-red-400 shadow-red-950/30'
            }`}
          >
            <span>{toastMsg.text}</span>
            <CheckCircle2 className="w-5 h-5 shrink-0 ml-2" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. LISTA DE PRODUCTOS ESPERADOS Y ESCANEADOS */}
      <div className="p-4 space-y-3">
        {/* Renderizado de ítems esperados */}
        <AnimatePresence>
          {esperados.map((esp, index) => {
            // Unidades escaneadas asociadas
            const escaneadosParaEsp = escaneados.filter(esc => esc.idProd === esp.idProd);
            const totalRecibido = escaneadosParaEsp.reduce((acc, curr) => acc + curr.cantidad, 0);

            const isCompleto = totalRecibido >= esp.cantidad;
            const isParcial = totalRecibido > 0 && totalRecibido < esp.cantidad;

            // Filtrado
            if (filtro === 'pendientes' && isCompleto) return null;
            if (filtro === 'coinciden' && totalRecibido === 0) return null;
            if (filtro === 'extra') return null; // los extra se renderizan abajo

            return (
              <motion.div
                key={esp.idProd}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.04 }}
                className={`rounded-2xl p-4 border-2 transition-all min-h-[72px] flex flex-col justify-between ${
                  isCompleto
                    ? 'bg-[#EAF4ED] border-[#1E5128] shadow-xs'
                    : isParcial
                    ? 'bg-[#FEF3C7] border-[#B45309]'
                    : 'bg-[#FAF5EE] border-[#D8C6B3]'
                }`}
              >
                {/* Header de fila */}
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#785E4E] bg-[#E8DDD0] px-2 py-0.5 rounded-md">
                        {esp.categoria}
                      </span>
                      {esp.partida && (
                        <span className="text-[10px] font-mono text-[#61493B]">
                          Lote: {esp.partida}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-semibold text-[#3B2417] leading-snug">
                      {esp.nombreProducto}
                    </h4>
                  </div>

                  {/* BADGE DE ESTADO CON REGLAS DE COLOR STRICTAS */}
                  <div>
                    {isCompleto ? (
                      <div className="bg-[#1E5128] text-white px-2.5 py-1 rounded-xl text-xs font-bold flex items-center space-x-1 shadow-xs">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: [0, 1.2, 1] }}
                          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </motion.div>
                        <span>Coincide ({totalRecibido}/{esp.cantidad})</span>
                      </div>
                    ) : isParcial ? (
                      <div className="bg-[#B45309] text-white px-2.5 py-1 rounded-xl text-xs font-bold flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Incompleto ({totalRecibido}/{esp.cantidad})</span>
                      </div>
                    ) : (
                      <div className="bg-[#B45309]/15 text-[#B45309] border border-[#B45309]/40 px-2.5 py-1 rounded-xl text-xs font-semibold">
                        Pendiente (0/{esp.cantidad})
                      </div>
                    )}
                  </div>
                </div>

                {/* Subdetalles de escaneos específicos */}
                {escaneadosParaEsp.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-[#D5C4B1]/50 space-y-1">
                    <span className="text-[10px] font-semibold text-[#785E4E] block">
                      Capturas escaneadas:
                    </span>
                    {escaneadosParaEsp.map((esc) => (
                      <div
                        key={esc.id}
                        className="flex items-center justify-between text-xs bg-white/60 p-2 rounded-xl border border-[#D5C4B1]"
                      >
                        <span className="font-mono text-[#3B2417] text-[11px]">
                          {esc.origenCarga === 'qr' ? 'QR' : 'Manual'} • {esc.timestamp}
                        </span>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onActualizarCantidadEscaneado(esc.id, -1)}
                            className="w-7 h-7 rounded-lg bg-[#E8DDD0] hover:bg-[#D5C4B1] font-bold text-sm flex items-center justify-center cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-bold text-xs">{esc.cantidad} u.</span>
                          <button
                            onClick={() => onActualizarCantidadEscaneado(esc.id, 1)}
                            className="w-7 h-7 rounded-lg bg-[#E8DDD0] hover:bg-[#D5C4B1] font-bold text-sm flex items-center justify-center cursor-pointer"
                          >
                            +
                          </button>
                          <button
                            onClick={() => onEliminarEscaneado(esc.id)}
                            title="Eliminar captura"
                            className="p-1 text-[#B91C1C] hover:bg-red-50 rounded-lg cursor-pointer ml-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* 3. BLOQUE DE ITEMS NO ESPERADOS (Rojo ladrillo #B91C1C, sin bloquear nada) */}
        {escaneados.filter(e => !e.matched).length > 0 && (filtro === 'todos' || filtro === 'extra') && (
          <div className="pt-4 border-t-2 border-dashed border-[#B91C1C]/40 space-y-3">
            <div className="flex items-center space-x-2 px-1">
              <AlertTriangle className="w-5 h-5 text-[#B91C1C]" />
              <h4 className="text-sm font-serif font-bold text-[#B91C1C] uppercase tracking-wider">
                Ítems No Esperados / Sin Cobrar ({escaneados.filter(e => !e.matched).length})
              </h4>
            </div>

            {escaneados.filter(e => !e.matched).map((esc) => (
              <div
                key={esc.id}
                className="bg-[#FDF2F2] border-2 border-[#B91C1C] rounded-2xl p-4 min-h-[72px] flex flex-col justify-between animate-shake"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="bg-[#B91C1C] text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                      No figuraba en pedido
                    </span>
                    <h5 className="text-sm font-semibold text-[#3B2417] mt-1">
                      {esc.nombreProducto}
                    </h5>
                    <p className="text-xs text-[#785E4E]">
                      {esc.idProd} {esc.partida ? `• Lote: ${esc.partida}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onActualizarCantidadEscaneado(esc.id, -1)}
                      className="w-8 h-8 rounded-xl bg-red-100 hover:bg-red-200 font-bold text-sm text-[#991B1B] flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-bold text-sm text-[#991B1B]">{esc.cantidad} u.</span>
                    <button
                      onClick={() => onActualizarCantidadEscaneado(esc.id, 1)}
                      className="w-8 h-8 rounded-xl bg-red-100 hover:bg-red-200 font-bold text-sm text-[#991B1B] flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. BARRA DE ACCIÓN FIJA EN LA PARTE INFERIOR (Targets grandes 56px de alto) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#FAF5EE] border-t-2 border-[#D8C6B3] p-4 max-w-md mx-auto space-y-2.5 shadow-xl">
        <div className="grid grid-cols-2 gap-2">
          {/* Botón Escanear QR (Terracota #C1502E) */}
          <button
            onClick={onOpenScanner}
            className="btn-tactile h-14 bg-[#C1502E] hover:bg-[#A84224] active:bg-[#8F351B] text-white font-semibold text-sm rounded-2xl shadow-md flex items-center justify-center space-x-2 cursor-pointer border border-[#A84224]"
          >
            <QrCode className="w-5 h-5 text-white" />
            <span>Escanear QR</span>
          </button>

          {/* Botón Cargar Manual (Insumos sin QR) */}
          <button
            onClick={onOpenManual}
            className="btn-tactile h-14 bg-[#E8DDD0] hover:bg-[#D5C4B1] active:bg-[#C5B4A3] text-[#3B2417] font-semibold text-sm rounded-2xl border-2 border-[#CBB7A3] flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <PlusCircle className="w-5 h-5 text-[#61493B]" />
            <span>Cargar Manual</span>
          </button>
        </div>

        {/* Botón Finalizar Recepción */}
        <button
          onClick={onFinalizar}
          className="btn-tactile w-full h-14 bg-[#3B2417] hover:bg-[#28180E] text-white font-bold text-base rounded-2xl shadow-lg flex items-center justify-center space-x-2 cursor-pointer border border-[#20130B]"
        >
          <span>Finalizar Recepción</span>
          <ArrowRight className="w-5 h-5 text-[#C1502E]" />
        </button>
      </div>
    </div>
  );
};
