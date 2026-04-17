/**
 * Controlador de Ventas
 * Maneja las rutas de gestión de ventas
 */
const { ventaService } = require('../services');
const { asyncHandler } = require('../middleware');

/**
 * GET /api/ventas
 * Lista todas las ventas con filtros
 */
const getAll = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    usuario_id, 
    estado, 
    fecha_inicio, 
    fecha_fin 
  } = req.query;
  
  const result = await ventaService.getAll({
    page: parseInt(page),
    limit: parseInt(limit),
    usuario_id: usuario_id ? parseInt(usuario_id) : undefined,
    estado,
    fecha_inicio,
    fecha_fin
  });
  
  res.json({
    success: true,
    ...result
  });
});

/**
 * GET /api/ventas/today
 * Obtiene las ventas del día
 */
const getTodaySales = asyncHandler(async (req, res) => {
  const result = await ventaService.getTodaySales();
  
  res.json({
    success: true,
    data: result
  });
});

/**
 * GET /api/ventas/:id
 * Obtiene una venta por ID con sus detalles
 */
const getById = asyncHandler(async (req, res) => {
  const venta = await ventaService.getById(parseInt(req.params.id));
  
  res.json({
    success: true,
    data: venta
  });
});

/**
 * POST /api/ventas
 * Registra una nueva venta
 */
const create = asyncHandler(async (req, res) => {
  const { productos, descuento, metodo_pago, observaciones } = req.body;
  
  const venta = await ventaService.create(
    { descuento, metodo_pago, observaciones },
    productos,
    req.user.id
  );
  
  res.status(201).json({
    success: true,
    message: 'Venta registrada exitosamente',
    data: venta
  });
});

/**
 * PUT /api/ventas/:id/cancel
 * Cancela una venta
 */
const cancel = asyncHandler(async (req, res) => {
  const { motivo } = req.body;
  
  const venta = await ventaService.cancel(
    parseInt(req.params.id),
    req.user.id,
    motivo
  );
  
  res.json({
    success: true,
    message: 'Venta cancelada exitosamente',
    data: venta
  });
});

/**
 * GET /api/ventas/stats
 * Obtiene estadísticas de ventas
 */
const getStats = asyncHandler(async (req, res) => {
  const { fecha_inicio, fecha_fin } = req.query;
  
  const stats = await ventaService.getStats(fecha_inicio, fecha_fin);
  
  res.json({
    success: true,
    data: stats
  });
});

module.exports = {
  getAll,
  getTodaySales,
  getById,
  create,
  cancel,
  getStats
};
