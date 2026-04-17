/**
 * Controlador de Productos
 * Maneja las rutas CRUD de productos y gestión de stock
 */
const { productoService } = require('../services');
const { asyncHandler } = require('../middleware');

/**
 * GET /api/productos
 * Lista todos los productos con filtros
 */
const getAll = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, categoria_id, search, includeInactive } = req.query;
  
  const result = await productoService.getAll({
    page: parseInt(page),
    limit: parseInt(limit),
    categoria_id: categoria_id ? parseInt(categoria_id) : undefined,
    search,
    includeInactive: includeInactive === 'true'
  });
  
  res.json({
    success: true,
    ...result
  });
});

/**
 * GET /api/productos/:id
 * Obtiene un producto por ID
 */
const getById = asyncHandler(async (req, res) => {
  const producto = await productoService.getById(parseInt(req.params.id));
  
  res.json({
    success: true,
    data: producto
  });
});

/**
 * GET /api/productos/barcode/:codigo
 * Busca un producto por código de barras
 */
const getByBarcode = asyncHandler(async (req, res) => {
  const producto = await productoService.getByBarcode(req.params.codigo);
  
  res.json({
    success: true,
    data: producto
  });
});

/**
 * POST /api/productos
 * Crea un nuevo producto
 */
const create = asyncHandler(async (req, res) => {
  const producto = await productoService.create(req.body, req.user.id);
  
  res.status(201).json({
    success: true,
    message: 'Producto creado exitosamente',
    data: producto
  });
});

/**
 * PUT /api/productos/:id
 * Actualiza un producto
 */
const update = asyncHandler(async (req, res) => {
  const producto = await productoService.update(parseInt(req.params.id), req.body);
  
  res.json({
    success: true,
    message: 'Producto actualizado exitosamente',
    data: producto
  });
});

/**
 * DELETE /api/productos/:id
 * Elimina un producto (soft delete)
 */
const remove = asyncHandler(async (req, res) => {
  await productoService.delete(parseInt(req.params.id));
  
  res.json({
    success: true,
    message: 'Producto eliminado exitosamente'
  });
});

/**
 * PUT /api/productos/:id/stock
 * Actualiza el stock de un producto
 */
const updateStock = asyncHandler(async (req, res) => {
  const { tipo, cantidad, motivo } = req.body;
  
  const result = await productoService.updateStock(
    parseInt(req.params.id),
    { tipo, cantidad, motivo },
    req.user.id
  );
  
  res.json({
    success: true,
    message: 'Stock actualizado exitosamente',
    data: result
  });
});

/**
 * GET /api/productos/:id/stock-history
 * Obtiene el historial de movimientos de stock
 */
const getStockHistory = asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;
  
  const movimientos = await productoService.getStockHistory(
    parseInt(req.params.id),
    parseInt(limit)
  );
  
  res.json({
    success: true,
    data: movimientos
  });
});

/**
 * GET /api/productos/low-stock
 * Obtiene productos con stock bajo
 */
const getLowStock = asyncHandler(async (req, res) => {
  const { threshold } = req.query;
  
  const productos = await productoService.getLowStock(
    threshold ? parseInt(threshold) : null
  );
  
  res.json({
    success: true,
    data: productos,
    total: productos.length
  });
});

/**
 * GET /api/productos/top-selling
 * Obtiene los productos más vendidos
 */
const getTopSelling = asyncHandler(async (req, res) => {
  const { limit = 10, fecha_inicio, fecha_fin } = req.query;
  
  const productos = productoService.getTopSelling({
    limit: parseInt(limit),
    fecha_inicio,
    fecha_fin
  });
  
  res.json({
    success: true,
    data: productos
  });
});

module.exports = {
  getAll,
  getById,
  getByBarcode,
  create,
  update,
  remove,
  updateStock,
  getStockHistory,
  getLowStock,
  getTopSelling
};
