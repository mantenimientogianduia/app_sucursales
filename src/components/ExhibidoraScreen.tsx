import React, { useEffect, useState } from 'react';
import { LayoutGrid, Package } from 'lucide-react';
import { ExhibidoBacha, ExhibidoResto } from '../types';
import { getExhibidora } from '../services/apiService';
import { TicketHeader } from './ui/TicketHeader';
import { BottomNav, AreaPrincipal } from './ui/BottomNav';
import { HistorialProductoModal } from './HistorialProductoModal';

interface ExhibidoraScreenProps {
  onVolver: () => void;
  onIrAStock: () => void;
}

function tiempoDesde(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60000);
  if (min < 60) return `hace ${min}m`;
  const hs = Math.round(min / 60);
  if (hs < 24) return `hace ${hs}h`;
  return `hace ${Math.round(hs / 24)}d`;
}

export const ExhibidoraScreen: React.FC<ExhibidoraScreenProps> = ({ onVolver, onIrAStock }) => {
  const [bacha, setBacha] = useState<ExhibidoBacha[]>([]);
  const [resto, setResto] = useState<ExhibidoResto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [seleccionado, setSeleccionado] = useState<{ idProd: string; nombre: string } | null>(null);

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await getExhibidora();
      setBacha(data.bacha);
      setResto(data.resto);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleNav = (area: AreaPrincipal) => {
    if (area === 'inicio') onVolver();
    if (area === 'stock') onIrAStock();
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink pb-24 max-w-md mx-auto relative">
      <TicketHeader eyebrow="Mostrador" title="Exhibidora" subtitle="Qué está exhibido en este local" />

      <div className="flex-1 px-4 pt-4">
        {cargando ? (
          <div className="py-16 text-center text-sm text-ink-soft">Cargando...</div>
        ) : (
          <>
            {/* PEGBOARD BACHA */}
            <div className="flex items-center gap-2 mb-3">
              <LayoutGrid className="w-4 h-4 text-gold-dark" />
              <h2 className="text-xs font-ticket font-bold uppercase tracking-[0.14em] text-gold-dark">
                Carta BACHA · 21 posiciones
              </h2>
            </div>

            {bacha.length === 0 ? (
              <p className="text-sm text-ink-soft mb-6">No hay posiciones BACHA configuradas.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 mb-7">
                {bacha
                  .slice()
                  .sort((a, b) => a.posicion - b.posicion)
                  .map((slot) => (
                    <button
                      key={`${slot.posicion}-${slot.idProd}`}
                      onClick={() => setSeleccionado({ idProd: slot.idProd, nombre: slot.nombreProducto })}
                      className={`peg p-2 flex flex-col items-start justify-between text-left cursor-pointer transition-colors ${
                        slot.exhibido ? 'hover:border-sage' : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      <span className="peg-num text-xs text-terracotta">{String(slot.posicion).padStart(2, '0')}</span>
                      <span className="text-[11px] font-semibold text-ink leading-tight line-clamp-2">
                        {slot.nombreProducto}
                      </span>
                      <span className={`text-[9px] font-ticket mt-1 ${slot.exhibido ? 'text-sage-dark' : 'text-ink-soft/60'}`}>
                        {slot.exhibido ? `${slot.exhibido.cantidad ?? '—'} u.` : 'sin exhibir'}
                      </span>
                    </button>
                  ))}
              </div>
            )}

            {/* RESTO */}
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-sage-dark" />
              <h2 className="text-xs font-ticket font-bold uppercase tracking-[0.14em] text-sage-dark">
                Resto de productos exhibidos
              </h2>
            </div>

            {resto.length === 0 ? (
              <p className="text-sm text-ink-soft py-6">No hay otros productos exhibidos actualmente.</p>
            ) : (
              <div>
                {resto.map((r) => (
                  <button
                    key={r.idLote}
                    onClick={() => setSeleccionado({ idProd: r.idProd, nombre: r.nombreProducto })}
                    className="list-row w-full py-3 flex items-center justify-between text-left cursor-pointer"
                  >
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-ink block truncate">{r.nombreProducto}</span>
                      <span className="text-[11px] font-ticket text-ink-soft">
                        {r.cantidad ?? '—'} u. · {tiempoDesde(r.timestampExhibido)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <HistorialProductoModal
        idProd={seleccionado?.idProd ?? null}
        nombreProducto={seleccionado?.nombre ?? ''}
        onClose={() => setSeleccionado(null)}
        onDesexhibido={cargar}
      />

      <BottomNav activa="exhibidora" onNavegar={handleNav} />
    </div>
  );
};
