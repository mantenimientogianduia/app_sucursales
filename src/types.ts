/**
 * Tipos de datos para el prototipo de recepción de heladería
 */

// Lo esperado, calculado del lado del servidor a partir de las ventas/pedidos del día
export type ItemEsperado = {
  idProd: string;          // ej "PT-HEL-197"
  nombreProducto: string;    // ej "Helado Dulce de Leche Granizado 5L"
  categoria: string | null;  // "rubro" del producto en g360, texto libre
  partida: string | null;    // texto crudo de partida cuando el producto tiene QR de fábrica
  cantidad: number;
  venc: string | null;       // fecha ISO
};

// Un item ya escaneado/cargado durante la recepción en curso
export type ItemEscaneado = {
  id: string;                // ID único de la captura
  idProd: string;
  nombreProducto: string;
  partida: string | null;    // null si vino de carga manual
  cantidad: number;
  venc: string | null;
  origenCarga: "qr" | "manual";
  matched: boolean;          // si matcheó contra algo esperado
  timestamp: string;
};

// Reclamo generado al finalizar
export type Reclamo = {
  tipo: "faltante" | "sin_cobrar";
  idProd: string;
  nombreProducto: string;
  partida: string | null;
  detalle: string;           // texto legible, ej "Esperado 10, recibido 6"
};

// Datos de sesión de local
export type LocalUsuario = {
  id: string;
  nombreLocal: string;
  direccion: string;
  sucursalCodigo: string;
};

// Resumen guardado de recepción
export type RecepcionGuardada = {
  id: string;
  fecha: string;
  hora: string;
  totalesperados: number;
  totalRecibidosOk: number;
  totalFaltantes: number;
  totalSinCobrar: number;
  escaneados: ItemEscaneado[];
  reclamos: Reclamo[];
  usuarioLocal: string;
};
