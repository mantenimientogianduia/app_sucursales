import React, { useState } from 'react';
import { Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { LocalUsuario } from '../types';
import { loginLocal } from '../services/apiService';

interface LoginScreenProps {
  onLoginSuccess: (local: LocalUsuario) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setErrorMsg(null);

    const res = await loginLocal(usuario, clave);
    setCargando(false);

    if (res.ok && res.local) {
      onLoginSuccess(res.local);
    } else {
      setErrorMsg(res.mensaje || 'Credenciales inválidas');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      {/* Franja superior tipo etiqueta de fábrica */}
      <div className="bg-terracotta-deep text-paper-raised px-6 pt-14 pb-10 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 1px, transparent 12px)',
          }}
        />
        <span className="relative block text-[11px] font-ticket uppercase tracking-[0.25em] text-terracotta">
          Obrador · Gianduia
        </span>
        <h1 className="relative text-4xl font-display font-bold italic mt-2 tracking-tight">
          Punto de venta
        </h1>
        <p className="relative text-sm text-paper-raised/70 mt-2 max-w-xs mx-auto">
          Recepción de mercadería y manejo de stock del local.
        </p>
      </div>

      {/* Formulario */}
      <div className="flex-1 flex flex-col justify-center px-5 py-8 max-w-md w-full mx-auto -mt-6">
        <div className="card-flat rounded-none p-6 shadow-lg relative">
          <span className="absolute -top-3 left-6 bg-paper px-2 text-[10px] font-ticket font-bold uppercase tracking-[0.14em] text-ink-soft">
            Acceso de local
          </span>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft mb-1.5">
                Usuario
              </label>
              <div className="relative">
                <User className="w-4.5 h-4.5 text-ink-soft/70 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="ej. suc2"
                  autoCapitalize="none"
                  className="w-full h-14 pl-11 pr-4 bg-paper-sunken border border-ink/15 text-base text-ink font-medium focus:border-terracotta focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4.5 h-4.5 text-ink-soft/70 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-14 pl-11 pr-4 bg-paper-sunken border border-ink/15 text-base text-ink font-medium focus:border-terracotta focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-danger-tint border border-danger text-danger text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="btn-tactile w-full h-14 bg-terracotta hover:bg-terracotta-dark text-white font-semibold text-base flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60"
            >
              {cargando ? (
                <span>Verificando...</span>
              ) : (
                <>
                  <span>Ingresar</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] font-ticket text-ink-soft/70 mt-6 tracking-wide">
          Obrador v1.0 · Gianduia
        </p>
      </div>
    </div>
  );
};
