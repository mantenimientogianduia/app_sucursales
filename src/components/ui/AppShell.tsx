import React from 'react';
import { Home, PackageSearch, LayoutGrid } from 'lucide-react';

export type AreaPrincipal = 'inicio' | 'stock' | 'exhibidora';

interface AppShellProps {
  activa: AreaPrincipal;
  onNavegar: (area: AreaPrincipal) => void;
  children: React.ReactNode;
}

const ITEMS: Array<{ key: AreaPrincipal; label: string; Icon: typeof Home }> = [
  { key: 'inicio', label: 'Inicio', Icon: Home },
  { key: 'stock', label: 'Stock', Icon: PackageSearch },
  { key: 'exhibidora', label: 'Exhibidora', Icon: LayoutGrid },
];

/**
 * Layout compartido de las 3 areas principales del local (Inicio/Stock/
 * Exhibidora): barra de navegacion inferior en mobile, riel lateral fijo
 * desde md en adelante. El contenido crece de ancho por breakpoint en vez
 * de quedar angostado al tamano de telefono siempre.
 */
export const AppShell: React.FC<AppShellProps> = ({ activa, onNavegar, children }) => (
  <div className="min-h-screen bg-paper">
    {/* Riel lateral fijo (tablet/desktop) */}
    <nav className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-20 lg:w-60 bg-terracotta-deep text-paper-raised border-r border-black/30 z-30">
      <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-white/10 shrink-0">
        <span className="font-display italic font-bold text-terracotta">
          <span className="lg:hidden text-xl">O</span>
          <span className="hidden lg:inline text-xl">Obrador</span>
        </span>
      </div>
      <div className="flex-1 py-4 flex flex-col gap-1 px-2 lg:px-3">
        {ITEMS.map(({ key, label, Icon }) => {
          const isActive = activa === key;
          return (
            <button
              key={key}
              onClick={() => onNavegar(key)}
              className={`btn-tactile flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors justify-center lg:justify-start ${
                isActive ? 'bg-terracotta text-white' : 'text-paper-raised/60 hover:text-paper-raised hover:bg-white/5'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
              <span className="hidden lg:inline text-sm font-ticket font-semibold uppercase tracking-wide">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>

    {/* Barra de navegacion inferior (mobile) */}
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-terracotta-deep border-t border-black/30 flex shadow-[0_-4px_12px_rgba(0,0,0,0.15)]">
      {ITEMS.map(({ key, label, Icon }) => {
        const isActive = activa === key;
        return (
          <button
            key={key}
            onClick={() => onNavegar(key)}
            className={`btn-tactile flex-1 flex flex-col items-center justify-center gap-1 py-2.5 cursor-pointer transition-colors ${
              isActive ? 'text-white' : 'text-paper-raised/50 hover:text-paper-raised/80'
            }`}
          >
            <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
            <span className={`text-[10px] font-ticket uppercase tracking-wide ${isActive ? 'font-bold' : 'font-medium'}`}>
              {label}
            </span>
            {isActive && <span className="w-1 h-1 rounded-full bg-terracotta" />}
          </button>
        );
      })}
    </nav>

    {/* Contenido: se corre a la derecha del riel desde md, y crece de ancho */}
    <div className="md:pl-20 lg:pl-60 pb-24 md:pb-8">
      <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto min-h-screen relative">{children}</div>
    </div>
  </div>
);
