import React from 'react';
import { PackagePlus, PackageSearch, LayoutGrid, LogOut, ChevronRight } from 'lucide-react';
import { LocalUsuario } from '../types';
import { AppShell, AreaPrincipal } from './ui/AppShell';

interface HomeScreenProps {
  local: LocalUsuario;
  onIniciarRecepcion: () => void;
  onIrAStock: () => void;
  onIrAExhibidora: () => void;
  onLogout: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  local,
  onIniciarRecepcion,
  onIrAStock,
  onIrAExhibidora,
  onLogout,
}) => {
  const handleNav = (area: AreaPrincipal) => {
    if (area === 'stock') onIrAStock();
    if (area === 'exhibidora') onIrAExhibidora();
  };

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
            onClick={onIniciarRecepcion}
            className="btn-tactile md:col-span-1 bg-terracotta hover:bg-terracotta-dark text-white p-5 flex items-center md:flex-col md:items-start gap-4 md:gap-6 cursor-pointer group shadow-md md:justify-between"
            style={{ minHeight: '104px' }}
          >
            <div className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <PackagePlus className="w-7 h-7 text-white" />
            </div>
            <div className="text-left min-w-0">
              <span className="block text-lg font-display font-bold leading-tight">
                Iniciar recepción de hoy
              </span>
              <span className="text-xs text-white/80 font-medium">
                Lista esperada + escáner QR de fábrica
              </span>
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

        <div className="text-center text-[11px] font-ticket text-ink-soft/60 tracking-wide pt-4 border-t border-ink/10">
          Obrador · Gianduia
        </div>
      </div>
    </AppShell>
  );
};
