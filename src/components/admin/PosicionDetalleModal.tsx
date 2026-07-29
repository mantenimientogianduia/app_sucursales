import React, { useEffect, useState } from 'react';
import { X, Search, ArrowRightLeft, Clock, CheckCircle2 } from 'lucide-react';
import { PosicionVigente, HistorialCambioPosicion, ProductoBachaCandidato } from '../../types';
import { getHistorialPosicion, getProductosBachaCandidatos, anunciarCambio } from '../../services/adminApiService';
import { Stamp } from '../ui/Stamp';

interface PosicionDetalleModalProps {
  posicion: number | null;
  ocupantes: PosicionVigente[];
  onClose: () => void;
  onCambioAnunciado: () => void;
}

function formatFecha(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export const PosicionDetalleModal: React.FC<PosicionDetalleModalProps> = ({
  posicion,
  ocupantes,
  onClose,
  onCambioAnunciado,
}) => {
  const [historial, setHistorial] = useState<HistorialCambioPosicion[]>([]);
  const [modo, setModo] = useState<'ver' | 'anunciar'>('ver');
  const [busqueda, setBusqueda] = useState('');
  const [candidatos, setCandidatos] = useState<ProductoBachaCandidato[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (posicion === null) return;
    setModo('ver');
    setBusqueda('');
    setCandidatos([]);
    setConfirmandoId(null);
    setError(null);
    getHistorialPosicion(posicion).then(setHistorial);
  }, [posicion]);

  if (posicion === null) return null;

  const buscar = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setBuscando(true);
    try {
      setCandidatos(await getProductosBachaCandidatos(busqueda));
    } finally {
      setBuscando(false);
    }
  };

  const confirmar = async (idProdNuevo: string) => {
    setEnviando(true);
    setError(null);
    try {
      await anunciarCambio(posicion, idProdNuevo);
      onCambioAnunciado();
      onClose();
    } catch (err: any) {
      setError(err.message || 'No se pudo anunciar el cambio.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-xs flex flex-col justify-end sm:justify-center p-0 sm:p-4">
      <div className="bg-paper-raised text-ink max-w-md w-full mx-auto max-h-[88vh] flex flex-col shadow-2xl border-t-2 sm:border-2 border-ink/20 overflow-hidden">
        <div className="p-4 bg-gold-tint border-b border-gold/30 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-ticket uppercase tracking-wider text-gold-dark">Posición BACHA</span>
            <h3 className="text-xl font-display font-bold text-ink">
              {String(posicion).padStart(2, '0')}
            </h3>
          </div>
          <button onClick={onClose} className="btn-tactile p-2 bg-ink/10 hover:bg-ink/20 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-4">
          {/* Ocupantes actuales */}
          <div>
            <span className="text-[10px] font-ticket font-bold uppercase tracking-wider text-ink-soft">
              Ocupando ahora
            </span>
            {ocupantes.length === 0 ? (
              <p className="text-sm text-ink-soft mt-1">Posición vacía.</p>
            ) : (
              <div className="mt-1.5 space-y-1.5">
                {ocupantes.map((o) => (
                  <div key={o.idProd} className="card-flat p-2.5 text-sm font-semibold text-ink">
                    {o.nombreProducto}
                    <span className="block text-[11px] font-ticket font-normal text-ink-soft">{o.idProd}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {modo === 'ver' ? (
            <button
              onClick={() => setModo('anunciar')}
              className="btn-tactile w-full h-12 bg-ink hover:bg-terracotta-deep text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Anunciar cambio de carta
            </button>
          ) : (
            <div className="space-y-3 border-t border-ink/10 pt-3">
              <span className="text-[10px] font-ticket font-bold uppercase tracking-wider text-ink-soft">
                Nuevo sabor para esta posición
              </span>
              <form onSubmit={buscar} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-ink-soft absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar sabor BACHA..."
                    className="w-full h-11 pl-9 pr-3 bg-paper-sunken border border-ink/15 text-sm focus:border-gold focus:outline-none"
                  />
                </div>
                <button type="submit" className="h-11 px-4 bg-ink text-white text-xs font-semibold cursor-pointer">
                  Buscar
                </button>
              </form>

              {buscando ? (
                <p className="text-xs text-ink-soft text-center py-3">Buscando...</p>
              ) : candidatos.length > 0 ? (
                <div className="max-h-48 overflow-y-auto border border-ink/15 divide-y divide-ink/10">
                  {candidatos.map((c) => (
                    <div key={c.idProd} className="p-2.5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="block text-xs font-semibold text-ink truncate">{c.nombreProducto}</span>
                        <span className="text-[10px] font-ticket text-ink-soft">{c.idProd}</span>
                      </div>
                      {confirmandoId === c.idProd ? (
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => setConfirmandoId(null)}
                            className="h-9 px-2.5 border border-ink/20 text-xs font-semibold cursor-pointer"
                          >
                            No
                          </button>
                          <button
                            onClick={() => confirmar(c.idProd)}
                            disabled={enviando}
                            className="h-9 px-2.5 bg-gold-dark text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                          >
                            {enviando ? '...' : 'Confirmar'}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmandoId(c.idProd)}
                          className="shrink-0 h-9 px-3 bg-terracotta text-white text-xs font-semibold cursor-pointer"
                        >
                          Elegir
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-ink-soft text-center py-2">Buscá para ver candidatos de familia BACHA.</p>
              )}

              {error && <p className="text-xs text-danger font-medium">{error}</p>}
            </div>
          )}

          {/* Historial */}
          <div className="border-t border-ink/10 pt-3">
            <span className="text-[10px] font-ticket font-bold uppercase tracking-wider text-ink-soft">
              Historial reciente
            </span>
            {historial.length === 0 ? (
              <p className="text-xs text-ink-soft mt-1.5">Sin cambios registrados en esta posición.</p>
            ) : (
              <div className="mt-1.5 space-y-1.5">
                {historial.map((h) => (
                  <div key={h.idCambio} className="text-xs flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-semibold text-ink">{h.idProdNuevo}</span>
                      {h.idProdViejo && <span className="text-ink-soft"> ← reemplazó a {h.idProdViejo}</span>}
                    </div>
                    <span className="shrink-0 flex items-center gap-1 text-ink-soft font-ticket">
                      {h.fechaRetiro ? (
                        <Stamp variant="ok"><CheckCircle2 className="w-2.5 h-2.5" />completo</Stamp>
                      ) : (
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatFecha(h.fechaAnuncio)}</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
