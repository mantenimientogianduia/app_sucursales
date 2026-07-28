import {
  ItemEsperado,
  ItemEscaneado,
  Reclamo,
  LocalUsuario,
  RecepcionGuardada
} from '../types';
import {
  LOCAL_DEMO,
  ESPERADOS_HOY_MOCK,
  HISTORIAL_MOCK,
  CATALOGO_PRODUCTOS
} from '../data/mockData';

/**
 * Servicio API Aislado (MOCK)
 * Diseñado para ser fácil de sustituir por un cliente HTTP/REST real (fetch/axios)
 * sin tocar las pantallas ni componentes de UI.
 */

// Claves de localStorage para persistencia opcional en el navegador
const STORAGE_KEYS = {
  SESSION: 'heladeria_session_v1',
  ESPERADOS: 'heladeria_esperados_v1',
  HISTORIAL: 'heladeria_historial_v1',
};

// Utilidad para simular latencia de red (100-300ms)
const simulateLatency = (ms = 180) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Autenticación de Local
 */
export async function loginLocal(usuario: string, clave: string): Promise<{ ok: boolean; local?: LocalUsuario; mensaje?: string }> {
  await simulateLatency(250);
  
  // Para la demo, aceptamos cualquier credencial no vacía o usuario 'gianduia' / 'centro'
  if (!usuario.trim() || !clave.trim()) {
    return { ok: false, mensaje: 'Por favor ingrese usuario y contraseña del local.' };
  }

  // Si ingresa 'error' se simula falla
  if (usuario.toLowerCase() === 'error') {
    return { ok: false, mensaje: 'Usuario o contraseña incorrectos para este local.' };
  }

  // Guardar sesión mock
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(LOCAL_DEMO));
  return { ok: true, local: LOCAL_DEMO };
}

export async function getSesionActual(): Promise<LocalUsuario | null> {
  const data = localStorage.getItem(STORAGE_KEYS.SESSION);
  if (!data) return LOCAL_DEMO; // Default para agilizar demo si no hay sesión
  try {
    return JSON.parse(data);
  } catch {
    return LOCAL_DEMO;
  }
}

export async function logoutLocal(): Promise<void> {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
}

/**
 * Obtener la lista de lo esperado HOY (calculado por servidor)
 */
export async function getEsperadosHoy(): Promise<ItemEsperado[]> {
  await simulateLatency(200);
  const localSaved = localStorage.getItem(STORAGE_KEYS.ESPERADOS);
  if (localSaved) {
    try {
      return JSON.parse(localSaved);
    } catch {
      // fallback
    }
  }
  return ESPERADOS_HOY_MOCK;
}

/**
 * Obtener catálogo completo de productos para Carga Manual
 */
export async function getCatalogoProductos() {
  await simulateLatency(100);
  return CATALOGO_PRODUCTOS;
}

/**
 * Obtener historial de recepciones finalizadas
 */
export async function getHistorialRecepciones(): Promise<RecepcionGuardada[]> {
  await simulateLatency(150);
  const data = localStorage.getItem(STORAGE_KEYS.HISTORIAL);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // fallback
    }
  }
  return HISTORIAL_MOCK;
}

/**
 * Decodificar y procesar un código QR de fábrica
 * Formato esperado en QR: "idProd|partida|venc|nombre" o JSON o string simple
 */
