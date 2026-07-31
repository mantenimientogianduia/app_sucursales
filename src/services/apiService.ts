import {
  ItemEsperado,
  ItemEscaneado,
  Reclamo,
  LocalUsuario,
  RecepcionGuardada,
  RecepcionResumen,
  VentaDia,
  PartidaConStock,
  ExhibidoBacha,
  ExhibidoResto,
  HistorialExhibicion
} from '../types';

/**
 * Servicio API real: habla con el backend app-heladerias-recepcion
 * (POST /api/login, /api/recepciones, /api/recepciones/:id/escaneos,
 * /api/recepciones/:id/finalizar, GET /api/productos).
 */

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001';

const STORAGE_KEYS = {
  TOKEN: 'heladeria_token_v1',
  SESSION: 'heladeria_session_v1',
};

// Id de la recepcion en curso (solo tiene sentido una a la vez por pestaña).
let idRecepcionActual: number | string | null = null;

function getToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && token) {
    // Token vencido o invalido: limpiar sesion y avisar a App.tsx para
    // volver a la pantalla de login, en vez de dejar que cada pantalla
    // muestre un estado vacio enganoso.
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    window.dispatchEvent(new CustomEvent('sesion-local-expirada'));
  }

  if (!res.ok) {
    throw new Error(data.error || `Error de red (${res.status})`);
  }
  return data;
}

/**
 * Autenticación de Local
 */
export async function loginLocal(
  usuario: string,
  clave: string
): Promise<{ ok: boolean; local?: LocalUsuario; mensaje?: string }> {
  if (!usuario.trim() || !clave.trim()) {
    return { ok: false, mensaje: 'Por favor ingrese usuario y contraseña del local.' };
  }

  try {
    const data = await apiFetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ usuario, password: clave }),
    });

    const local: LocalUsuario = {
      id: data.idCliente,
      nombreLocal: data.nombreLocal || data.idCliente,
      direccion: '',
      sucursalCodigo: usuario,
    };

    localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(local));
    return { ok: true, local };
  } catch (err: any) {
    return { ok: false, mensaje: err.message || 'Usuario o contraseña incorrectos para este local.' };
  }
}

export async function getSesionActual(): Promise<LocalUsuario | null> {
  if (!getToken()) return null;
  const data = localStorage.getItem(STORAGE_KEYS.SESSION);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function logoutLocal(): Promise<void> {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.SESSION);
  idRecepcionActual = null;
}

function mapEsperadoRow(e: any): ItemEsperado {
  return {
    idProd: e.idProd,
    nombreProducto: e.nombreProducto || e.idProd,
    categoria: null,
    partida: e.partida,
    cantidad: e.cantidad,
    venc: e.venc,
  };
}

// Misma regla de matching que usa el backend (checklist.js): una captura con
// partida solo matchea un esperado con esa misma partida; una captura sin
// partida matchea por producto contra un esperado tambien sin partida. Hace
// falta reproducirla acá porque listLotesDeRecepcion no devuelve un flag
// "matched" precalculado — solo la respuesta del POST de escaneo lo trae.
function calcularMatched(fila: { idProd: string; partida: string | null }, esperados: ItemEsperado[]): boolean {
  return fila.partida
    ? esperados.some((e) => e.partida === fila.partida)
    : esperados.some((e) => e.idProd === fila.idProd && !e.partida);
}

function mapEscaneadoRow(row: any, esperados: ItemEsperado[]): ItemEscaneado {
  return {
    id: String(row.idLote),
    idProd: row.idProd,
    nombreProducto: row.nombreProducto || row.idProd,
    partida: row.partida ?? null,
    cantidad: row.cantidad,
    venc: row.venc ?? null,
    origenCarga: row.origenCarga,
    matched: calcularMatched(row, esperados),
    timestamp: row.timestampRecep ? new Date(row.timestampRecep).toTimeString().slice(0, 5) : '',
  };
}

