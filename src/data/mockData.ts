import { ItemEsperado, LocalUsuario, RecepcionGuardada } from '../types';

export const LOCAL_DEMO: LocalUsuario = {
  id: "LOC-042",
  nombreLocal: "Heladería La Gianduia",
  direccion: "Av. Pellegrini 1420, Rosario",
  sucursalCodigo: "SUC-CENTRO",
};

// Catálogo completo de fábrica para autocompletar en Carga Manual
export const CATALOGO_PRODUCTOS = [
  { idProd: "PT-HEL-101", nombreProducto: "Helado Dulce de Leche Granizado 5L", categoria: "Balde 5L", requiereQR: true },
  { idProd: "PT-HEL-102", nombreProducto: "Helado Chocolate Amargo c/ Almendras 5L", categoria: "Balde 5L", requiereQR: true },
  { idProd: "PT-HEL-103", nombreProducto: "Helado Frutilla a la Crema Natural 5L", categoria: "Balde 5L", requiereQR: true },
  { idProd: "PT-HEL-104", nombreProducto: "Helado Sambayón Especial 5L", categoria: "Balde 5L", requiereQR: true },
  { idProd: "PT-HEL-105", nombreProducto: "Helado Menta Granizada 5L", categoria: "Balde 5L", requiereQR: true },
  { idProd: "PT-HEL-106", nombreProducto: "Helado Tramontana Premium 5L", categoria: "Balde 5L", requiereQR: true },
  { idProd: "PT-HEL-201", nombreProducto: "Pote Familiar Crema Americana 1L (Pack 6u)", categoria: "Pote 1L", requiereQR: true },
  { idProd: "PT-IMP-301", nombreProducto: "Palito Bombón Crocante (Caja x 20u)", categoria: "Impulsivos", requiereQR: true },
  { idProd: "PT-IMP-302", nombreProducto: "Cono Crocante Vainilla (Caja x 24u)", categoria: "Impulsivos", requiereQR: true },
  { idProd: "INS-CUC-001", nombreProducto: "Cucuruchos Artesanales N°4 (Caja x 120u)", categoria: "Insumos", requiereQR: false },
  { idProd: "INS-VAS-002", nombreProducto: "Vasos Polipapel 250g (Caja x 500u)", categoria: "Insumos", requiereQR: false },
  { idProd: "INS-SAL-003", nombreProducto: "Salsa Caramelo Artesanal (Bidón 5kg)", categoria: "Insumos", requiereQR: false },
];

// Lista esperada para la entrega de HOY (8 a 10 ítems)
export const ESPERADOS_HOY_MOCK: ItemEsperado[] = [
  {
    idProd: "PT-HEL-101",
    nombreProducto: "Helado Dulce de Leche Granizado 5L",
    categoria: "Balde 5L",
    partida: "L-20260728-DDL",
    cantidad: 4,
    venc: "2026-10-15",
  },
  {
    idProd: "PT-HEL-102",
    nombreProducto: "Helado Chocolate Amargo c/ Almendras 5L",
    categoria: "Balde 5L",
    partida: "L-20260728-CHO",
    cantidad: 3,
    venc: "2026-10-15",
  },
  {
    idProd: "PT-HEL-103",
    nombreProducto: "Helado Frutilla a la Crema Natural 5L",
    categoria: "Balde 5L",
    partida: "L-20260728-FRU",
    cantidad: 2,
    venc: "2026-09-30",
  },
  {
    idProd: "PT-HEL-104",
    nombreProducto: "Helado Sambayón Especial 5L",
    categoria: "Balde 5L",
    partida: "L-20260728-SAM",
    cantidad: 2,
    venc: "2026-09-30",
  },
  {
    idProd: "PT-HEL-105",
    nombreProducto: "Helado Menta Granizada 5L",
    categoria: "Balde 5L",
    partida: "L-20260728-MEN",
    cantidad: 2,
    venc: "2026-10-10",
  },
  {
    idProd: "PT-IMP-301",
    nombreProducto: "Palito Bombón Crocante (Caja x 20u)",
    categoria: "Impulsivos",
    partida: "L-20260725-BOM",
    cantidad: 2,
    venc: "2026-12-01",
  },
  {
    idProd: "PT-IMP-302",
    nombreProducto: "Cono Crocante Vainilla (Caja x 24u)",
    categoria: "Impulsivos",
    partida: "L-20260725-CON",
    cantidad: 1,
    venc: "2026-12-01",
  },
  {
    idProd: "INS-CUC-001",
    nombreProducto: "Cucuruchos Artesanales N°4 (Caja x 120u)",
    categoria: "Insumos",
    partida: null,
    cantidad: 2,
    venc: null,
  },
  {
    idProd: "INS-VAS-002",
    nombreProducto: "Vasos Polipapel 250g (Caja x 500u)",
    categoria: "Insumos",
    partida: null,
    cantidad: 1,
    venc: null,
  },
];

