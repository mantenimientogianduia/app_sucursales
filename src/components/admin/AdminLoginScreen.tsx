import React, { useState } from 'react';
import { Lock, User, ArrowRight, AlertCircle, Stamp as StampIcon } from 'lucide-react';
import { UsuarioInterno } from '../../types';
import { loginAdmin } from '../../services/adminApiService';

interface AdminLoginScreenProps {
  onLoginSuccess: (usuario: UsuarioInterno) => void;
}

export const AdminLoginScreen: React.FC<AdminLoginScreenProps> = ({ onLoginSuccess }) => {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setErrorMsg(null);
    const res = await loginAdmin(usuario, password);
    setCargando(false);
    if (res.ok && res.usuario) {
      onLoginSuccess(res.usuario);
    } else {
      setErrorMsg(res.mensaje || 'Credenciales inválidas');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-terracotta-deep text-paper-raised">
      <div className="flex-1 flex flex-col justify-center px-5 py-8 max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gold-tint mb-3">
            <StampIcon className="w-7 h-7 text-gold-dark" />
          </div>
          <span className="block text-[11px] font-ticket uppercase tracking-[0.25em] text-gold">
            Panel interno · Gianduia
          </span>
          <h1 className="text-3xl font-display font-bold italic mt-1">Carta BACHA</h1>
          <p className="text-sm text-paper-raised/60 mt-1 max-w-xs mx-auto">
            Gestión de las 21 posiciones y cambios de sabor.
          </p>
        </div>

        <div className="bg-paper-raised text-ink p-6 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  autoCapitalize="none"
                  className="w-full h-14 pl-11 pr-4 bg-paper-sunken border border-ink/15 text-base text-ink font-medium focus:border-gold focus:outline-none"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-14 pl-11 pr-4 bg-paper-sunken border border-ink/15 text-base text-ink font-medium focus:border-gold focus:outline-none"
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
              className="btn-tactile w-full h-14 bg-ink hover:bg-black text-white font-semibold text-base flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60"
            >
              {cargando ? <span>Verificando...</span> : (
                <>
                  <span>Ingresar</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
