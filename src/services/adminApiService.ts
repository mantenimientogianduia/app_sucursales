import {
  UsuarioInterno,
  PosicionVigente,
  CambioPendiente,
  ProductoBachaCandidato,
  HistorialCambioPosicion
} from '../types';

/**
 * Servicio API del panel interno de Gianduia (BACHA). Sesión y token
 * completamente separados de la sesión de local (distinto storage key,
 * distinto endpoint de login: /api/admin/login vs /api/login).
 */

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001';

const STORAGE_KEYS = {
  TOKEN: 'gianduia_admin_token_v1',
  SESSION: 'gianduia_admin_session_v1',
};

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

  if (!res.ok) {
    throw new Error(data.error || `Error de red (${res.status})`);
  }
  return data;
}

export async function loginAdmin(
  usuario: string,
  password: string
): Promise<{ ok: boolean; usuario?: UsuarioInterno; mensaje?: string }> {
  if (!usuario.trim() || !password.trim()) {
    return { ok: false, mensaje: 'Ingresá usuario y contraseña.' };
  }
  try {
    const data = await apiFetch('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ usuario, password }),
    });
    const sesion: UsuarioInterno = { usuario: data.usuario };
    localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sesion));
    return { ok: true, usuario: sesion };
  } catch (err: any) {
    return { ok: false, mensaje: err.message || 'Usuario o contraseña incorrectos.' };
  }
}

export async function getSesionAdmin(): Promise<UsuarioInterno | null> {
  if (!getToken()) return null;
  const data = localStorage.getItem(STORAGE_KEYS.SESSION);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function logoutAdmin(): Promise<void> {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.SESSION);
}

export async function getPosicionesConAlertas(): Promise<{
  posiciones: PosicionVigente[];
  alertas: CambioPendiente[];
}> {
  const data = await apiFetch('/api/admin/posiciones');
  return { posiciones: data.posiciones || [], alertas: data.alertas || [] };
}

export async function getProductosBachaCandidatos(busqueda: string): Promise<ProductoBachaCandidato[]> {
  const params = new URLSearchParams();
  if (busqueda) params.set('busqueda', busqueda);
  const qs = params.toString();
  const data = await apiFetch(`/api/admin/productos-bacha${qs ? `?${qs}` : ''}`);
  return data.productos || [];
}

export async function getHistorialPosicion(posicion: number): Promise<HistorialCambioPosicion[]> {
  const data = await apiFetch(`/api/admin/posiciones/${posicion}/historial`);
  return data.historial || [];
}

export async function anunciarCambio(
  posicion: number,
  idProdNuevo: string
): Promise<{ idCambio: number | string; idProdViejo: string | null }> {
  return apiFetch(`/api/admin/posiciones/${posicion}/anunciar`, {
    method: 'POST',
    body: JSON.stringify({ idProdNuevo }),
  });
}

export async function confirmarRetiro(idCambio: number | string): Promise<void> {
  await apiFetch(`/api/admin/cambios/${idCambio}/confirmar-retiro`, { method: 'POST' });
}
