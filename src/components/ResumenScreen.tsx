import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowLeft,
  Share2,
  Download,
  Store,
  FileCheck,
  Package
} from 'lucide-react';
import { RecepcionGuardada } from '../types';

interface ResumenScreenProps {
  recepcion: RecepcionGuardada;
  onVolverInicio: () => void;
}

export const ResumenScreen: React.FC<ResumenScreenProps> = ({
  recepcion,
  onVolverInicio
}) => {
  const faltantes = recepcion.reclamos.filter(r => r.tipo === 'faltante');
  const sinCobrar = recepcion.reclamos.filter(r => r.tipo === 'sin_cobrar');

  const handleDescargarComprobante = () => {
    const textoComprobante = `
========================================
TALLER ARTESANAL HELADERO
Comprobante de Recepción de Mercadería
========================================
Código: ${recepcion.id}
Local: ${recepcion.usuarioLocal}
Fecha/Hora: ${recepcion.fecha} ${recepcion.hora} hs

----------------------------------------
RESUMEN GENERAL:
- Total Esperados: ${recepcion.totalesperados} u.
- Recibidos OK: ${recepcion.totalRecibidosOk} u.
- Faltantes: ${recepcion.totalFaltantes} u.
- Sin Cobrar / Extra: ${recepcion.totalSinCobrar} u.

----------------------------------------
DETALLE DE NOVEDADES Y RECLAMOS:
${recepcion.reclamos.length === 0 
  ? 'Sin novedades. Recepción 100% conforme.' 
  : recepcion.reclamos.map(r => `• [${r.tipo.toUpperCase()}] ${r.nombreProducto}: ${r.detalle}`).join('\n')
}

========================================
Firmado digitalmente por el local.
    `.trim();

    const blob = new Blob([textoComprobante], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Recepcion_${recepcion.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F5EDE1] text-[#3B2417] p-4 pb-28 max-w-md mx-auto">
      
      {/* Header Resumen */}
      <div>
        <div className="text-center pt-4 pb-6 border-b border-[#D8C6B3] mb-6">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[#E8DDD0] border border-[#D5C4B1] mb-2">
            <FileCheck className="w-8 h-8 text-[#C1502E]" />
          </div>
          <span className="block text-xs font-semibold uppercase tracking-widest text-[#785E4E]">
            Comprobante de Recepción
          </span>
          <h2 className="text-2xl font-serif font-bold text-[#3B2417] mt-1">
            Recepción Finalizada
          </h2>
          <p className="text-xs text-[#61493B] mt-1">
            {recepcion.id} • {recepcion.fecha} ({recepcion.hora} hs)
          </p>
        </div>

        {/* 1. BLOQUE "RECIBIDO OK" (Verde bosque #1E5128) */}
        <div className="bg-[#EAF4ED] border-2 border-[#1E5128] rounded-3xl p-5 mb-4 shadow-sm">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#1E5128] text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-[#1E5128]">
                Recibido Conforme
              </span>
              <h3 className="text-xl font-serif font-bold text-[#1E5128]">
                {recepcion.totalRecibidosOk} unidades OK
              </h3>
            </div>
          </div>
          <p className="text-xs text-[#1E5128]/80 pl-1">
            Mercadería que coincidió perfectamente con el pedido de fábrica del día.
          </p>
        </div>

        {/* 2. BLOQUE "FALTANTES" (Rojo / Ámbar #B91C1C) */}
        <div className={`rounded-3xl p-5 mb-4 border-2 shadow-sm ${
          faltantes.length > 0
            ? 'bg-[#FDF2F2] border-[#B91C1C]'
            : 'bg-[#FAF5EE] border-[#D8C6B3] opacity-75'
        }`}>
          <div className="flex items-center space-x-3 mb-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              faltantes.length > 0 ? 'bg-[#B91C1C] text-white' : 'bg-[#E8DDD0] text-[#785E4E]'
            }`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <span className={`text-xs uppercase tracking-wider font-bold ${
                faltantes.length > 0 ? 'text-[#B91C1C]' : 'text-[#785E4E]'
              }`}>
                Faltantes
              </span>
              <h3 className={`text-xl font-serif font-bold ${
                faltantes.length > 0 ? 'text-[#B91C1C]' : 'text-[#3B2417]'
              }`}>
                {recepcion.totalFaltantes} unidades no llegaron
              </h3>
            </div>
          </div>

          {faltantes.length > 0 ? (
            <div className="space-y-2 mt-3 pt-3 border-t border-[#B91C1C]/20">
              {faltantes.map((f, idx) => (
                <div key={idx} className="text-xs bg-white/70 p-2.5 rounded-xl border border-red-200">
                  <span className="font-bold text-[#991B1B] block">{f.nombreProducto}</span>
                  <span className="text-[11px] text-red-800">{f.detalle}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#61493B] pl-1">
              ✓ No se registraron faltantes en esta entrega.
            </p>
          )}
        </div>

        {/* 3. BLOQUE "SIN COBRAR / EXTRA" (Informativo, no alarmante) */}
        <div className={`rounded-3xl p-5 mb-6 border-2 shadow-sm ${
          sinCobrar.length > 0
            ? 'bg-[#FEF3C7] border-[#B45309]'
            : 'bg-[#FAF5EE] border-[#D8C6B3] opacity-75'
        }`}>
          <div className="flex items-center space-x-3 mb-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              sinCobrar.length > 0 ? 'bg-[#B45309] text-white' : 'bg-[#E8DDD0] text-[#785E4E]'
            }`}>
              <Info className="w-6 h-6" />
            </div>
            <div>
              <span className={`text-xs uppercase tracking-wider font-bold ${
                sinCobrar.length > 0 ? 'text-[#B45309]' : 'text-[#785E4E]'
              }`}>
                Sin Cobrar / Insumos Extra
              </span>
              <h3 className={`text-xl font-serif font-bold ${
                sinCobrar.length > 0 ? 'text-[#B45309]' : 'text-[#3B2417]'
              }`}>
                {recepcion.totalSinCobrar} unidades ingresadas sin pedido previo
              </h3>
            </div>
          </div>

          {sinCobrar.length > 0 ? (
            <div className="space-y-2 mt-3 pt-3 border-t border-[#B45309]/20">
              {sinCobrar.map((s, idx) => (
                <div key={idx} className="text-xs bg-white/70 p-2.5 rounded-xl border border-amber-200">
                  <span className="font-bold text-[#B45309] block">{s.nombreProducto}</span>
                  <span className="text-[11px] text-amber-900">{s.detalle}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#61493B] pl-1">
              No hubo ítems extra fuera del pedido.
            </p>
          )}
        </div>

        {/* Opciones de Comprobante */}
        <div className="bg-[#FAF5EE] p-4 rounded-2xl border border-[#D8C6B3] flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#3B2417]">
            <Package className="w-4 h-4 text-[#C1502E]" />
            <span>Guardar reporte en el local</span>
          </div>
          <button
            onClick={handleDescargarComprobante}
            className="px-3 py-2 bg-[#E8DDD0] hover:bg-[#D5C4B1] text-[#3B2417] text-xs font-bold rounded-xl flex items-center space-x-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#C1502E]" />
            <span>Descargar TXT</span>
          </button>
        </div>
      </div>

      {/* Botón Volver al Inicio */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#FAF5EE] border-t-2 border-[#D8C6B3] p-4 max-w-md mx-auto shadow-xl">
        <button
          onClick={onVolverInicio}
          className="btn-tactile w-full h-14 bg-[#C1502E] hover:bg-[#A84224] active:bg-[#8F351B] text-white font-bold text-base rounded-2xl shadow-md flex items-center justify-center space-x-2 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
          <span>Volver al Inicio</span>
        </button>
      </div>

    </div>
  );
};