export function decodificarQR(qrDataRaw: string): {
  idProd: string;
  partida: string | null;
  venc: string | null;
  nombreProducto: string;
} {
  const raw = qrDataRaw.trim();

  // Caso 1: Delimitado por tuberías |
  if (raw.includes('|')) {
    const parts = raw.split('|');
    return {
      idProd: parts[0] || 'PT-HEL-DESCONOCIDO',
      partida: parts[1] || 'L-' + new Date().toISOString().slice(0, 10).replace(/-/g, ''),
      venc: parts[2] || null,
      nombreProducto: parts[3] || 'Helado Artesanal Sabor no especificado',
    };
  }

  // Caso 2: Intento parseo JSON
  if (raw.startsWith('{') && raw.endsWith('}')) {
    try {
      const parsed = JSON.parse(raw);
      return {
        idProd: parsed.idProd || parsed.codigo || 'PT-HEL-999',
        partida: parsed.partida || parsed.lote || null,
        venc: parsed.venc || parsed.vencimiento || null,
        nombreProducto: parsed.nombreProducto || parsed.nombre || 'Producto Escaneado',
      };
    } catch {
      // continuar
    }
  }

  // Caso 3: Es solo un ID de producto de catálogo
  const prodEncontrado = CATALOGO_PRODUCTOS.find(p => p.idProd === raw || p.nombreProducto.toLowerCase().includes(raw.toLowerCase()));
  if (prodEncontrado) {
    return {
      idProd: prodEncontrado.idProd,
      partida: 'L-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-QR',
      venc: '2026-11-30',
      nombreProducto: prodEncontrado.nombreProducto,
    };
  }

  // Caso genérico fallback
  return {
    idProd: 'PT-DES-000',
    partida: 'PARTIDA-QR-' + Math.floor(Math.random() * 8999 + 1000),
    venc: '2026-12-31',
    nombreProducto: `Ítem Fábrica (${raw.slice(0, 24)})`,
  };
}

/**
 * Enviar / Guardar la Recepción Finalizada
 */
export async function enviarRecepcionFinalizada(
  esperados: ItemEsperado[],
  escaneados: ItemEscaneado[],
  nombreLocal: string
): Promise<{ ok: boolean; recepcion: RecepcionGuardada }> {
  await simulateLatency(300);

  // Calcular discrepancias y reclamos automáticamente
  const reclamos: Reclamo[] = [];
  let totalRecibidosOk = 0;
  let totalFaltantes = 0;
  let totalSinCobrar = 0;

  // 1. Analizar esperados
  esperados.forEach(esp => {
    const sumEscaneado = escaneados
      .filter(esc => esc.idProd === esp.idProd)
      .reduce((acc, current) => acc + current.cantidad, 0);

    if (sumEscaneado === 0) {
      totalFaltantes += esp.cantidad;
      reclamos.push({
        tipo: 'faltante',
        idProd: esp.idProd,
        nombreProducto: esp.nombreProducto,
        partida: esp.partida,
        detalle: `Faltante total: se esperaban ${esp.cantidad} u., llegaron 0 u.`,
      });
    } else if (sumEscaneado < esp.cantidad) {
      const dif = esp.cantidad - sumEscaneado;
      totalFaltantes += dif;
      reclamos.push({
        tipo: 'faltante',
        idProd: esp.idProd,
        nombreProducto: esp.nombreProducto,
        partida: esp.partida,
        detalle: `Entrega incompleta: esperados ${esp.cantidad} u., recibidos ${sumEscaneado} u. (faltan ${dif} u.)`,
      });
      totalRecibidosOk += sumEscaneado;
    } else {
      totalRecibidosOk += esp.cantidad; // llegó completo
    }
  });

  // 2. Analizar escaneados no esperados ("sin cobrar / extra")
  escaneados.forEach(esc => {
    if (!esc.matched) {
      totalSinCobrar += esc.cantidad;
      reclamos.push({
        tipo: 'sin_cobrar',
        idProd: esc.idProd,
        nombreProducto: esc.nombreProducto,
        partida: esc.partida,
        detalle: `Producto no figuraba en pedido del día: recibido ${esc.cantidad} u. (${esc.origenCarga === 'qr' ? 'Escaneo QR' : 'Carga manual'}).`,
      });
    }
  });

  const now = new Date();
  const nuevaRecepcion: RecepcionGuardada = {
    id: `REC-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 899 + 100)}`,
    fecha: now.toISOString().slice(0, 10),
    hora: now.toTimeString().slice(0, 5),
    totalesperados: esperados.reduce((a, b) => a + b.cantidad, 0),
    totalRecibidosOk,
    totalFaltantes,
    totalSinCobrar,
    escaneados,
    reclamos,
    usuarioLocal: nombreLocal,
  };

  // Guardar en historial local para persistencia entre vistas
  const historialActual = await getHistorialRecepciones();
  const actualizado = [nuevaRecepcion, ...historialActual];
  localStorage.setItem(STORAGE_KEYS.HISTORIAL, JSON.stringify(actualizado));

  return { ok: true, recepcion: nuevaRecepcion };
}
