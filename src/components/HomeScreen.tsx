import React, { useEffect, useState } from 'react';
import {
  PackagePlus,
  History,
  Store,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Calendar,
  Clock,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { LocalUsuario, RecepcionGuardada } from '../types';
import { getHistorialRecepciones } from '../services/apiService';

interface HomeScreenProps {
  local: LocalUsuario;
  onIniciarRecepcion: () => void;
  onLogout: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  local,
  onIniciarRecepcion,
  onLogout
}) => {
  const [historial, setHistorial] = useState<RecepcionGuardada[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let active = true;
    getHistorialRecepciones().then((data) => {
      if (active) {
        setHistorial(data);
        setCargando(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 pb-8 max-w-md mx-auto bg-[#F5EDE1] text-[#3B2417]">
      {/* Top Bar / Header del Local */}
      <div>
        <div className="bg-[#FAF5EE] rounded-3xl p-5 border-2 border-[#D8C6B3] shadow-sm mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-[#E8DDD0] border border-[#D5C4B1] flex items-center justify-center shrink-0">
              <Store className="w-6 h-6 text-[#C1502E]" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-[#8C715F]">
                {local.sucursalCodigo}
              </span>
              <h2 className="text-lg font-serif font-bold text-[#3B2417] leading-snug">
                Hola, {local.nombreLocal}
              </h2>
              <p className="text-xs text-[#785E4E]">{local.direccion}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Cerrar Sesión"
            className="p-2.5 rounded-xl bg-[#E8DDD0]/60 hover:bg-[#E8DDD0] text-[#61493B] cursor-pointer transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* ACCIÓN PRINCIPAL — Botón Gigante (Mínimo 56px de alto, ideal para pulgar) */}
        <div className="mb-8">
          <button
            onClick={onIniciarRecepcion}
            className="btn-tactile w-full bg-[#C1502E] hover:bg-[#A84224] active:bg-[#8F351B] text-white p-6 rounded-3xl shadow-lg border-2 border-[#A84224] flex flex-col items-center text-center justify-center space-y-3 cursor-pointer group transition-all"
            style={{ minHeight: '120px' }}
          >
            <div className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center group-hover:scale-105 transition-transform">
              <PackagePlus className="w-8 h-8 text-white" />
            </div>
            <div>
              <span className="block text-2xl font-serif font-bold tracking-tight">
                Iniciar recepción de hoy
              </span>
              <span className="text-xs text-white/80 font-medium">
                Abre la lista esperada y el escáner QR de fábrica
              </span>
            </div>
          </button>
        </div>

        {/* HISTORIAL DE RECEPCIONES ANTERIORES (Solo visual) */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4 text-[#C1502E]" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#61493B]">
                Recepciones Recientes
              </h3>
            </div>
            <span className="text-xs text-[#8C715F]">Últimos registros</span>
          </div>

          {cargando ? (
            <div className="p-6 text-center text-xs text-[#8C715F]">Cargando historial...</div>
          ) : historial.length === 0 ? (
            <div className="p-6 bg-[#FAF5EE] rounded-2xl border border-[#E3D4C4] text-center text-xs text-[#8C715F]">
              No hay recepciones guardadas aún.
            </div>
          ) : (
            <div className="space-y-3">
              {historial.map((rec) => (
                <div
                  key={rec.id}
                  className="bg-[#FAF5EE] rounded-2xl p-4 border border-[#D8C6B3] flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-xs font-semibold text-[#3B2417]">
                      <Calendar className="w-3.5 h-3.5 text-[#8C715F]" />
                      <span>{rec.fecha}</span>
                      <Clock className="w-3.5 h-3.5 text-[#8C715F] ml-1" />
                      <span>{rec.hora} hs</span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs pt-1">
                      <span className="flex items-center text-[#1E5128] font-medium bg-[#1E5128]/10 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {rec.totalRecibidosOk} OK
                      </span>

                      {rec.totalFaltantes > 0 && (
                        <span className="flex items-center text-[#B91C1C] font-medium bg-[#B91C1C]/10 px-2 py-0.5 rounded-md">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {rec.totalFaltantes} Faltante
                        </span>
                      )}

                      {rec.totalSinCobrar > 0 && (
                        <span className="flex items-center text-[#B45309] font-medium bg-[#B45309]/10 px-2 py-0.5 rounded-md">
                          {rec.totalSinCobrar} Extra
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right pl-2">
                    <span className="text-xs font-serif font-bold text-[#3B2417] block">
                      {rec.id}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#8C715F] ml-auto mt-1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-6 text-center text-xs text-[#8C715F] border-t border-[#E3D4C4] mt-6">
        <span>Taller Artesanal Heladero • Recepción de Fábrica</span>
      </div>
    </div>
  );
};
