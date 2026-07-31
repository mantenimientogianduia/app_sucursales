import React from 'react';
import { Receipt, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { VentaDia } from '../types';
import { formatCantidad } from '../utils/format';

interface VentasRemitidasListProps {
  ventas: VentaDia[];
}

function formatMonto(monto: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(monto);
}

export const VentasRemitidasList: React.FC<VentasRemitidasListProps> = ({ ventas }) => {
  const [abiertoId, setAbiertoId] = React.useState<string | null>(null);

  if (ventas.length === 0) {
    return (
      <div className="card-flat p-4 text-center text-xs text-ink-soft">
        No hay ventas remitidas por la fábrica este día.
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xs font-display font-bold uppercase tracking-wider text-ink-soft mb-2">
        Ventas remitidas ({ventas.length})
      </h2>
      <div className="space-y-1.5">
        {ventas.map((venta) => {
          const abierto = abiertoId === venta.idVenta;
          return (
            <div key={venta.idVenta} className="card-flat overflow-hidden">
              <button
                onClick={() => setAbiertoId(abierto ? null : venta.idVenta)}
                className="btn-tactile w-full p-3 flex items-center gap-3 cursor-pointer text-left"
              >
                <Receipt className="w-5 h-5 text-terracotta shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">
                    {venta.numeroRemito ? `Remito #${venta.numeroRemito}` : `Venta ${venta.idVenta}`}
                  </p>
                  <p className="text-[11px] font-ticket text-ink-soft">
                    {venta.estado} · {venta.detalles.length} producto{venta.detalles.length === 1 ? '' : 's'}
                  </p>
                </div>
                <span className="text-sm font-bold text-ink shrink-0">{formatMonto(venta.monto)}</span>
                {abierto ? (
                  <ChevronUp className="w-4 h-4 text-ink-soft/50 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-ink-soft/50 shrink-0" />
                )}
              </button>

              {abierto && (
                <div className="px-3 pb-3 space-y-1.5 border-t border-ink/10 pt-2">
                  {venta.detalles.map((d, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0 flex-1 flex items-center gap-1.5">
                        {d.recepcionado && <CheckCircle2 className="w-3.5 h-3.5 text-ok shrink-0" />}
                        <span className="text-ink-soft truncate">{d.nombreProducto}</span>
                      </div>
                      <span className="text-ink-soft/70 shrink-0">{d.cantidad === null ? '—' : formatCantidad(d.cantidad)} u.</span>
                      <span className="text-ink-soft/70 shrink-0">{formatMonto(d.precioUnitario)}</span>
                      <span className="font-bold text-ink shrink-0">{formatMonto(d.subtotal)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
