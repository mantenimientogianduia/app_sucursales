import React from 'react';
import { Home, PackageSearch, LayoutGrid } from 'lucide-react';

export type AreaPrincipal = 'inicio' | 'stock' | 'exhibidora';

interface BottomNavProps {
  activa: AreaPrincipal;
  onNavegar: (area: AreaPrincipal) => void;
}

const ITEMS: Array<{ key: AreaPrincipal; label: string; Icon: typeof Home }> = [
  { key: 'inicio', label: 'Inicio', Icon: Home },
  { key: 'stock', label: 'Stock', Icon: PackageSearch },
  { key: 'exhibidora', label: 'Exhibidora', Icon: LayoutGrid },
];

/** Barra de navegación fija entre las 3 áreas principales del local. */
export const BottomNav: React.FC<BottomNavProps> = ({ activa, onNavegar }) => (
  <nav className="fixed bottom-0 left-0 right-0 z-30 bg-terracotta-deep border-t border-black/30 max-w-md mx-auto flex shadow-[0_-4px_12px_rgba(0,0,0,0.15)]">
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
);
