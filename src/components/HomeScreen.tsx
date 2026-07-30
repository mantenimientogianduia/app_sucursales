import React from 'react';
import {
  PackagePlus,
  PackageSearch,
  LayoutGrid,
  LogOut,
  ChevronRight,
  Clock,
  CheckCircle2,
  ClipboardList,
} from 'lucide-react';
import { LocalUsuario, RecepcionResumen } from '../types';
import { RecepcionDiaDetalle } from '../services/apiService';
import { AppShell, AreaPrincipal } from './ui/AppShell';

interface HomeScreenProps {
  local: LocalUsuario;
  recepcionHoy: RecepcionDiaDetalle | null;
  cargandoRecepcionHoy: boolean;
  historial: RecepcionResumen[];
  cargandoHistorial: boolean;
  onAbrirDiaDeHoy: () => void;
  onAbrirDia: (fecha: string) => void;
  onVerHistorialCompleto: () => void;
  onIrAStock: () => void;
  onIrAExhibidora: () => void;
  onLogout: () => void;
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

export const HomeScreen: React.FC<HomeScreenProps> = ({
  local,
  recepcionHoy,
  cargandoRecepcionHoy,
  historial,
  cargandoHistorial,
  onAbrirDiaDeHoy,
  onAbrirDia,
  onVerHistorialCompleto,
  onIrAStock,
  onIrAExhibidora,
  onLogout,
}) => {
  const handleNav = (area: AreaPrincipal) => {
    if (area === 'stock') onIrAStock();
    if (area === 'exhibidora') onIrAExhibidora();
  };

  const recientes = historial.slice(0, 4);

  // El estado de "hoy" (nada / en_curso / cerrada) lo resuelve el servidor
  // via GET /api/recepciones/hoy — no se infiere revisando el historial de
  // 7 días.
  const estadoHoy = recepcionHoy?.recepcion?.estado ?? null;
  const totalEscaneadosHoy = recepcionHoy?.escaneados.length ?? 0;

  let ctaLabel = 'Iniciar recepción de hoy';
  let ctaSub = 'Lista esperada + escáner QR de fábrica';
  let ctaBg = 'bg-terracotta hover:bg-terracotta-dark';
  let ctaIcon = <PackagePlus className="w-7 h-7 text-white" />;

  if (estadoHoy === 'en_curso') {
    ctaLabel = 'Continuar recepción';
    ctaSub = `${totalEscaneadosHoy} partida${totalEscaneadosHoy === 1 ? '' : 's'} ya escaneada${
      totalEscaneadosHoy === 1 ? '' : 's'
    }`;
    ctaBg = 'bg-warn hover:brightness-95';
    ctaIcon = <Clock className="w-7 h-7 text-white" />;
  } else if (estadoHoy === 'cerrada') {
    ctaLabel = 'Ver recepción de hoy';
    ctaSub = 'Ya se recibió hoy';
    ctaBg = 'bg-sage hover:brightness-95';
    ctaIcon = <CheckCircle2 className="w-7 h-7 text-white" />;
  }

  return (
    <AppShell activa="inicio" onNavegar={handleNav}>
      {/* Cabecera del local */}
      <div className="ticket-perforation bg-terracotta-deep text-paper-raised px-5 pt-8 pb-6">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <span className="block text-[10px] font-ticket uppercase tracking-[0.2em] text-terracotta">
              {local.sucursalCodigo}
            </span>
            <h1 className="text-2xl md:text-3xl font-display font-bold italic truncate mt-0.5">
              {local.nombreLocal}
            </h1>
          </div>
          <button
            onClick={onLogout}
            title="Cerrar sesión"
            className="btn-tactile shrink-0 w-11 h-11 rounded-full bg-black/15 hover:bg-black/25 flex items-center justify-center cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-4 md:p-6">
        {/* Accesos principales: fila horizontal en mobile, grilla pareja desde md */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <button
            onClick={onAbrirDiaDeHoy}
            disabled={cargandoRecepcionHoy}
            className={`btn-tactile md:col-span-1 text-white p-5 flex items-center md:flex-col md:items-start gap-4 md:gap-6 cursor-pointer group shadow-md md:justify-between disabled:opacity-60 disabled:cursor-wait ${ctaBg}`}
            style={{ minHeight: '104px' }}
          >
            <div className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              {ctaIcon}
            </div>
            <div className="text-left min-w-0">
              <span className="block text-lg font-display font-bold leading-tight">{ctaLabel}</span>
              <span className="text-xs text-white/80 font-medium">{ctaSub}</span>
            </div>
            <ChevronRight className="w-5 h-5 ml-auto md:ml-0 shrink-0 opacity-70" />
          </button>

          <button
            onClick={onIrAStock}
            className="btn-tactile card-flat p-4 flex flex-col items-start gap-2 cursor-pointer hover:border-sage/50 transition-colors md:justify-between"
            style={{ minHeight: '112px' }}
          >
            <div className="w-10 h-10 rounded-full bg-sage-tint flex items-center justify-center">
              <PackageSearch className="w-5 h-5 text-sage-dark" />
            </div>
            <span className="text-sm font-display font-bold text-ink leading-tight text-left">
              Stock del depósito
            </span>
            <span className="text-[11px] text-ink-soft text-left">Exhibir partidas al mostrador</span>
          </button>

          <button
            onClick={onIrAExhibidora}
            className="btn-tactile card-flat p-4 flex flex-col items-start gap-2 cursor-pointer hover:border-gold/50 transition-colors md:justify-between"
            style={{ minHeight: '112px' }}
          >
            <div className="w-10 h-10 rounded-full bg-gold-tint flex items-center justify-center">
              <LayoutGrid className="w-5 h-5 text-gold-dark" />
            </div>
            <span className="text-sm font-display font-bold text-ink leading-tight text-left">
              Exhibidora
            </span>
            <span className="text-[11px] text-ink-soft text-left">Qué está exhibido ahora</span>
          </button>
        </div>

        {/* Recepciones recientes */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-display font-bold uppercase tracking-wider text-ink-soft">
              Recepciones recientes
            </h2>
            {historial.length > 0 && (
              <button
                onClick={onVerHistorialCompleto}
                className="text-[11px] font-ticket font-semibold text-terracotta hover:underline cursor-pointer"
              >
                Ver todas
              </button>
            )}
          </div>

          {cargandoHistorial && (
            <div className="text-center text-xs text-ink-soft py-4">Cargando…</div>
          )}

          {!cargandoHistorial && recientes.length === 0 && (
            <div className="card-flat p-4 flex items-center gap-3 text-ink-soft">
              <ClipboardList className="w-5 h-5 shrink-0 opacity-50" />
              <span className="text-xs">No hay recepciones guardadas en los últimos 7 días.</span>
            </div>
          )}

          {!cargandoHistorial && recientes.length > 0 && (
            <div className="space-y-1.5">
              {recientes.map((r) => {
                const pendiente = r.estado === 'pendiente';
                const enCurso = r.estado === 'en_curso';
                return (
                  <button
                    key={r.fecha}
                    onClick={() => onAbrirDia(r.fecha)}
                    className="btn-tactile card-flat w-full p-3 flex items-center gap-3 cursor-pointer text-left"
                  >
                    <span className="text-[10px] font-ticket uppercase text-ink-soft w-9 shrink-0">
                      {formatFechaCorta(r.fecha)}
                    </span>
                    <span
                      className={`text-[10px] font-ticket font-bold uppercase tracking-wide px-1.5 py-0.5 shrink-0 ${
                        pendiente
                          ? 'bg-danger-tint text-danger'
                          : enCurso
                          ? 'bg-warn-tint text-warn'
                          : 'bg-sage-tint text-sage-dark'
                      }`}
                    >
                      {pendiente ? 'Sin recepcionar' : enCurso ? 'En curso' : 'Cerrada'}
                    </span>
                    <span className="text-xs text-ink flex-1 truncate">
                      {pendiente
                        ? `${r.totalRemitos} remito${r.totalRemitos === 1 ? '' : 's'}`
                        : `${r.totalEscaneados} partida${r.totalEscaneados === 1 ? '' : 's'} escaneada${
                            r.totalEscaneados === 1 ? '' : 's'
                          }`}
                    </span>
                    <ChevronRight className="w-4 h-4 text-ink-soft/50 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="text-center text-[11px] font-ticket text-ink-soft/60 tracking-wide pt-4 border-t border-ink/10">
          Obrador · Gianduia
        </div>
      </div>
    </AppShell>
  );
};
