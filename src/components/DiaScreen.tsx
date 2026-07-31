import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ClipboardList,
  Clock,
  PackagePlus,
  CheckCircle2,
  AlertTriangle,
  Info,
  Download,
  RotateCcw,
  Lock,
} from 'lucide-react';
import { ItemEsperado, ItemEscaneado, RecepcionGuardada } from '../types';
import {
  RecepcionDiaDetalle,
  getRecepcionDia,
  iniciarRecepcion,
  reabrirRecepcion,
  finalizarRecepcion,
  construirRecepcionGuardada,
} from '../services/apiService';
import { VentasRemitidasList } from './VentasRemitidasList';
import { formatCantidad } from '../utils/format';

interface DiaScreenProps {
  fecha: string;
  nombreLocal: string;
  onVolver: () => void;
  onIrAChecklist: (esperados: ItemEsperado[], escaneados: ItemEscaneado[]) => void;
}

function formatFechaLarga(fechaIso: string): string {
  const [y, m, d] = fechaIso.split('-').map(Number);
  const fecha = new Date(y, m - 1, d);
  return fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function descargarComprobante(recepcion: RecepcionGuardada) {
  const texto = `
========================================
OBRADOR — GIANDUIA
Comprobante de Recepción de Mercadería
========================================
Código: ${recepcion.id}
Local: ${recepcion.usuarioLocal}
Fecha/Hora: ${recepcion.fecha} ${recepcion.hora} hs

----------------------------------------
RESUMEN GENERAL:
- Total Esperados: ${formatCantidad(recepcion.totalesperados)} u.
- Recibidos OK: ${formatCantidad(recepcion.totalRecibidosOk)} u.
- Faltantes: ${formatCantidad(recepcion.totalFaltantes)} u.
- Sin Cobrar / Extra: ${formatCantidad(recepcion.totalSinCobrar)} u.

----------------------------------------
DETALLE DE NOVEDADES Y RECLAMOS:
${
  recepcion.reclamos.length === 0
    ? 'Sin novedades. Recepción 100% conforme.'
    : recepcion.reclamos.map((r) => `• [${r.tipo.toUpperCase()}] ${r.nombreProducto}: ${r.detalle}`).join('\n')
}

========================================
Firmado digitalmente por el local.
    `.trim();

  const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Recepcion_${recepcion.id}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function TotalesRecepcion({ recepcion }: { recepcion: RecepcionGuardada }) {
  const faltantes = recepcion.reclamos.filter((r) => r.tipo === 'faltante');
  const sinCobrar = recepcion.reclamos.filter((r) => r.tipo === 'sin_cobrar');

  return (
    <div className="md:grid md:grid-cols-3 md:gap-3 md:space-y-0 space-y-3">
      <div className="card-flat border-l-4 border-l-ok p-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-7 h-7 text-ok shrink-0" />
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-ok font-ticket">
              Recibido conforme
            </span>
            <h3 className="text-xl font-display font-bold text-ok leading-tight">
              {formatCantidad(recepcion.totalRecibidosOk)} unidades OK
            </h3>
          </div>
        </div>
      </div>

      <div className={`card-flat border-l-4 p-4 ${faltantes.length > 0 ? 'border-l-danger' : 'border-l-ink/15'}`}>
        <div className="flex items-center gap-3">
          <AlertTriangle
            className={`w-7 h-7 shrink-0 ${faltantes.length > 0 ? 'text-danger' : 'text-ink-soft/50'}`}
          />
          <div>
            <span
              className={`text-[10px] uppercase tracking-wider font-bold font-ticket ${
                faltantes.length > 0 ? 'text-danger' : 'text-ink-soft'
              }`}
            >
              Faltantes
            </span>
            <h3
              className={`text-xl font-display font-bold leading-tight ${
                faltantes.length > 0 ? 'text-danger' : 'text-ink'
              }`}
            >
              {formatCantidad(recepcion.totalFaltantes)} unidades no llegaron
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

      <div className={`card-flat border-l-4 p-4 ${sinCobrar.length > 0 ? 'border-l-warn' : 'border-l-ink/15'}`}>
        <div className="flex items-center gap-3">
          <Info className={`w-7 h-7 shrink-0 ${sinCobrar.length > 0 ? 'text-warn' : 'text-ink-soft/50'}`} />
          <div>
            <span
              className={`text-[10px] uppercase tracking-wider font-bold font-ticket ${
                sinCobrar.length > 0 ? 'text-warn' : 'text-ink-soft'
              }`}
            >
              Sin cobrar / extra
            </span>
            <h3
              className={`text-lg font-display font-bold leading-tight ${
                sinCobrar.length > 0 ? 'text-warn' : 'text-ink'
              }`}
            >
              {formatCantidad(recepcion.totalSinCobrar)} unidades sin pedido previo
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
    </div>
  );
}

export const DiaScreen: React.FC<DiaScreenProps> = ({ fecha, nombreLocal, onVolver, onIrAChecklist }) => {
  const [detalle, setDetalle] = useState<RecepcionDiaDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    let active = true;
    setCargando(true);
    getRecepcionDia(fecha)
      .then((d) => {
        if (active) setDetalle(d);
      })
      .catch(() => {
        if (active) setDetalle(null);
      })
      .finally(() => {
        if (active) setCargando(false);
      });
    return () => {
      active = false;
    };
  }, [fecha]);

  const handleIniciar = async () => {
    setProcesando(true);
    try {
      const d = await iniciarRecepcion(fecha);
      onIrAChecklist(d.esperados, d.escaneados);
    } catch (err: any) {
      alert(err.message || 'No se pudo iniciar la recepción.');
    } finally {
      setProcesando(false);
    }
  };

  const handleContinuar = () => {
    if (detalle) onIrAChecklist(detalle.esperados, detalle.escaneados);
  };

  const handleReabrir = async () => {
    if (!detalle?.recepcion) return;
    setProcesando(true);
    try {
      const d = await reabrirRecepcion(detalle.recepcion.idRecepcion);
      onIrAChecklist(d.esperados, d.escaneados);
    } catch (err: any) {
      alert(err.message || 'No se pudo reabrir la recepción.');
    } finally {
      setProcesando(false);
    }
  };

  const handleCerrarAhora = async () => {
    if (!detalle?.recepcion) return;
    setProcesando(true);
    try {
      await finalizarRecepcion(detalle.recepcion.idRecepcion);
      setDetalle(await getRecepcionDia(fecha));
    } catch (err: any) {
      alert(err.message || 'No se pudo cerrar la recepción.');
    } finally {
      setProcesando(false);
    }
  };

  const recepcion = detalle?.recepcion ?? null;
  const guardada =
    recepcion && detalle
      ? construirRecepcionGuardada(recepcion, detalle.esperados, detalle.escaneados, detalle.reclamos, nombreLocal)
      : null;

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink pb-16 max-w-md md:max-w-3xl lg:max-w-5xl mx-auto">
      <div className="ticket-perforation bg-terracotta-deep text-paper-raised px-5 pt-8 pb-6">
        <button
          onClick={onVolver}
          className="btn-tactile w-9 h-9 -ml-2 mb-3 rounded-full bg-black/15 hover:bg-black/25 flex items-center justify-center cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="block text-[10px] font-ticket uppercase tracking-[0.2em] text-terracotta capitalize">
          {formatFechaLarga(fecha)}
        </span>
        <h1 className="text-2xl font-display font-bold italic mt-0.5">Remitido vs. recepcionado</h1>
      </div>

      {cargando && <div className="text-center text-sm text-ink-soft py-10">Cargando…</div>}

      {!cargando && detalle && (
        <div className="p-4 md:p-6 space-y-4">
          <VentasRemitidasList ventas={detalle.ventas} />

          <div>
            <h2 className="text-xs font-display font-bold uppercase tracking-wider text-ink-soft mb-2">
              Recepción
            </h2>

            {!recepcion && (
              <div className="card-flat p-5 text-center">
                <ClipboardList className="w-8 h-8 text-ink-soft/40 mx-auto mb-2" />
                <p className="text-sm text-ink-soft mb-4">Todavía no se inició la recepción de este día.</p>
                <button
                  onClick={handleIniciar}
                  disabled={procesando}
                  className="btn-tactile w-full h-12 bg-terracotta hover:bg-terracotta-dark text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <PackagePlus className="w-4 h-4" />
                  <span>Iniciar recepción</span>
                </button>
              </div>
            )}

            {recepcion?.editable && (
              <div className="card-flat p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-5 h-5 text-warn" />
                  <span className="text-sm font-display font-bold text-ink">En curso</span>
                </div>
                <p className="text-xs text-ink-soft mb-4">
                  {detalle.escaneados.length} partida{detalle.escaneados.length === 1 ? '' : 's'} escaneada
                  {detalle.escaneados.length === 1 ? '' : 's'} hasta ahora.
                </p>
                <button
                  onClick={handleContinuar}
                  className="btn-tactile w-full h-12 bg-warn hover:brightness-95 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continuar escaneando</span>
                </button>
              </div>
            )}

            {recepcion?.estado === 'en_curso' && !recepcion.editable && guardada && (
              <div className="space-y-3">
                <div className="p-3 bg-warn-tint border border-warn/40 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-warn shrink-0 mt-0.5" />
                  <p className="text-xs text-ink">
                    Esta recepción quedó abierta y nunca se cerró. Los totales de abajo son un cálculo provisorio.
                  </p>
                </div>
                <TotalesRecepcion recepcion={guardada} />
                <button
                  onClick={handleCerrarAhora}
                  disabled={procesando}
                  className="btn-tactile w-full h-12 bg-warn hover:brightness-95 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Cerrar esta recepción ahora</span>
                </button>
              </div>
            )}

            {recepcion?.estado === 'cerrada' && !recepcion.editable && guardada && (
              <div className="space-y-3">
                <TotalesRecepcion recepcion={guardada} />
                <button
                  onClick={() => descargarComprobante(guardada)}
                  className="btn-tactile w-full card-flat p-3.5 flex items-center justify-center gap-2 text-sm font-semibold text-ink cursor-pointer"
                >
                  <Download className="w-4 h-4 text-terracotta" />
                  <span>Descargar comprobante (.txt)</span>
                </button>
                <button
                  onClick={handleReabrir}
                  disabled={procesando}
                  className="btn-tactile w-full card-flat p-3.5 flex items-center justify-center gap-2 text-sm font-semibold text-warn border border-warn/40 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reabrir para seguir escaneando</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {!cargando && !detalle && (
        <div className="p-4 md:p-6">
          <div className="card-flat p-5 text-center">
            <AlertTriangle className="w-8 h-8 text-danger mx-auto mb-2" />
            <p className="text-sm text-ink-soft mb-4">No se pudo cargar la información de este día.</p>
            <button
              onClick={() => {
                setCargando(true);
                getRecepcionDia(fecha)
                  .then(setDetalle)
                  .catch(() => setDetalle(null))
                  .finally(() => setCargando(false));
              }}
              className="btn-tactile w-full h-12 bg-ink hover:bg-terracotta-deep text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
