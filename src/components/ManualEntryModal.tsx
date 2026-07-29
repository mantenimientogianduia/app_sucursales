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

    // Resetear form para la próxima
    setCantidad(1);
    setVenc('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#3B2417]/70 backdrop-blur-xs flex flex-col justify-end sm:justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-[#FAF5EE] text-[#3B2417] rounded-t-3xl sm:rounded-3xl max-w-md w-full mx-auto max-h-[90vh] flex flex-col shadow-2xl border-2 border-[#D8C6B3] overflow-hidden">
        
        {/* Header Modal */}
        <div className="p-4 bg-[#E8DDD0] border-b border-[#D5C4B1] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#C1502E] flex items-center justify-center text-white">
              <PackageCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-display font-bold text-[#3B2417]">
              Carga Manual de Producto
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#FAF5EE] hover:bg-[#D5C4B1] text-[#61493B] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {/* Buscador de producto */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#61493B] mb-1.5">
              1. Seleccionar Producto o Insumo
            </label>

            <div className="relative mb-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre (ej. Cucuruchos, Vasos...)"
                className="w-full h-12 pl-10 pr-4 bg-[#FAF5EE] border-2 border-[#CBB7A3] rounded-2xl text-xs text-[#3B2417] font-medium focus:border-[#C1502E] focus:outline-none"
              />
              <Search className="w-4 h-4 text-[#8C715F] absolute left-3.5 top-4" />
            </div>

            <div className="max-h-36 overflow-y-auto border-2 border-[#D8C6B3] rounded-2xl bg-white divide-y divide-[#E3D4C4]">
              {cargandoProductos ? (
                <div className="p-3 text-xs text-[#8C715F] text-center">Cargando catálogo...</div>
              ) : productosFiltrados.length === 0 ? (
                <div className="p-3 text-xs text-[#8C715F] text-center">No se encontraron productos.</div>
              ) : (
                productosFiltrados.map((prod) => (
                  <button
                    key={prod.idProd}
                    type="button"
                    onClick={() => setSelectedProdId(prod.idProd)}
                    className={`w-full p-3 text-left flex items-center justify-between transition-colors cursor-pointer ${
                      selectedProdId === prod.idProd
                        ? 'bg-[#C1502E]/10 font-semibold border-l-4 border-[#C1502E]'
                        : 'hover:bg-[#FAF5EE]'
                    }`}
                  >
                    <div>
                      <span className="block text-xs text-[#3B2417]">{prod.nombreProducto}</span>
                      <span className="text-[10px] text-[#8C715F]">{prod.categoria || 'Sin rubro'} • {prod.idProd}</span>
                    </div>
                    {selectedProdId === prod.idProd && (
                      <span className="text-xs text-[#C1502E] font-bold">Seleccionado</span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Cantidad (Contador Grande 56px de alto) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#61493B] mb-1.5">
              2. Cantidad Recibida
            </label>
            <div className="flex items-center space-x-3 bg-[#E8DDD0]/50 p-2 rounded-2xl border border-[#D5C4B1]">
              <button
                type="button"
                onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                className="btn-tactile w-14 h-14 bg-[#FAF5EE] hover:bg-[#D5C4B1] active:bg-[#C5B4A3] text-[#3B2417] rounded-xl font-bold text-xl flex items-center justify-center border border-[#CBB7A3] shadow-xs cursor-pointer"
              >
                <Minus className="w-6 h-6" />
              </button>

              <div className="flex-1 text-center">
                <span className="text-2xl font-display font-bold text-[#3B2417]">{cantidad}</span>
                <span className="block text-[10px] text-[#8C715F]">unidades</span>
              </div>

              <button
                type="button"
                onClick={() => setCantidad(cantidad + 1)}
                className="btn-tactile w-14 h-14 bg-[#FAF5EE] hover:bg-[#D5C4B1] active:bg-[#C5B4A3] text-[#3B2417] rounded-xl font-bold text-xl flex items-center justify-center border border-[#CBB7A3] shadow-xs cursor-pointer"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Vencimiento opcional. La partida/lote no aplica a carga manual:
              el servidor siempre la trata como null (es para insumos sin QR
              de fábrica, que no llevan seguimiento de partida). */}
          <div className="grid grid-cols-1 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-[#61493B] mb-1">
                Vencimiento (Opcional)
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={venc}
                  onChange={(e) => setVenc(e.target.value)}
                  className="w-full h-11 pl-8 pr-2 bg-[#FAF5EE] border border-[#CBB7A3] rounded-xl text-xs text-[#3B2417]"
                />
                <Calendar className="w-3.5 h-3.5 text-[#8C715F] absolute left-2.5 top-3.5" />
              </div>
            </div>
          </div>

          {/* Botón Guardar */}
          <button
            type="submit"
            className="btn-tactile w-full h-14 bg-[#C1502E] hover:bg-[#A84224] text-white font-semibold text-base rounded-2xl shadow-md cursor-pointer mt-4"
          >
            Agregar a Recepción
          </button>
        </form>

      </div>
    </div>
  );
};
