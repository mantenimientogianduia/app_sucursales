import React, { useEffect, useState } from 'react';
import { LogOut, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { UsuarioInterno, PosicionVigente, CambioPendiente } from '../../types';
import { getPosicionesConAlertas, confirmarRetiro, logoutAdmin } from '../../services/adminApiService';
import { PosicionDetalleModal } from './PosicionDetalleModal';

interface AdminPosicionesScreenProps {
  usuario: UsuarioInterno;
  onLogout: () => void;
}

const TOTAL_POSICIONES = 21;

export const AdminPosicionesScreen: React.FC<AdminPosicionesScreenProps> = ({ usuario, onLogout }) => {
  const [posiciones, setPosiciones] = useState<PosicionVigente[]>([]);
  const [alertas, setAlertas] = useState<CambioPendiente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [posicionAbierta, setPosicionAbierta] = useState<number | null>(null);
  const [confirmandoAlerta, setConfirmandoAlerta] = useState<number | string | null>(null);

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await getPosicionesConAlertas();
      setPosiciones(data.posiciones);
      setAlertas(data.alertas);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleLogout = async () => {
    await logoutAdmin();
    onLogout();
  };

  const handleConfirmarRetiro = async (idCambio: number | string) => {
    setConfirmandoAlerta(idCambio);
    try {
      await confirmarRetiro(idCambio);
      await cargar();
    } finally {
      setConfirmandoAlerta(null);
    }
  };

  const ocupantesDe = (pos: number) => posiciones.filter((p) => p.posicion === pos);

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink pb-8 max-w-lg mx-auto relative">
      <div className="ticket-perforation bg-ink text-paper-raised px-5 pt-8 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-ticket uppercase tracking-[0.2em] text-gold">
              Panel interno · {usuario.usuario}
            </span>
            <h1 className="text-2xl font-display font-bold italic mt-0.5">Carta BACHA</h1>
          </div>
          <button
            onClick={handleLogout}
            className="btn-tactile w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-4">
        {cargando ? (
          <div className="py-16 text-center text-sm text-ink-soft">Cargando...</div>
        ) : (
          <>
            {/* Alertas de cambio completo */}
            {alertas.length > 0 && (
              <div className="mb-5 space-y-2">
                {alertas.map((a) => (
                  <div key={a.idCambio} className="card-flat border-l-4 border-l-warn p-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-warn shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-warn block">
                          Posición {String(a.posicion).padStart(2, '0')} lista para completar
                        </span>
                        <span className="text-[11px] text-ink-soft block truncate">
                          {a.idProdViejo} ya no tiene stock en ninguna heladería
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleConfirmarRetiro(a.idCambio)}
                      disabled={confirmandoAlerta === a.idCambio}
                      className="btn-tactile shrink-0 h-10 px-3 bg-warn text-white text-xs font-semibold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {confirmandoAlerta === a.idCambio ? '...' : 'Confirmar'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Pegboard de 21 posiciones */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {Array.from({ length: TOTAL_POSICIONES }, (_, i) => i + 1).map((pos) => {
                const ocupantes = ocupantesDe(pos);
                const enTransicion = ocupantes.length > 1;
                return (
                  <button
                    key={pos}
                    onClick={() => setPosicionAbierta(pos)}
                    className={`peg p-2.5 flex flex-col items-start justify-between text-left cursor-pointer transition-colors ${
                      enTransicion ? 'border-warn border-2' : ocupantes.length === 0 ? 'opacity-55 hover:opacity-100' : 'hover:border-gold'
                    }`}
                  >
                    <span className="peg-num text-xs text-terracotta">{String(pos).padStart(2, '0')}</span>
                    {ocupantes.length === 0 ? (
                      <span className="text-[10px] text-ink-soft/60 font-ticket">vacía</span>
                    ) : (
                      ocupantes.map((o) => (
                        <span key={o.idProd} className="text-[11px] font-semibold text-ink leading-tight line-clamp-2 block">
                          {o.nombreProducto}
                        </span>
                      ))
                    )}
                    {enTransicion && (
                      <span className="text-[9px] font-ticket text-warn mt-0.5">en transición</span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      <PosicionDetalleModal
        posicion={posicionAbierta}
        ocupantes={posicionAbierta ? ocupantesDe(posicionAbierta) : []}
        onClose={() => setPosicionAbierta(null)}
        onCambioAnunciado={cargar}
      />
    </div>
  );
};
