import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface TicketHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  dark?: boolean;
}

/**
 * Encabezado tipo "cabecera de ticket de obrador": franja sólida con
 * remate perforado abajo, en vez de una tarjeta redondeada flotante.
 */
export const TicketHeader: React.FC<TicketHeaderProps> = ({
  eyebrow,
  title,
  subtitle,
  onBack,
  right,
  dark = true,
}) => {
  return (
    <div
      className={`ticket-perforation sticky top-0 z-30 shadow-md ${
        dark ? 'bg-terracotta-deep text-paper-raised' : 'bg-paper-raised text-ink border-b border-ink/10'
      }`}
    >
      <div className="p-4 flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="btn-tactile shrink-0 w-11 h-11 rounded-full flex items-center justify-center cursor-pointer bg-black/15 hover:bg-black/25"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <span className={`block text-[10px] font-ticket font-semibold uppercase tracking-[0.14em] ${dark ? 'text-paper-raised/60' : 'text-ink-soft'}`}>
              {eyebrow}
            </span>
          )}
          <h1 className="text-xl font-display font-bold leading-tight truncate">{title}</h1>
          {subtitle && (
            <p className={`text-xs mt-0.5 truncate ${dark ? 'text-paper-raised/70' : 'text-ink-soft'}`}>{subtitle}</p>
          )}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
    </div>
  );
};
