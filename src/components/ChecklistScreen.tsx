import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  QrCode,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { ItemEsperado, ItemEscaneado } from '../types';
import { Stamp } from './ui/Stamp';

interface ChecklistScreenProps {
  esperados: ItemEsperado[];
  escaneados: ItemEscaneado[];
  onOpenScanner: () => void;
  onOpenManual: () => void;
  onFinalizar: () => void;
}

export const ChecklistScreen: React.FC<ChecklistScreenProps> = ({
  esperados,
  escaneados,
  onOpenScanner,
  onOpenManual,
  onFinalizar,
}) => {
  const [filtro, setFiltro] = useState<'todos' | 'pendientes' | 'coinciden' | 'extra'>('todos');
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'match' | 'extra' } | null>(null);
  const cantidadAnteriorRef = useRef(escaneados.length);

  // Cada partida es una unidad física propia: un esperado CON partida solo
  // puede matchear contra un escaneo con esa MISMA partida exacta (igual que
  // el backend). Si dos líneas esperadas comparten producto pero son
  // partidas distintas, escanear una no puede tildar la otra.
  // Un esperado SIN partida (insumos) sí se agrega por producto, pero solo
  // contra capturas que tampoco tengan partida (o sea, cargadas a mano).
  const capturasParaEsperado = (esp: ItemEsperado) =>
    esp.partida
      ? escaneados.filter(esc => esc.partida === esp.partida)
      : escaneados.filter(esc => esc.idProd === esp.idProd && !esc.partida);

  const totalEsperadosDistintos = esperados.length;

  const esperadosCumplidosCount = esperados.filter(esp => {
    const sum = capturasParaEsperado(esp).reduce((a, b) => a + b.cantidad, 0);
    return sum >= esp.cantidad;
  }).length;

  const totalUnidadesEsperadas = esperados.reduce((a, b) => a + b.cantidad, 0);
  const totalUnidadesRecibidasOk = esperados.reduce((acc, esp) => {
    const sum = capturasParaEsperado(esp).reduce((a, b) => a + b.cantidad, 0);
    return acc + Math.min(sum, esp.cantidad);
  }, 0);

  const porcentajeProgreso = Math.round((totalUnidadesRecibidasOk / Math.max(1, totalUnidadesEsperadas)) * 100);

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  useEffect(() => {
    if (escaneados.length > cantidadAnteriorRef.current) {
      const nuevo = escaneados[0];
      setToastMsg(
        nuevo.matched
          ? { text: `Coincide: ${nuevo.nombreProducto}`, type: 'match' }
          : { text: `NO ESPERADO: ${nuevo.nombreProducto}`, type: 'extra' }
      );
    }
    cantidadAnteriorRef.current = escaneados.length;
  }, [escaneados]);

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink pb-36 max-w-md mx-auto relative">
      {/* CONTADOR FIJO ARRIBA */}
      <div className="ticket-perforation sticky top-0 z-30 bg-terracotta-deep text-paper-raised shadow-md">
        <div className="p-4 flex items-end justify-between">
          <div>
            <span className="text-[10px] font-ticket font-semibold uppercase tracking-[0.14em] text-paper-raised/60 block">
              Progreso de recepción
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-display font-bold italic leading-none">
                {esperadosCumplidosCount}/{totalEsperadosDistintos}
              </span>
              <span className="text-xs text-paper-raised/70">esperados listos</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-ticket font-bold text-terracotta leading-none">
              {porcentajeProgreso}%
            </span>
            <span className="block text-[10px] font-ticket text-paper-raised/60 mt-0.5">
              {totalUnidadesRecibidasOk}/{totalUnidadesEsperadas} u.
            </span>
          </div>
        </div>

        <div className="w-full bg-black/30 h-1.5">
          <div
            className="h-full bg-terracotta transition-all duration-300 ease-out"
            style={{ width: `${porcentajeProgreso}%` }}
          />
        </div>

        <div className="flex px-2 py-1.5 bg-black/20 space-x-1 overflow-x-auto text-xs">
          {(
            [
              ['todos', `Todos (${esperados.length})`],
              ['pendientes', `Pendientes (${esperados.length - esperadosCumplidosCount})`],
              ['coinciden', `Coincidieron (${esperadosCumplidosCount})`],
              ['extra', `No esperados (${escaneados.filter(e => !e.matched).length})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFiltro(key)}
              className={`px-3 py-1.5 font-ticket font-medium cursor-pointer transition-colors whitespace-nowrap ${
                filtro === key ? 'bg-terracotta text-white' : 'text-paper-raised/60 hover:text-paper-raised'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* TOAST */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            className={`fixed top-32 left-4 right-4 z-40 p-3.5 shadow-xl text-xs font-bold text-white flex items-center justify-between border-2 max-w-md mx-auto ${
              toastMsg.type === 'match' ? 'bg-ok border-white/30' : 'bg-danger border-white/30'
            }`}
          >
            <span>{toastMsg.text}</span>
            <CheckCircle2 className="w-5 h-5 shrink-0 ml-2" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* LISTA */}
      <div className="px-4 pt-3">
        <AnimatePresence>
          {esperados.map((esp, index) => {
            const escaneadosParaEsp = capturasParaEsperado(esp);
            const totalRecibido = escaneadosParaEsp.reduce((acc, curr) => acc + curr.cantidad, 0);

            const isCompleto = totalRecibido >= esp.cantidad;
            const isParcial = totalRecibido > 0 && totalRecibido < esp.cantidad;

            if (filtro === 'pendientes' && isCompleto) return null;
            if (filtro === 'coinciden' && totalRecibido === 0) return null;
            if (filtro === 'extra') return null;

            return (
              <motion.div
                key={`${esp.idProd}-${esp.partida || 'sin-partida'}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: Math.min(index * 0.03, 0.3) }}
                className={`list-row py-3 flex flex-col gap-1.5 ${isCompleto ? 'opacity-80' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {esp.categoria && (
                      <span className="inline-block text-[10px] font-ticket font-semibold uppercase tracking-wider text-ink-soft bg-paper-sunken px-1.5 py-0.5">
                        {esp.categoria}
                      </span>
                    )}
                    {esp.partida && (
                      <span
                        className="block text-[10px] font-ticket text-ink-soft/70 truncate max-w-[190px] mt-0.5"
                        title={esp.partida}
                      >
                        {esp.partida}
                      </span>
                    )}
                    <h4 className="text-sm font-semibold text-ink leading-snug mt-0.5">
                      {esp.nombreProducto}
                    </h4>
                  </div>

                  {isCompleto ? (
                    <motion.div
                      initial={{ scale: 0, rotate: 8 }}
                      animate={{ scale: 1, rotate: -2.5 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    >
                      <Stamp variant="ok">
                        <CheckCircle2 className="w-3 h-3" />
                        {totalRecibido}/{esp.cantidad}
                      </Stamp>
                    </motion.div>
                  ) : isParcial ? (
                    <Stamp variant="warn">
                      <Clock className="w-3 h-3" />
                      {totalRecibido}/{esp.cantidad}
                    </Stamp>
                  ) : (
                    <span className="text-xs font-ticket text-ink-soft/70 shrink-0 mt-0.5">0/{esp.cantidad}</span>
                  )}
                </div>

                {escaneadosParaEsp.length > 0 && (
                  <div className="pl-0.5 space-y-1">
                    {escaneadosParaEsp.map((esc) => (
                      <div key={esc.id} className="flex items-center justify-between text-[11px] font-ticket text-ink-soft">
                        <span>{esc.origenCarga === 'qr' ? 'QR' : 'Manual'} · {esc.timestamp}</span>
                        <span className="font-bold text-ink">{esc.cantidad} u.</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* NO ESPERADOS */}
        {escaneados.filter(e => !e.matched).length > 0 && (filtro === 'todos' || filtro === 'extra') && (
          <div className="pt-4 mt-2 border-t-2 border-dashed border-danger/40 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-danger" />
              <h4 className="text-xs font-display font-bold text-danger uppercase tracking-wider">
                Sin cobrar / no esperados ({escaneados.filter(e => !e.matched).length})
              </h4>
            </div>

            {escaneados.filter(e => !e.matched).map((esc) => (
              <div key={esc.id} className="bg-danger-tint border border-danger/40 p-3 flex items-center justify-between animate-shake">
                <div className="min-w-0">
                  <h5 className="text-sm font-semibold text-ink truncate">{esc.nombreProducto}</h5>
                  <p className="text-[11px] font-ticket text-ink-soft">
                    {esc.idProd} {esc.partida ? `· ${esc.partida}` : ''}
                  </p>
                </div>
                <span className="font-bold text-sm text-danger shrink-0 ml-2">{esc.cantidad} u.</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BARRA DE ACCIÓN FIJA */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-paper-raised border-t-2 border-ink/15 p-3 max-w-md mx-auto space-y-2 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onOpenScanner}
            className="btn-tactile h-14 bg-terracotta hover:bg-terracotta-dark text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <QrCode className="w-5 h-5" />
            <span>Escanear QR</span>
          </button>

          <button
            onClick={onOpenManual}
            className="btn-tactile h-14 bg-paper-sunken hover:bg-ink/10 text-ink font-semibold text-sm border border-ink/20 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Carga manual</span>
          </button>
        </div>

        <button
          onClick={onFinalizar}
          className="btn-tactile w-full h-14 bg-ink hover:bg-terracotta-deep text-white font-bold text-base flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Finalizar recepción</span>
          <ArrowRight className="w-5 h-5 text-terracotta" />
        </button>
      </div>
    </div>
  );
};
