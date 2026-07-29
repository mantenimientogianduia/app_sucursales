import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, PackageSearch, Boxes, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { FamiliaConStock, ProductoConStock, PartidaDisponible } from '../types';
import {
  getFamiliasConStock,
  getProductosConStock,
  getPartidasDisponibles,
  exhibirLote,
} from '../services/apiService';
import { TicketHeader } from './ui/TicketHeader';
import { BottomNav, AreaPrincipal } from './ui/BottomNav';
import { Stamp } from './ui/Stamp';

interface StockScreenProps {
  onVolver: () => void;
  onIrAExhibidora: () => void;
}

type Nivel = 'familias' | 'productos' | 'partidas';

function formatFecha(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export const StockScreen: React.FC<StockScreenProps> = ({ onVolver, onIrAExhibidora }) => {
  const [nivel, setNivel] = useState<Nivel>('familias');
  const [cargando, setCargando] = useState(true);

  const [familias, setFamilias] = useState<FamiliaConStock[]>([]);
  const [familiaActiva, setFamiliaActiva] = useState<FamiliaConStock | null>(null);
  const [productos, setProductos] = useState<ProductoConStock[]>([]);
  const [productoActivo, setProductoActivo] = useState<ProductoConStock | null>(null);
  const [partidas, setPartidas] = useState<PartidaDisponible[]>([]);

  const [confirmandoLote, setConfirmandoLote] = useState<PartidaDisponible | null>(null);
  const [exhibiendoId, setExhibiendoId] = useState<string | number | null>(null);
  const [mensaje, setMensaje] = useState<{ texto: string; ok: boolean } | null>(null);

  useEffect(() => {
    cargarFamilias();
  }, []);

  useEffect(() => {
    if (mensaje) {
      const t = setTimeout(() => setMensaje(null), 2200);
      return () => clearTimeout(t);
    }
  }, [mensaje]);

  const cargarFamilias = async () => {
    setCargando(true);
    try {
      setFamilias(await getFamiliasConStock());
    } catch (err: any) {
      setMensaje({ texto: err.message || 'No se pudo cargar el stock.', ok: false });
    } finally {
      setCargando(false);
    }
  };

  const abrirFamilia = async (f: FamiliaConStock) => {
    setFamiliaActiva(f);
    setNivel('productos');
    setCargando(true);
    try {
      setProductos(await getProductosConStock(f.familia ? { familia: f.familia } : { sinFamilia: true }));
    } finally {
      setCargando(false);
    }
  };

  const abrirProducto = async (p: ProductoConStock) => {
    setProductoActivo(p);
    setNivel('partidas');
    setCargando(true);
    try {
      setPartidas(await getPartidasDisponibles(p.idProd));
    } finally {
      setCargando(false);
    }
  };

  const recargarPartidas = async () => {
    if (!productoActivo) return;
    setPartidas(await getPartidasDisponibles(productoActivo.idProd));
  };

  const solicitarExhibir = (lote: PartidaDisponible) => {
    if (!lote.esFifo && partidas.some((p) => p.esFifo)) {
      setConfirmandoLote(lote);
      return;
    }
    ejecutarExhibir(lote);
  };

  const ejecutarExhibir = async (lote: PartidaDisponible) => {
    setConfirmandoLote(null);
    setExhibiendoId(lote.idLote);
    try {
      await exhibirLote(lote.idLote);
      setMensaje({ texto: `Exhibida: ${productoActivo?.nombreProducto}`, ok: true });
      await recargarPartidas();
    } catch (err: any) {
      setMensaje({ texto: err.message || 'No se pudo exhibir la partida.', ok: false });
    } finally {
      setExhibiendoId(null);
    }
  };

  const handleNav = (area: AreaPrincipal) => {
    if (area === 'inicio') onVolver();
    if (area === 'exhibidora') onIrAExhibidora();
  };

  const volverAtras = () => {
    if (nivel === 'partidas') {
      setNivel('productos');
      setProductoActivo(null);
      setPartidas([]);
    } else if (nivel === 'productos') {
      setNivel('familias');
      setFamiliaActiva(null);
      setProductos([]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink pb-24 max-w-md mx-auto relative">
      <TicketHeader
        eyebrow="Depósito"
        title={
          nivel === 'familias' ? 'Stock disponible' : nivel === 'productos' ? (familiaActiva?.familia || 'Sin familia') : productoActivo?.nombreProducto || ''
        }
        subtitle={
          nivel === 'familias'
            ? 'Elegí una familia para ver los productos'
            : nivel === 'productos'
            ? `${productos.length} productos con stock`
            : `${partidas.length} partidas sin exhibir`
        }
        onBack={nivel !== 'familias' ? volverAtras : undefined}
      />

      <AnimatePresence>
        {mensaje && (
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            className={`fixed top-20 left-4 right-4 z-40 max-w-md mx-auto p-3 shadow-xl text-sm font-bold text-white flex items-center gap-2 border-2 border-white/30 ${
              mensaje.ok ? 'bg-ok' : 'bg-danger'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="truncate">{mensaje.texto}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 px-4 pt-3">
        {cargando ? (
          <div className="py-16 text-center text-sm text-ink-soft">Cargando...</div>
        ) : nivel === 'familias' ? (
          familias.length === 0 ? (
            <EmptyBlock icon={<Boxes className="w-8 h-8" />} texto="No hay stock sin exhibir en el depósito." />
          ) : (
            <div>
              {familias.map((f, i) => (
                <button
                  key={f.familia || 'sin-familia'}
                  onClick={() => abrirFamilia(f)}
                  className="list-row w-full py-3.5 flex items-center justify-between text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-ticket text-xs text-ink-soft/60 w-6 text-right shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="font-display font-bold text-base text-ink truncate">
                      {f.familia || 'Sin familia'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-ticket text-ink-soft">{f.cantidadProductos} prod.</span>
                    <ChevronRight className="w-4 h-4 text-ink-soft/50 group-hover:text-terracotta transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )
        ) : nivel === 'productos' ? (
          productos.length === 0 ? (
            <EmptyBlock icon={<PackageSearch className="w-8 h-8" />} texto="Sin productos en esta familia." />
          ) : (
            <div>
              {productos.map((p) => (
                <button
                  key={p.idProd}
                  onClick={() => abrirProducto(p)}
                  className="list-row w-full py-3.5 flex items-center justify-between text-left cursor-pointer group"
                >
                  <div className="min-w-0">
                    <span className="font-semibold text-sm text-ink block truncate">{p.nombreProducto}</span>
                    <span className="text-[11px] font-ticket text-ink-soft">{p.idProd}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Stamp variant="sage">{p.partidasDisponibles} part.</Stamp>
                    <ChevronRight className="w-4 h-4 text-ink-soft/50 group-hover:text-terracotta transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )
        ) : partidas.length === 0 ? (
          <EmptyBlock icon={<Boxes className="w-8 h-8" />} texto="No quedan partidas sin exhibir de este producto." />
        ) : (
          <div className="space-y-2.5 pb-4">
            {partidas.map((lote) => (
              <div key={lote.idLote} className="card-flat p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  {lote.esFifo && (
                    <div className="mb-1">
                      <Stamp variant="sage">Más antigua</Stamp>
                    </div>
                  )}
                  {lote.partida && (
                    <span className="block text-[10px] font-ticket text-ink-soft/70 truncate max-w-[150px]" title={lote.partida}>
                      {lote.partida}
                    </span>
                  )}
                  <div className="flex items-center gap-3 text-xs font-ticket text-ink-soft mt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatFecha(lote.timestampRecep)}
                    </span>
                    {lote.venc && <span>vence {formatFecha(lote.venc)}</span>}
                  </div>
                  <span className="text-sm font-bold text-ink block mt-1">{lote.cantidad ?? '—'} u.</span>
                </div>
                <button
                  onClick={() => solicitarExhibir(lote)}
                  disabled={exhibiendoId === lote.idLote}
                  className="btn-tactile shrink-0 h-12 px-4 bg-terracotta hover:bg-terracotta-dark text-white font-semibold text-xs cursor-pointer disabled:opacity-50"
                >
                  {exhibiendoId === lote.idLote ? 'Exhibiendo...' : 'Exhibir'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmación de romper FIFO */}
      <AnimatePresence>
        {confirmandoLote && (
          <div className="fixed inset-0 z-50 bg-ink/70 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              className="bg-paper-raised border-2 border-warn max-w-sm w-full p-5"
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-6 h-6 text-warn shrink-0" />
                <h3 className="font-display font-bold text-lg text-ink">Hay una partida más antigua</h3>
              </div>
              <p className="text-sm text-ink-soft mb-4">
                Esta no es la partida más vieja sin exhibir de este producto. ¿Exhibir esta igual?
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setConfirmandoLote(null)}
                  className="btn-tactile h-12 border border-ink/20 text-ink font-semibold text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => ejecutarExhibir(confirmandoLote)}
                  className="btn-tactile h-12 bg-warn text-white font-semibold text-sm cursor-pointer"
                >
                  Exhibir igual
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BottomNav activa="stock" onNavegar={handleNav} />
    </div>
  );
};

const EmptyBlock: React.FC<{ icon: React.ReactNode; texto: string }> = ({ icon, texto }) => (
  <div className="py-16 flex flex-col items-center text-center text-ink-soft">
    <div className="mb-2 opacity-50">{icon}</div>
    <p className="text-sm max-w-[220px]">{texto}</p>
  </div>
);
