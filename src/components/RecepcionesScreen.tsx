import React from 'react';
import { ArrowLeft, ClipboardList, Clock, CheckCircle2, AlertTriangle, Info, ChevronRight } from 'lucide-react';
import { RecepcionResumen } from '../types';

interface RecepcionesScreenProps {
  recepciones: RecepcionResumen[];
  cargando: boolean;
  onVolver: () => void;
  onAbrir: (recepcion: RecepcionResumen) => void;
}

function formatFechaCorta(fechaIso: string): string {
  const hoy = new Date();
  const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);
  const ayerStr = `${ayer.getFullYear()}-${String(ayer.getMonth() + 1).padStart(2, '0')}-${String(ayer.getDate()).padStart(2, '0')}`;

  if (fechaIso === hoyStr) return 'Hoy';
  if (fechaIso === ayerStr) return 'Ayer';
  const [, m, d] = fechaIso.split('-');
  return `${d}/${m}`;
}

function formatHora(timestamp: string | null): string {
  if (!timestamp) return '';
  return new Date(timestamp).toTimeString().slice(0, 5);
}

export const RecepcionesScreen: React.FC<RecepcionesScreenProps> = ({
  recepciones,
  cargando,
  onVolver,
  onAbrir,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink max-w-md md:max-w-3xl lg:max-w-5xl mx-auto">
      <div className="ticket-perforation bg-terracotta-deep text-paper-raised px-5 pt-8 pb-6">
        <button
          onClick={onVolver}
          className="btn-tactile w-9 h-9 -ml-2 mb-3 rounded-full bg-black/15 hover:bg-black/25 flex items-center justify-center cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="block text-[10px] font-ticket uppercase tracking-[0.2em] text-terracotta">
          Últimos 7 días
        </span>
        <h1 className="text-2xl font-display font-bold italic mt-0.5">Recepciones recientes</h1>
      </div>

      <div className="p-4 md:p-6 space-y-2">
        {cargando && (
          <div className="text-center text-sm text-ink-soft py-10">Cargando recepciones…</div>
        )}

        {!cargando && recepciones.length === 0 && (
          <div className="card-flat p-6 text-center">
            <ClipboardList className="w-8 h-8 text-ink-soft/40 mx-auto mb-2" />
            <p className="text-sm text-ink-soft">No hay recepciones en los últimos 7 días.</p>
          </div>
        )}

        {!cargando &&
          recepciones.map((r) => {
            const enCurso = r.estado === 'en_curso';
            return (
              <button
                key={String(r.idRecepcion)}
                onClick={() => onAbrir(r)}
                className="btn-tactile card-flat w-full p-4 flex items-center gap-3 cursor-pointer text-left"
              >
                <div className="w-12 h-12 shrink-0 rounded-full bg-paper-sunken flex flex-col items-center justify-center">
                  <span className="text-[10px] font-ticket uppercase text-ink-soft leading-none">
                    {formatFechaCorta(r.fecha)}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-ticket font-bold uppercase tracking-wide px-1.5 py-0.5 ${
                        enCurso ? 'bg-warn-tint text-warn' : 'bg-sage-tint text-sage-dark'
                      }`}
                    >
                      {enCurso ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                      {enCurso ? 'En curso' : 'Cerrada'}
                    </span>
                    {r.timestampInicio && (
                      <span className="text-[11px] font-ticket text-ink-soft/70">
                        {formatHora(r.timestampInicio)}
                        {r.timestampFin ? ` – ${formatHora(r.timestampFin)}` : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-ink mt-1">
                    {r.totalEscaneados} partida{r.totalEscaneados === 1 ? '' : 's'} escaneada
                    {r.totalEscaneados === 1 ? '' : 's'}
                  </p>
                  {(r.totalFaltantes > 0 || r.totalSinCobrar > 0) && (
                    <div className="flex items-center gap-3 mt-1">
                      {r.totalFaltantes > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-ticket text-danger">
                          <AlertTriangle className="w-3 h-3" />
                          {r.totalFaltantes} faltante{r.totalFaltantes === 1 ? '' : 's'}
                        </span>
                      )}
                      {r.totalSinCobrar > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-ticket text-warn">
                          <Info className="w-3 h-3" />
                          {r.totalSinCobrar} sin cobrar
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <ChevronRight className="w-4 h-4 text-ink-soft/50 shrink-0" />
              </button>
            );
          })}
      </div>
    </div>
  );
};