/**
 * Totales de una recepción a partir de lo esperado y lo efectivamente
 * escaneado. Se usa tanto al finalizar una recepción nueva como al abrir
 * una ya cerrada desde el historial.
 */
export function calcularTotales(esperados: ItemEsperado[], escaneados: ItemEscaneado[]) {
  let totalRecibidosOk = 0;
  esperados.forEach((esp) => {
    const sumEscaneado = escaneados
      .filter((esc) => esc.idProd === esp.idProd)
      .reduce((acc, cur) => acc + cur.cantidad, 0);
    totalRecibidosOk += Math.min(sumEscaneado, esp.cantidad);
  });

  const totalEsperados = esperados.reduce((acc, e) => acc + e.cantidad, 0);
  const totalFaltantes = Math.max(0, totalEsperados - totalRecibidosOk);
  const totalSinCobrar = escaneados
    .filter((e) => !e.matched)
    .reduce((acc, e) => acc + e.cantidad, 0);

  return { totalEsperados, totalRecibidosOk, totalFaltantes, totalSinCobrar };
}

/**
 * Arma un RecepcionGuardada (para ResumenScreen) a partir de una cabecera de
 * recepción + lo esperado/escaneado/reclamos. Se usa tanto para una cerrada
 * "de verdad" como para el resumen preliminar de una abandonada.
 */
export function construirRecepcionGuardada(
  recepcion: RecepcionInfo,
  esperados: ItemEsperado[],
  escaneados: ItemEscaneado[],
  reclamos: Reclamo[],
  usuarioLocal: string
): RecepcionGuardada {
  const totales = calcularTotales(esperados, escaneados);
  const marcaTiempo = recepcion.timestampFin || recepcion.timestampInicio;
  const hora = marcaTiempo ? new Date(marcaTiempo).toTimeString().slice(0, 5) : '';

  return {
    id: `REC-${recepcion.idRecepcion}`,
    fecha: recepcion.fecha,
    hora,
    totalesperados: totales.totalEsperados,
    totalRecibidosOk: totales.totalRecibidosOk,
    totalFaltantes: totales.totalFaltantes,
    totalSinCobrar: totales.totalSinCobrar,
    escaneados,
    reclamos,
    usuarioLocal,
  };
}

// Info de cabecera de una recepción puntual. "editable" viene calculado del
// servidor: true solo si esta en_curso Y dentro de la ventana reciente (7
// dias) — es la unica que admite seguir escaneando. Una en_curso mas vieja
// (abandonada) o una cerrada son de solo lectura.
export type RecepcionInfo = {
  idRecepcion: number | string;
  estado: 'en_curso' | 'cerrada';
  fecha: string;
  editable: boolean;
  timestampInicio: string | null;
  timestampFin: string | null;
};

export type RecepcionDiaDetalle = {
  fecha: string;
  ventas: VentaDia[];
  recepcion: RecepcionInfo | null;
  esperados: ItemEsperado[];
  escaneados: ItemEscaneado[];
  reclamos: Reclamo[];
};

function mapReclamos(data: any): Reclamo[] {
  return (data.reclamos || []).map((r: any) => ({
    tipo: r.tipo,
    idProd: r.idProd,
    nombreProducto: r.nombreProducto || r.idProd,
    partida: r.partida ?? null,
    detalle: r.detalle,
  }));
}

function mapVentaDia(v: any): VentaDia {
  return {
    idVenta: v.idVenta,
    numeroRemito: v.numeroRemito ?? null,
    monto: Number(v.monto) || 0,
    estado: v.estado,
    detalles: (v.detalles || []).map((d: any) => ({
      idProd: d.idProd,
      nombreProducto: d.nombreProducto || d.idProd,
      cantidad: d.cantidad,
      partida: d.partida ?? null,
      venc: d.venc ?? null,
      precioUnitario: Number(d.precioUnitario) || 0,
      subtotal: Number(d.subtotal) || 0,
      recepcionado: Boolean(d.recepcionado),
    })),
  };
}

