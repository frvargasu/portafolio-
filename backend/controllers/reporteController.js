/**
 * Controlador de Reportes
 * Maneja las rutas de generación de reportes
 */
const { reporteService } = require('../services');
const { asyncHandler } = require('../middleware');

/**
 * GET /api/reportes/dashboard
 * Obtiene el dashboard con métricas principales
 */
const getDashboard = asyncHandler(async (req, res) => {
  const dashboard = await reporteService.getDashboard();
  
  res.json({
    success: true,
    data: dashboard
  });
});

/**
 * GET /api/reportes/ventas-diarias
 * Obtiene el reporte de ventas por día
 */
const getVentasPorDia = asyncHandler(async (req, res) => {
  const { fecha_inicio, fecha_fin } = req.query;
  
  const reporte = await reporteService.getVentasPorDia(fecha_inicio, fecha_fin);
  
  res.json({
    success: true,
    data: reporte
  });
});

/**
 * GET /api/reportes/productos-mas-vendidos
 * Obtiene el reporte de productos más vendidos
 */
const getProductosMasVendidos = asyncHandler(async (req, res) => {
  const { limit = 10, fecha_inicio, fecha_fin } = req.query;
  
  const reporte = await reporteService.getProductosMasVendidos({
    limit: parseInt(limit),
    fecha_inicio,
    fecha_fin
  });
  
  res.json({
    success: true,
    data: reporte
  });
});

/**
 * GET /api/reportes/bajo-stock
 * Obtiene el reporte de productos con bajo stock
 */
const getProductosBajoStock = asyncHandler(async (req, res) => {
  const { threshold } = req.query;
  
  const reporte = await reporteService.getProductosBajoStock(
    threshold ? parseInt(threshold) : null
  );
  
  res.json({
    success: true,
    data: reporte
  });
});

/**
 * GET /api/reportes/movimientos-stock
 * Obtiene el reporte de movimientos de inventario
 */
const getMovimientosStock = asyncHandler(async (req, res) => {
  const { fecha_inicio, fecha_fin } = req.query;
  
  const reporte = await reporteService.getMovimientosStock(fecha_inicio, fecha_fin);
  
  res.json({
    success: true,
    data: reporte
  });
});

/**
 * GET /api/reportes/ventas-metodo-pago
 * Obtiene ventas agrupadas por método de pago
 */
const getVentasPorMetodoPago = asyncHandler(async (req, res) => {
  const { fecha_inicio, fecha_fin } = req.query;
  
  const data = await reporteService.getVentasPorMetodoPago(fecha_inicio, fecha_fin);
  
  res.json({
    success: true,
    data
  });
});

/**
 * GET /api/reportes/ventas-categoria
 * Obtiene ventas agrupadas por categoría
 */
const getVentasPorCategoria = asyncHandler(async (req, res) => {
  const { fecha_inicio, fecha_fin } = req.query;
  
  const data = await reporteService.getVentasPorCategoria(fecha_inicio, fecha_fin);
  
  res.json({
    success: true,
    data
  });
});

module.exports = {
  getDashboard,
  getVentasPorDia,
  getProductosMasVendidos,
  getProductosBajoStock,
  getMovimientosStock,
  getVentasPorMetodoPago,
  getVentasPorCategoria
};
