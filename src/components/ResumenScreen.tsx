import React from 'react';
import { CheckCircle2, AlertTriangle, Info, ArrowLeft, Download, FileCheck } from 'lucide-react';
import { RecepcionGuardada } from '../types';

interface ResumenScreenProps {
  recepcion: RecepcionGuardada;
  onVolverInicio: () => void;
}

export const ResumenScreen: React.FC<ResumenScreenProps> = ({ recepcion, onVolverInicio }) => {
  const faltantes = recepcion.reclamos.filter(r => r.tipo === 'faltante');
  const sinCobrar = recepcion.reclamos.filter(r => r.tipo === 'sin_cobrar');

  const handleDescargarComprobante = () => {
    const textoComprobante = `
========================================
OBRADOR — GIANDUIA
Comprobante de Recepción de Mercadería
========================================
Código: ${recepcion.id}
Local: ${recepcion.usuarioLocal}
Fecha/Hora: ${recepcion.fecha} ${recepcion.hora} hs

----------------------------------------
RESUMEN GENERAL:
- Total Esperados: ${recepcion.totalesperados} u.
- Recibidos OK: ${recepcion.totalRecibidosOk} u.
- Faltantes: ${recepcion.totalFaltantes} u.
- Sin Cobrar / Extra: ${recepcion.totalSinCobrar} u.

----------------------------------------
DETALLE DE NOVEDADES Y RECLAMOS:
${recepcion.reclamos.length === 0
  ? 'Sin novedades. Recepción 100% conforme.'
  : recepcion.reclamos.map(r => `• [${r.tipo.toUpperCase()}] ${r.nombreProducto}: ${r.detalle}`).join('\n')
}

========================================
Firmado digitalmente por el local.
    `.trim();

    const blob = new Blob([textoComprobante], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Recepcion_${recepcion.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink pb-28 max-w-md mx-auto">
      <div className="ticket-perforation bg-terracotta-deep text-paper-raised px-5 pt-8 pb-6 text-center">
        <FileCheck className="w-8 h-8 text-terracotta mx-auto mb-1.5" />
        <span className="block text-[10px] font-ticket uppercase tracking-[0.2em] text-paper-raised/60">
          Comprobante de recepción
        </span>
        <h1 className="text-2xl font-display font-bold italic mt-1">Recepción finalizada</h1>
        <p className="text-xs font-ticket text-paper-raised/70 mt-1">
          {recepcion.id} · {recepcion.fecha} {recepcion.hora}hs
        </p>
      </div>

      <div className="p-4 space-y-3">
        {/* RECIBIDO OK */}
        <div className="card-flat border-l-4 border-l-ok p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-7 h-7 text-ok shrink-0" />
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-ok font-ticket">
                Recibido conforme
              </span>
              <h3 className="text-xl font-display font-bold text-ok leading-tight">
                {recepcion.totalRecibidosOk} unidades OK
              </h3>
            </div>
          </div>
        </div>

        {/* FALTANTES */}
        <div className={`card-flat border-l-4 p-4 ${faltantes.length > 0 ? 'border-l-danger' : 'border-l-ink/15'}`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-7 h-7 shrink-0 ${faltantes.length > 0 ? 'text-danger' : 'text-ink-soft/50'}`} />
            <div>
              <span className={`text-[10px] uppercase tracking-wider font-bold font-ticket ${faltantes.length > 0 ? 'text-danger' : 'text-ink-soft'}`}>
                Faltantes
              </span>
              <h3 className={`text-xl font-display font-bold leading-tight ${faltantes.length > 0 ? 'text-danger' : 'text-ink'}`}>
                {recepcion.totalFaltantes} unidades no llegaron
              </h3>
            </div>
          </div>

          {faltantes.length > 0 && (
            <div className="space-y-1.5 mt-3 pt-3 border-t border-danger/20">
              {faltantes.map((f, idx) => (
                <div key={idx} className="text-xs bg-danger-tint p-2.5">
                  <span className="font-bold text-danger block">{f.nombreProducto}</span>
                  <span className="text-[11px] text-ink-soft">{f.detalle}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SIN COBRAR */}
        <div className={`card-flat border-l-4 p-4 ${sinCobrar.length > 0 ? 'border-l-warn' : 'border-l-ink/15'}`}>
          <div className="flex items-center gap-3">
            <Info className={`w-7 h-7 shrink-0 ${sinCobrar.length > 0 ? 'text-warn' : 'text-ink-soft/50'}`} />
            <div>
              <span className={`text-[10px] uppercase tracking-wider font-bold font-ticket ${sinCobrar.length > 0 ? 'text-warn' : 'text-ink-soft'}`}>
                Sin cobrar / extra
              </span>
              <h3 className={`text-lg font-display font-bold leading-tight ${sinCobrar.length > 0 ? 'text-warn' : 'text-ink'}`}>
                {recepcion.totalSinCobrar} unidades sin pedido previo
              </h3>
            </div>
          </div>

          {sinCobrar.length > 0 && (
            <div className="space-y-1.5 mt-3 pt-3 border-t border-warn/20">
              {sinCobrar.map((s, idx) => (
                <div key={idx} className="text-xs bg-warn-tint p-2.5">
                  <span className="font-bold text-warn block">{s.nombreProducto}</span>
                  <span className="text-[11px] text-ink-soft">{s.detalle}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleDescargarComprobante}
          className="btn-tactile w-full card-flat p-3.5 flex items-center justify-center gap-2 text-sm font-semibold text-ink cursor-pointer"
        >
          <Download className="w-4 h-4 text-terracotta" />
          <span>Descargar comprobante (.txt)</span>
        </button>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 bg-paper-raised border-t-2 border-ink/15 p-3 max-w-md mx-auto shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
        <button
          onClick={onVolverInicio}
          className="btn-tactile w-full h-14 bg-ink hover:bg-terracotta-deep text-white font-bold text-base flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-terracotta" />
          <span>Volver al inicio</span>
        </button>
      </div>
    </div>
  );
};
