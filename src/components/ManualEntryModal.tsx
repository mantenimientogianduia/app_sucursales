import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Minus, PackageCheck, Calendar } from 'lucide-react';

type ProductoCatalogo = { idProd: string; nombreProducto: string; categoria: string | null };

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitManual: (data: {
    idProd: string;
    nombreProducto: string;
    cantidad: number;
    venc: string | null;
  }) => void;
  productos: ProductoCatalogo[];
  cargandoProductos: boolean;
}

export const ManualEntryModal: React.FC<ManualEntryModalProps> = ({
  isOpen,
  onClose,
  onSubmitManual,
  productos,
  cargandoProductos,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProdId, setSelectedProdId] = useState<string | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [venc, setVenc] = useState('');

  useEffect(() => {
    if (isOpen && productos.length > 0 && !selectedProdId) {
      setSelectedProdId(productos[0].idProd);
    }
  }, [isOpen, productos, selectedProdId]);

  if (!isOpen) return null;

  const productosFiltrados = productos.filter(p =>
    p.nombreProducto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.idProd.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.categoria || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const productoSeleccionado = productos.find(p => p.idProd === selectedProdId) || productos[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoSeleccionado) return;

    onSubmitManual({
      idProd: productoSeleccionado.idProd,
      nombreProducto: productoSeleccionado.nombreProducto,
      cantidad,
      venc: venc.trim() ? venc.trim() : null,
    });

    setCantidad(1);
    setVenc('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-xs flex flex-col justify-end sm:justify-center p-0 sm:p-4">
      <div className="bg-paper-raised text-ink max-w-md w-full mx-auto max-h-[90vh] flex flex-col shadow-2xl border-t-2 sm:border-2 border-ink/20 overflow-hidden">
        <div className="p-4 bg-terracotta-deep text-paper-raised flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-terracotta flex items-center justify-center">
              <PackageCheck className="w-4.5 h-4.5 text-white" />
            </div>
            <h3 className="text-base font-display font-bold">Carga manual</h3>
          </div>
          <button
            onClick={onClose}
            className="btn-tactile p-2 bg-white/10 hover:bg-white/20 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft mb-1.5">
              1. Seleccionar producto o insumo
            </label>

            <div className="relative mb-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre (ej. Cucuruchos, Vasos...)"
                className="w-full h-12 pl-10 pr-4 bg-paper-sunken border border-ink/15 text-xs text-ink font-medium focus:border-terracotta focus:outline-none"
              />
              <Search className="w-4 h-4 text-ink-soft absolute left-3.5 top-4" />
            </div>

            <div className="max-h-36 overflow-y-auto border border-ink/15 bg-paper-raised divide-y divide-ink/10">
              {cargandoProductos ? (
                <div className="p-3 text-xs text-ink-soft text-center">Cargando catálogo...</div>
              ) : productosFiltrados.length === 0 ? (
                <div className="p-3 text-xs text-ink-soft text-center">No se encontraron productos.</div>
              ) : (
                productosFiltrados.map((prod) => (
                  <button
                    key={prod.idProd}
                    type="button"
                    onClick={() => setSelectedProdId(prod.idProd)}
                    className={`w-full p-3 text-left flex items-center justify-between transition-colors cursor-pointer ${
                      selectedProdId === prod.idProd
                        ? 'bg-terracotta/10 font-semibold border-l-4 border-terracotta'
                        : 'hover:bg-paper-sunken'
                    }`}
                  >
                    <div>
                      <span className="block text-xs text-ink">{prod.nombreProducto}</span>
                      <span className="text-[10px] font-ticket text-ink-soft">{prod.categoria || 'Sin rubro'} · {prod.idProd}</span>
                    </div>
                    {selectedProdId === prod.idProd && (
                      <span className="text-xs text-terracotta font-bold">✓</span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft mb-1.5">
              2. Cantidad recibida
            </label>
            <div className="flex items-center gap-3 bg-paper-sunken p-2 border border-ink/10">
              <button
                type="button"
                onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                className="btn-tactile w-14 h-14 bg-paper-raised hover:bg-ink/10 text-ink font-bold text-xl flex items-center justify-center border border-ink/15 cursor-pointer"
              >
                <Minus className="w-6 h-6" />
              </button>

              <div className="flex-1 text-center">
                <span className="text-2xl font-display font-bold text-ink">{cantidad}</span>
                <span className="block text-[10px] text-ink-soft">unidades</span>
              </div>

              <button
                type="button"
                onClick={() => setCantidad(cantidad + 1)}
                className="btn-tactile w-14 h-14 bg-paper-raised hover:bg-ink/10 text-ink font-bold text-xl flex items-center justify-center border border-ink/15 cursor-pointer"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Vencimiento opcional. La partida/lote no aplica a carga manual:
              el servidor siempre la trata como null (es para insumos sin QR
              de fábrica, que no llevan seguimiento de partida). */}
          <div>
            <label className="block text-[11px] font-semibold text-ink-soft mb-1">Vencimiento (opcional)</label>
            <div className="relative">
              <input
                type="date"
                value={venc}
                onChange={(e) => setVenc(e.target.value)}
                className="w-full h-11 pl-8 pr-2 bg-paper-sunken border border-ink/15 text-xs text-ink"
              />
              <Calendar className="w-3.5 h-3.5 text-ink-soft absolute left-2.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            className="btn-tactile w-full h-14 bg-terracotta hover:bg-terracotta-dark text-white font-semibold text-base cursor-pointer mt-4"
          >
            Agregar a recepción
          </button>
        </form>
      </div>
    </div>
  );
};
