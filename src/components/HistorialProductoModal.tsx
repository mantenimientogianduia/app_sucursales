import React, { useEffect, useState } from 'react';
import { X, Clock, CheckCircle2 } from 'lucide-react';
import { HistorialExhibicion } from '../types';
import { getHistorialProducto, desexhibirLote } from '../services/apiService';
import { Stamp } from './ui/Stamp';

interface HistorialProductoModalProps {
  idProd: string | null;
  nombreProducto: string;
  onClose: () => void;
  onDesexhibido: () => void;
}

function formatFechaHora(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export const HistorialProductoModal: React.FC<HistorialProductoModalProps> = ({
  idProd,
  nombreProducto,
  onClose,
  onDesexhibido,
}) => {
  const [historial, setHistorial] = useState<HistorialExhibicion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [desexhibiendo, setDesexhibiendo] = useState(false);

  useEffect(() => {
    if (!idProd) return;
    setCargando(true);
    getHistorialProducto(idProd)
      .then(setHistorial)
      .finally(() => setCargando(false));
  }, [idProd]);

  if (!idProd) return null;

  const handleDesexhibir = async (idLote: number | string) => {
    setDesexhibiendo(true);
    try {
      await desexhibirLote(idLote);
      onDesexhibido();
      onClose();
    } finally {
      setDesexhibiendo(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-xs flex flex-col justify-end sm:justify-center p-0 sm:p-4">
      <div className="bg-paper-raised text-ink max-w-md sm:max-w-lg w-full mx-auto max-h-[85vh] flex flex-col shadow-2xl border-t-2 sm:border-2 border-ink/20 overflow-hidden">
        <div className="p-4 bg-gold-tint border-b border-gold/30 flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <span className="text-[10px] font-ticket uppercase tracking-wider text-gold-dark">Historial de exhibición</span>
            <h3 className="text-base font-display font-bold text-ink truncate">{nombreProducto}</h3>
          </div>
          <button onClick={onClose} className="btn-tactile shrink-0 p-2 bg-ink/10 hover:bg-ink/20 cursor-pointer ml-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-2">
          {cargando ? (
            <p className="text-sm text-ink-soft text-center py-8">Cargando...</p>
          ) : historial.length === 0 ? (
            <p className="text-sm text-ink-soft text-center py-8">Sin exhibiciones registradas.</p>
          ) : (
            historial.map((h) => (
              <div key={h.idLote} className="card-flat p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  {h.esUltimaExhibida && (
                    <div className="mb-1">
                      <Stamp variant="ok"><CheckCircle2 className="w-3 h-3" />Vigente</Stamp>
                    </div>
                  )}
                  {h.partida && (
                    <span className="block text-[10px] font-ticket text-ink-soft/70 truncate max-w-[160px]" title={h.partida}>
                      {h.partida}
                    </span>
                  )}
                  <span className="text-xs font-ticket text-ink-soft flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> {formatFechaHora(h.timestampExhibido)} · {h.cantidad ?? '—'} u.
                  </span>
                </div>
                {h.esUltimaExhibida && (
                  <button
                    onClick={() => handleDesexhibir(h.idLote)}
                    disabled={desexhibiendo}
                    className="btn-tactile shrink-0 h-10 px-3 border border-danger text-danger font-semibold text-xs cursor-pointer disabled:opacity-50"
                  >
                    {desexhibiendo ? '...' : 'Desexhibir'}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