// Presets QR para simular escaneos instantáneos durante el testeo
export const PRESETS_QR_SIMULADOR = [
  {
    etiqueta: "Dulce de Leche (Coincide)",
    qrString: "PT-HEL-101|L-20260728-DDL|2026-10-15|Helado Dulce de Leche Granizado 5L",
    idProd: "PT-HEL-101",
    nombre: "Helado Dulce de Leche Granizado 5L",
    partida: "L-20260728-DDL",
    venc: "2026-10-15",
  },
  {
    etiqueta: "Chocolate Amargo (Coincide)",
    qrString: "PT-HEL-102|L-20260728-CHO|2026-10-15|Helado Chocolate Amargo c/ Almendras 5L",
    idProd: "PT-HEL-102",
    nombre: "Helado Chocolate Amargo c/ Almendras 5L",
    partida: "L-20260728-CHO",
    venc: "2026-10-15",
  },
  {
    etiqueta: "Frutilla a la Crema (Coincide)",
    qrString: "PT-HEL-103|L-20260728-FRU|2026-09-30|Helado Frutilla a la Crema Natural 5L",
    idProd: "PT-HEL-103",
    nombre: "Helado Frutilla a la Crema Natural 5L",
    partida: "L-20260728-FRU",
    venc: "2026-09-30",
  },
  {
    etiqueta: "Palito Bombón (Coincide)",
    qrString: "PT-IMP-301|L-20260725-BOM|2026-12-01|Palito Bombón Crocante (Caja x 20u)",
    idProd: "PT-IMP-301",
    nombre: "Palito Bombón Crocante (Caja x 20u)",
    partida: "L-20260725-BOM",
    venc: "2026-12-01",
  },
  {
    etiqueta: "Menta Granizada (Coincide)",
    qrString: "PT-HEL-105|L-20260728-MEN|2026-10-10|Helado Menta Granizada 5L",
    idProd: "PT-HEL-105",
    nombre: "Helado Menta Granizada 5L",
    partida: "L-20260728-MEN",
    venc: "2026-10-10",
  },
  {
    etiqueta: "NO ESPERADO: Tramontana Premium",
    qrString: "PT-HEL-106|L-20260728-TRA|2026-11-01|Helado Tramontana Premium 5L",
    idProd: "PT-HEL-106",
    nombre: "Helado Tramontana Premium 5L",
    partida: "L-20260728-TRA",
    venc: "2026-11-01",
  },
  {
    etiqueta: "NO ESPERADO: Pote Familiar 1L",
    qrString: "PT-HEL-201|L-20260728-POT|2026-11-15|Pote Familiar Crema Americana 1L (Pack 6u)",
    idProd: "PT-HEL-201",
    nombre: "Pote Familiar Crema Americana 1L (Pack 6u)",
    partida: "L-20260728-POT",
    venc: "2026-11-15",
  },
];

// Historial previo de recepciones
export const HISTORIAL_MOCK: RecepcionGuardada[] = [
  {
    id: "REC-2026-0727",
    fecha: "2026-07-27",
    hora: "08:30",
    totalesperados: 12,
    totalRecibidosOk: 12,
    totalFaltantes: 0,
    totalSinCobrar: 0,
    escaneados: [],
    reclamos: [],
    usuarioLocal: "Heladería La Gianduia - Centro",
  },
  {
    id: "REC-2026-0725",
    fecha: "2026-07-25",
    hora: "09:15",
    totalesperados: 10,
    totalRecibidosOk: 9,
    totalFaltantes: 1,
    totalSinCobrar: 1,
    escaneados: [],
    reclamos: [],
    usuarioLocal: "Heladería La Gianduia - Centro",
  },
];
