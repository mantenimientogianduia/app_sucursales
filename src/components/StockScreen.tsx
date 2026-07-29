import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Boxes, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { PartidaConStock } from '../types';
import { getPartidasConStock, exhibirLote } from '../services/apiService';
import { TicketHeader } from './ui/TicketHeader';
import { AppShell, AreaPrincipal } from './ui/AppShell';

interface StockScreenProps {
  onVolver: () => void;
  onIrAExhibidora: () => void;
}

const TODAS = 'todas';
const SIN_FAMILIA = 'sin-familia';

const UNIDADES_CORTAS: Record<string, string> = {
  'KGS.': 'kg',
  'LTS.': 'L',
  UNIDAD: 'u.',
};

function formatCantidad(cantidad: number | null, unidadMedida: string | null): string {
  if (cantidad === null) return '—';
  const unidad = (unidadMedida && UNIDADES_CORTAS[unidadMedida]) || 'u.';
  return `${cantidad} ${unidad}`;
}

function formatFecha(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

// Misma logica que el backend (stockLogic.marcarFifo), para poder
// recalcular al instante que partida queda como "mas antigua" de un
// producto despues de exhibir una, sin tener que recargar toda la lista.
function recalcularFifoDeProducto(partidas: PartidaConStock[], idProd: string): PartidaConStock[] {
  const delProducto = partidas.filter((p) => p.idProd === idProd);
  if (delProducto.length === 0) return partidas;
  const fechaClave = (p: PartidaConStock) => p.fechaFabricacion || p.timestampRecep;
  let indiceMasAntigua = 0;
  for (let i = 1; i < delProducto.length; i += 1) {
    if (new Date(fechaClave(delProducto[i])) < new Date(fechaClave(delProducto[indiceMasAntigua]))) {
      indiceMasAntigua = i;
    }
  }
  const idLoteFifo = delProducto[indiceMasAntigua].idLote;
  return partidas.map((p) => (p.idProd === idProd ? { ...p, esFifo: p.idLote === idLoteFifo } : p));
}

export const StockScreen: React.FC<StockScreenProps> = ({ onVolver, onIrAExhibidora }) => {
  const [partidas, setPartidas] = useState<PartidaConStock[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroFamilia, setFiltroFamilia] = useState<string>(TODAS);
  const [filtroProducto, setFiltroProducto] = useState<string | null>(null);

  const [confirmandoLote, setConfirmandoLote] = useState<PartidaConStock | null>(null);
  const [exhibiendoId, setExhibiendoId] = useState<string | number | null>(null);
  const [mensaje, setMensaje] = useState<{ texto: string; ok: boolean } | null>(null);

  useEffect(() => {
    cargar();
  }, []);

  useEffect(() => {
    if (mensaje) {
      const t = setTimeout(() => setMensaje(null), 2200);
      return () => clearTimeout(t);
    }
  }, [mensaje]);

  const cargar = async () => {
    setCargando(true);
    try {
      setPartidas(await getPartidasConStock());
    } catch (err: any) {
      setMensaje({ texto: err.message || 'No se pudo cargar el stock.', ok: false });
    } finally {
      setCargando(false);
    }
  };

  const familias = useMemo(() => {
    const conteo = new Map<string, number>();
    let sinFamiliaCount = 0;
    for (const p of partidas) {
      if (p.familia) conteo.set(p.familia, (conteo.get(p.familia) || 0) + 1);
      else sinFamiliaCount += 1;
    }
    const lista = [...conteo.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([familia, count]) => ({ valor: familia, label: familia, count }));
    if (sinFamiliaCount > 0) {
      lista.push({ valor: SIN_FAMILIA, label: 'Sin familia', count: sinFamiliaCount });
    }
    return [{ valor: TODAS, label: 'Todas', count: partidas.length }, ...lista];
  }, [partidas]);

  // Partidas de la familia elegida, sin aplicar todavia busqueda ni producto
  // — es la base sobre la que se arma el sub-filtro de productos, para que
  // la lista de productos no cambie mientras el usuario escribe.
  const partidasDeFamilia = useMemo(() => {
    if (filtroFamilia === TODAS) return partidas;
    if (filtroFamilia === SIN_FAMILIA) return partidas.filter((p) => p.familia === null);
    return partidas.filter((p) => p.familia === filtroFamilia);
  }, [partidas, filtroFamilia]);

  const productosDeFamilia = useMemo(() => {
    if (filtroFamilia === TODAS) return [];
    const conteo = new Map<string, { nombreProducto: string; count: number }>();
    for (const p of partidasDeFamilia) {
      const actual = conteo.get(p.idProd);
      if (actual) actual.count += 1;
      else conteo.set(p.idProd, { nombreProducto: p.nombreProducto, count: 1 });
    }
    return [...conteo.entries()]
      .map(([idProd, v]) => ({ idProd, nombreProducto: v.nombreProducto, count: v.count }))
      .sort((a, b) => a.nombreProducto.localeCompare(b.nombreProducto));
  }, [partidasDeFamilia, filtroFamilia]);

  const resultados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return partidasDeFamilia.filter((p) => {
      if (filtroProducto && p.idProd !== filtroProducto) return false;
      if (q && !p.nombreProducto.toLowerCase().includes(q) && !p.idProd.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [partidasDeFamilia, busqueda, filtroProducto]);

  const elegirFamilia = (valor: string) => {
    setFiltroFamilia(valor);
    setFiltroProducto(null);
  };

  const solicitarExhibir = (lote: PartidaConStock) => {
    if (!lote.esFifo) {
      setConfirmandoLote(lote);
      return;
    }
    ejecutarExhibir(lote);
  };

  const ejecutarExhibir = async (lote: PartidaConStock) => {
    setConfirmandoLote(null);
    setExhibiendoId(lote.idLote);
    try {
      await exhibirLote(lote.idLote);
      setMensaje({ texto: `Exhibida: ${lote.nombreProducto}`, ok: true });
      setPartidas((prev) => recalcularFifoDeProducto(prev.filter((p) => p.idLote !== lote.idLote), lote.idProd));
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

  return (
    <AppShell activa="stock" onNavegar={handleNav}>
      <TicketHeader
        eyebrow="Depósito"
        title="Buscar partida"
        subtitle={cargando ? 'Cargando...' : `${resultados.length} de ${partidasDeFamilia.length} partidas`}
      />

      <AnimatePresence>
        {mensaje && (
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            className={`fixed top-20 left-4 right-4 md:left-auto md:right-8 z-40 max-w-md md:w-96 mx-auto md:mx-0 p-3 shadow-xl text-sm font-bold text-white flex items-center gap-2 border-2 border-white/30 ${
              mensaje.ok ? 'bg-ok' : 'bg-danger'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="truncate">{mensaje.texto}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 md:px-6 pt-4 pb-2">
        <div className="relative">
          <Search className="w-4 h-4 text-ink-soft absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar producto por nombre..."
            autoFocus
            className="w-full h-12 pl-10 pr-10 bg-paper-raised border-2 border-ink/15 text-sm text-ink font-medium focus:border-terracotta focus:outline-none"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 md:px-6 pb-4 md:flex md:gap-6 md:items-start">
        {/* FILTRO DE FAMILIA: chips horizontales en mobile, columna lateral desde md */}
        <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-3 md:pb-0 md:w-52 md:shrink-0 -mx-4 px-4 md:mx-0 md:px-0">
          {familias.map((f) => {
            const activo = filtroFamilia === f.valor;
            return (
              <button
                key={f.valor}
                onClick={() => elegirFamilia(f.valor)}
                className={`shrink-0 md:w-full px-3 py-2 text-xs font-ticket font-semibold text-left whitespace-nowrap md:whitespace-normal border transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                  activo
                    ? 'bg-terracotta text-white border-terracotta'
                    : 'bg-paper-raised text-ink-soft border-ink/15 hover:border-terracotta/50'
                }`}
              >
                <span>{f.label}</span>
                <span className={activo ? 'text-white/70' : 'text-ink-soft/50'}>{f.count}</span>
              </button>
            );
          })}
        </div>

        {/* RESULTADOS */}
        <div className="flex-1 min-w-0">
          {/* SUB-FILTRO DE PRODUCTO: aparece al elegir una familia, para no tener que escribir */}
          {!cargando && filtroFamilia !== TODAS && productosDeFamilia.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              <button
                onClick={() => setFiltroProducto(null)}
                className={`px-2.5 py-1.5 text-[11px] font-ticket font-semibold border transition-colors cursor-pointer ${
                  filtroProducto === null
                    ? 'bg-ink text-white border-ink'
                    : 'bg-paper-raised text-ink-soft border-ink/15 hover:border-ink/40'
                }`}
              >
                Todos los productos
              </button>
              {productosDeFamilia.map((p) => {
                const activo = filtroProducto === p.idProd;
                return (
                  <button
                    key={p.idProd}
                    onClick={() => setFiltroProducto(activo ? null : p.idProd)}
                    className={`px-2.5 py-1.5 text-[11px] font-ticket font-semibold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activo
                        ? 'bg-ink text-white border-ink'
                        : 'bg-paper-raised text-ink-soft border-ink/15 hover:border-ink/40'
                    }`}
                  >
                    <span>{p.nombreProducto}</span>
                    <span className={activo ? 'text-white/60' : 'text-ink-soft/50'}>{p.count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {cargando ? (
            <div className="py-16 text-center text-sm text-ink-soft">Cargando...</div>
          ) : resultados.length === 0 ? (
            <EmptyBlock
              icon={<Boxes className="w-8 h-8" />}
              texto={
                partidas.length === 0
                  ? 'No hay stock sin exhibir en el depósito.'
                  : 'Ningún resultado para esta búsqueda.'
              }
            />
          ) : (
            <div>
              {resultados.map((lote) => (
                <div key={lote.idLote} className="list-row py-1.5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-2">
                    {lote.familia && (
                      <span className="shrink-0 text-[9px] font-ticket font-semibold uppercase tracking-wider text-ink-soft bg-paper-sunken px-1.5 py-0.5">
                        {lote.familia}
                      </span>
                    )}
                    <h4 className="text-sm font-semibold text-ink truncate">{lote.nombreProducto}</h4>
                    <span className="shrink-0 text-[11px] font-ticket text-ink-soft">
                      fab {formatFecha(lote.fechaFabricacion || lote.timestampRecep)}
                    </span>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-xs font-bold text-ink">{formatCantidad(lote.cantidad, lote.unidadMedida)}</span>
                    <button
                      onClick={() => solicitarExhibir(lote)}
                      disabled={exhibiendoId === lote.idLote}
                      title={lote.esFifo ? 'Respeta el orden FIFO' : 'Hay una partida más vieja sin exhibir'}
                      className={`btn-tactile h-9 px-3 text-white font-semibold text-xs cursor-pointer disabled:opacity-50 ${
                        lote.esFifo ? 'bg-ok hover:bg-ok/90' : 'bg-warn hover:bg-warn/90'
                      }`}
                    >
                      {exhibiendoId === lote.idLote ? '...' : 'Exhibir'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
                Esta no es la partida más vieja sin exhibir de {confirmandoLote.nombreProducto}. ¿Exhibir esta igual?
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
    </AppShell>
  );
};

const EmptyBlock: React.FC<{ icon: React.ReactNode; texto: string }> = ({ icon, texto }) => (
  <div className="py-16 flex flex-col items-center text-center text-ink-soft">
    <div className="mb-2 opacity-50">{icon}</div>
    <p className="text-sm max-w-[260px]">{texto}</p>
  </div>
);