function mapRecepcionDiaDetalle(data: any): RecepcionDiaDetalle {
  const esperados = (data.esperado || []).map(mapEsperadoRow);
  const escaneados = (data.escaneado || []).map((row: any) => mapEscaneadoRow(row, esperados));
  const reclamos = mapReclamos(data);
  const ventas = (data.ventas || []).map(mapVentaDia);

  const recepcion: RecepcionInfo | null = data.recepcion
    ? {
        idRecepcion: data.recepcion.idRecepcion,
        estado: data.recepcion.estado,
        fecha: data.recepcion.fecha,
        editable: Boolean(data.recepcion.editable),
        timestampInicio: data.recepcion.timestampInicio ?? null,
        timestampFin: data.recepcion.timestampFin ?? null,
      }
    : null;

  // Solo una recepcion editable puede ser el destino de los proximos
  // escaneos/carga manual/finalizar. Una abandonada nunca se marca como
  // "actual" aunque siga en_curso — el servidor la rechazaria igual, pero
  // asi ni se ofrece la UI de escaneo.
  if (recepcion?.editable) {
    idRecepcionActual = recepcion.idRecepcion;
  }

  return { fecha: data.fecha, ventas, recepcion, esperados, escaneados, reclamos };
}

/**
 * Iniciar (o reanudar, si ya habia una para esa fecha) una recepción: crea o
 * reutiliza la cabecera en el servidor de forma idempotente. `fecha` es
 * opcional (default hoy) para poder iniciar la recepción de un día pasado
 * dentro de la ventana reciente.
 */
export async function iniciarRecepcion(fecha?: string): Promise<RecepcionDiaDetalle> {
  const data = await apiFetch('/api/recepciones', {
    method: 'POST',
    body: JSON.stringify(fecha ? { fecha } : {}),
  });
  return mapRecepcionDiaDetalle(data);
}

/**
 * Fuente de verdad de "que hay para hoy": ninguna recepción todavía, una
 * en_curso, o una ya cerrada. No crea nada — es de solo lectura.
 */
export async function getRecepcionHoy(): Promise<RecepcionDiaDetalle> {
  const data = await apiFetch('/api/recepciones/hoy');
  return mapRecepcionDiaDetalle(data);
}

/**
 * Vista completa de un día puntual: las ventas remitidas ese día (agrupadas
 * por remito) + el estado de la recepción (o null si no se inició ninguna).
 */
export async function getRecepcionDia(fecha: string): Promise<RecepcionDiaDetalle> {
  const data = await apiFetch(`/api/recepciones/dia/${fecha}`);
  return mapRecepcionDiaDetalle(data);
}

/**
 * Catálogo de productos para el buscador de Carga Manual.
 */
export async function getCatalogoProductos(): Promise<
  Array<{ idProd: string; nombreProducto: string; categoria: string | null }>
> {
  const data = await apiFetch('/api/productos');
  return data.productos || [];
}

/**
 * Historial liviano de recepciones (en curso o cerradas) de los últimos
 * `dias` días, para la pantalla de Inicio y el listado completo.
 */
export async function getHistorialRecepciones(dias: number = 7): Promise<RecepcionResumen[]> {
  const data = await apiFetch(`/api/recepciones?dias=${dias}`);
  return data.recepciones || [];
}

/**
 * Reabrir una recepción cerrada para seguir escaneando (por ejemplo si se
 * cerró por error). El servidor solo lo permite dentro de la ventana reciente.
 */
export async function reabrirRecepcion(idRecepcion: number | string): Promise<RecepcionDiaDetalle> {
  const data = await apiFetch(`/api/recepciones/${idRecepcion}/reabrir`, { method: 'POST' });
  return mapRecepcionDiaDetalle(data);
}

