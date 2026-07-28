import React, { useState } from 'react';
import { Store, Lock, ArrowRight, ShieldCheck, Info } from 'lucide-react';
import { LocalUsuario } from '../types';
import { loginLocal } from '../services/apiService';

interface LoginScreenProps {
  onLoginSuccess: (local: LocalUsuario) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [usuario, setUsuario] = useState('gianduia_centro');
  const [clave, setClave] = useState('123456');
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

  const handleDemoFill = () => {
    setUsuario('gianduia_centro');
    setClave('123456');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-5 max-w-md mx-auto bg-[#F5EDE1] text-[#3B2417]">
      {/* Header Marca / Taller Artesanal */}
      <div className="pt-8 pb-4 text-center">
        <div className="inline-flex items-[#3B2417] justify-center p-3 rounded-2xl bg-[#E8DDD0] border border-[#D5C4B1] mb-3 shadow-sm">
          <Store className="w-10 h-10 text-[#C1502E]" />
        </div>
        <span className="block text-xs uppercase tracking-widest text-[#785E4E] font-semibold mb-1">
          Control de Depósito
        </span>
        <h1 className="text-3xl font-serif font-bold text-[#3B2417] tracking-tight">
          Taller Artesanal Heladero
        </h1>
        <p className="text-sm text-[#61493B] mt-1 max-w-xs mx-auto">
          Ingreso de recepción de mercadería para locales y sucursales.
        </p>
      </div>

      {/* Formulario de Login */}
      <div className="bg-[#FAF5EE] rounded-3xl p-6 border-2 border-[#D8C6B3] shadow-md my-auto">
        <div className="flex items-center space-x-2 pb-4 mb-4 border-b border-[#E3D4C4]">
          <ShieldCheck className="w-5 h-5 text-[#C1502E]" />
          <h2 className="text-base font-semibold text-[#3B2417]">
            Acceso Sucursal
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#61493B] mb-1.5">
              Usuario de Local
            </label>
            <div className="relative">
              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="ej. gianduia_centro"
                className="w-full h-14 pl-12 pr-4 bg-[#FAF5EE] border-2 border-[#CBB7A3] rounded-2xl text-base text-[#3B2417] font-medium focus:border-[#C1502E] focus:outline-none transition-colors"
                required
              />
              <Store className="w-5 h-5 text-[#8C715F] absolute left-4 top-4" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#61493B] mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                type="password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                placeholder="••••••••"
                className="w-full h-14 pl-12 pr-4 bg-[#FAF5EE] border-2 border-[#CBB7A3] rounded-2xl text-base text-[#3B2417] font-medium focus:border-[#C1502E] focus:outline-none transition-colors"
                required
              />
              <Lock className="w-5 h-5 text-[#8C715F] absolute left-4 top-4" />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-[#F8D7DA] border border-[#B91C1C] text-[#991B1B] text-xs font-medium rounded-xl flex items-center space-x-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="btn-tactile w-full h-14 bg-[#C1502E] hover:bg-[#A84224] active:bg-[#8F351B] text-white font-semibold text-base rounded-2xl shadow-md flex items-center justify-center space-x-2 transition-colors cursor-pointer mt-2"
          >
            {cargando ? (
              <span>Verificando...</span>
            ) : (
              <>
                <span>Ingresar al Local</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Demo Quick Button */}
        <div className="mt-4 pt-4 border-t border-[#E3D4C4] text-center">
          <button
            type="button"
            onClick={handleDemoFill}
            className="text-xs font-medium text-[#C1502E] hover:underline cursor-pointer"
          >
            Usar credenciales de demostración (Heladería La Gianduia)
          </button>
        </div>
      </div>

      {/* Footer Utilitario */}
      <div className="py-4 text-center text-xs text-[#8C715F]">
        <span>PWA Recepción v2.4 • Taller Artesanal Heladero</span>
      </div>
    </div>
  );
};
