import React from 'react';

type StampVariant = 'ok' | 'warn' | 'danger' | 'neutral' | 'sage' | 'gold' | 'terracotta';

const VARIANT_COLOR: Record<StampVariant, string> = {
  ok: '#1E5128',
  warn: '#B45309',
  danger: '#B91C1C',
  neutral: '#5A4636',
  sage: '#5C6B45',
  gold: '#A9772F',
  terracotta: '#C1502E',
};

interface StampProps {
  variant: StampVariant;
  children: React.ReactNode;
  className?: string;
}

/** Insignia rotada de doble anillo, como un sello de goma en un ticket. */
export const Stamp: React.FC<StampProps> = ({ variant, children, className = '' }) => (
  <span className={`stamp ${className}`} style={{ color: VARIANT_COLOR[variant] }}>
    {children}
  </span>
);
