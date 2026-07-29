import {
  ItemEsperado,
  ItemEscaneado,
  Reclamo,
  LocalUsuario,
  RecepcionGuardada,
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

/**
 * Iniciar una recepción nueva: crea la cabecera en el servidor y devuelve
 * lo esperado hoy para este cliente (calculado desde g360.f_ventas).
 */
export async function iniciarRecepcion(): Promise<ItemEsperado[]> {
  const data = await apiFetch('/api/recepciones', { method: 'POST' });
  idRecepcionActual = data.idRecepcion;
  return (data.esperado || []).map((e: any) => ({
    idProd: e.idProd,
    nombreProducto: e.nombreProducto || e.idProd,
    categoria: null,
    partida: e.partida,
    cantidad: e.cantidad,
    venc: e.venc,
  }));
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
 * Historial de recepciones finalizadas. El backend todavía no expone un
 * endpoint de historial (fuera de alcance de este módulo) — devuelve vacío.
 */
export async function getHistorialRecepciones(): Promise<RecepcionGuardada[]> {
  return [];
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
 * Finalizar la recepción en curso. El servidor recalcula los reclamos desde
 * cero a partir de lo realmente persistido (no de lo que mande el cliente),
 * y cierra la recepción. Los totales del resumen se calculan acá a partir de
 * lo que el cliente ya sabe (cada escaneo fue confirmado por el servidor al
 * agregarse), para no duplicar la lógica de matching del backend.
 */
export async function enviarRecepcionFinalizada(
  esperados: ItemEsperado[],
  escaneados: ItemEscaneado[],
  nombreLocal: string
): Promise<{ ok: boolean; recepcion: RecepcionGuardada }> {
  if (idRecepcionActual === null) {
    throw new Error('No hay una recepción en curso.');
  }

  const idRecepcionCerrada = idRecepcionActual;
  const data = await apiFetch(`/api/recepciones/${idRecepcionCerrada}/finalizar`, {
    method: 'POST',
  });
  idRecepcionActual = null;

  const reclamos: Reclamo[] = (data.reclamos || []).map((r: any) => ({
    tipo: r.tipo,
    idProd: r.idProd,
    nombreProducto: r.nombreProducto || r.idProd,
    partida: r.partida ?? null,
    detalle: r.detalle,
  }));

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

  const now = new Date();
  const recepcion: RecepcionGuardada = {
    id: `REC-${idRecepcionCerrada}`,
    fecha: now.toISOString().slice(0, 10),
    hora: now.toTimeString().slice(0, 5),
    totalesperados: totalEsperados,
    totalRecibidosOk,
    totalFaltantes,
    totalSinCobrar,
    escaneados,
    reclamos,
    usuarioLocal: nombreLocal,
  };

  return { ok: true, recepcion };
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
