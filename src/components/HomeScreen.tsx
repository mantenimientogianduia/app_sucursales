import React from 'react';
import { PackagePlus, PackageSearch, LayoutGrid, LogOut, ChevronRight } from 'lucide-react';
import { LocalUsuario } from '../types';
import { BottomNav, AreaPrincipal } from './ui/BottomNav';

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
    <div className="min-h-screen flex flex-col bg-paper text-ink pb-24">
      {/* Cabecera del local */}
      <div className="ticket-perforation bg-terracotta-deep text-paper-raised px-5 pt-8 pb-6">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <span className="block text-[10px] font-ticket uppercase tracking-[0.2em] text-terracotta">
              {local.sucursalCodigo}
            </span>
            <h1 className="text-2xl font-display font-bold italic truncate mt-0.5">
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

      <div className="p-4 max-w-md w-full mx-auto flex-1">
        {/* Acción principal: Recepción */}
        <button
          onClick={onIniciarRecepcion}
          className="btn-tactile w-full bg-terracotta hover:bg-terracotta-dark text-white p-5 flex items-center gap-4 cursor-pointer group mb-3 shadow-md"
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
          <ChevronRight className="w-5 h-5 ml-auto shrink-0 opacity-70" />
        </button>

        {/* Accesos a Stock y Exhibidora */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={onIrAStock}
            className="btn-tactile card-flat p-4 flex flex-col items-start gap-2 cursor-pointer hover:border-sage/50 transition-colors"
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
            className="btn-tactile card-flat p-4 flex flex-col items-start gap-2 cursor-pointer hover:border-gold/50 transition-colors"
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

      <BottomNav activa="inicio" onNavegar={handleNav} />
    </div>
  );
};