function mapEscaneoResponse(data: any): ItemEscaneado {
  return {
    id: String(data.idLote),
    idProd: data.idProd,
    nombreProducto: data.nombreProducto || data.idProd,
    partida: data.partida ?? null,
    cantidad: data.cantidad,
    venc: data.venc ?? null,
    origenCarga: data.origenCarga,
    matched: Boolean(data.matched),
    timestamp: new Date().toLocaleTimeString().slice(0, 5),
  };
}

/**
 * Registrar un escaneo de QR de fábrica. El texto crudo se manda tal cual al
 * servidor — el parseo de partida/producto/cantidad ocurre del lado del
 * servidor (src/qr.js en el backend), no acá.
 */
export async function registrarEscaneoQr(qrRawText: string): Promise<ItemEscaneado> {
  if (idRecepcionActual === null) {
    throw new Error('No hay una recepción en curso.');
  }
  const data = await apiFetch(`/api/recepciones/${idRecepcionActual}/escaneos`, {
    method: 'POST',
    body: JSON.stringify({ raw: qrRawText }),
  });
  return mapEscaneoResponse(data);
}

/**
 * Registrar una carga manual (insumos sin QR de fábrica).
 */
export async function registrarCargaManual(dataManual: {
  idProd: string;
  cantidad: number;
  venc: string | null;
}): Promise<ItemEscaneado> {
  if (idRecepcionActual === null) {
    throw new Error('No hay una recepción en curso.');
  }
  const data = await apiFetch(`/api/recepciones/${idRecepcionActual}/escaneos`, {
    method: 'POST',
    body: JSON.stringify({ manual: dataManual }),
  });
  return mapEscaneoResponse(data);
}

/**
 * Cierra una recepción puntual (identificada por id, no por la "actual" del
 * modulo): el servidor recalcula los reclamos desde cero a partir de lo
 * realmente persistido y la marca cerrada. Sirve tanto para el cierre
 * normal desde el checklist como para "cerrar ahora" una recepción vieja
 * que quedó abandonada (el backend lo permite sin restricción de fecha).
 */
export async function finalizarRecepcion(idRecepcion: number | string): Promise<Reclamo[]> {
  const data = await apiFetch(`/api/recepciones/${idRecepcion}/finalizar`, { method: 'POST' });
  if (idRecepcionActual === idRecepcion) {
    idRecepcionActual = null;
  }
  return mapReclamos(data);
}

/**
 * Cierra la recepción que se está escaneando activamente (la "actual" del
 * módulo, identificada internamente por idRecepcionActual). El servidor
 * recalcula los reclamos desde cero a partir de lo realmente persistido.
 */
export async function finalizarRecepcionActual(): Promise<void> {
  if (idRecepcionActual === null) {
    throw new Error('No hay una recepción en curso.');
  }
  await finalizarRecepcion(idRecepcionActual);
}

/* ---------------------- Stock / Exhibidora ---------------------- */

// Lista plana de todas las partidas sin exhibir del local, con producto y
// familia embebidos — pensada para el buscador de Stock (filtra en el
// cliente, sin ida y vuelta al servidor por cada tecla o click de filtro).
export async function getPartidasConStock(): Promise<PartidaConStock[]> {
  const data = await apiFetch('/api/stock/partidas');
  return data.partidas || [];
}

export async function exhibirLote(idLote: number | string): Promise<{ idLote: number | string; posicion: number | null }> {
  return apiFetch(`/api/stock/lotes/${idLote}/exhibir`, { method: 'POST' });
}

export async function desexhibirLote(idLote: number | string): Promise<void> {
  await apiFetch(`/api/stock/lotes/${idLote}/desexhibir`, { method: 'POST' });
}

export async function getExhibidora(): Promise<{ bacha: ExhibidoBacha[]; resto: ExhibidoResto[] }> {
  const data = await apiFetch('/api/stock/exhibidora');
  return { bacha: data.bacha || [], resto: data.resto || [] };
}

export async function getHistorialProducto(idProd: string): Promise<HistorialExhibicion[]> {
  const data = await apiFetch(`/api/stock/productos/${encodeURIComponent(idProd)}/historial`);
  return data.historial || [];
}
