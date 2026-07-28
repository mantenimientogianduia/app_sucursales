/**
 * Presets de QR para el simulador (modo sin cámara / testing rápido).
 *
 * Formato real de una etiqueta de fábrica, sin separadores:
 * [id_prod][lote][fecha de fabricación][vencimiento][cantidad]
 * ej: "PT-HEL-197PT-HEL-19724/07/2026 12:37:3320/01/2027 3.750"
 * (el lote suele repetir el id_prod). El texto se manda tal cual al backend,
 * que es quien lo decodifica — estos presets solo sirven para poder probar
 * el flujo sin cámara ni etiquetas físicas reales.
 */
export const PRESETS_QR_SIMULADOR = [
  {
    etiqueta: 'Producto de prueba A',
    qrString: 'TEST-PROD-A-QRTEST-PROD-A-QR28/07/2026 10:00:0028/01/2027 4.000',
  },
  {
    etiqueta: 'Producto de prueba B',
    qrString: 'TEST-PROD-B-QRTEST-PROD-B-QR28/07/2026 10:15:0015/09/2026 2.500',
  },
  {
    etiqueta: 'Producto no esperado (prueba)',
    qrString: 'TEST-PROD-C-QRTEST-PROD-C-QR28/07/2026 10:30:0001/11/2026 1.000',
  },
];
