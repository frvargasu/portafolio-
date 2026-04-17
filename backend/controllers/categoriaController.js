/**
 * Controlador de Categorías
 * Maneja las rutas CRUD de categorías
 */
const { categoriaService } = require('../services');
const { asyncHandler } = require('../middleware');

/**
 * GET /api/categorias
 * Lista todas las categorías
 */
const getAll = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, includeInactive } = req.query;
  
  const result = await categoriaService.getAll({
    page: parseInt(page),
    limit: parseInt(limit),
    includeInactive: includeInactive === 'true'
  });
  
  res.json({
    success: true,
    ...result
  });
});

/**
 * GET /api/categorias/active
 * Lista todas las categorías activas (para selects)
 */
const getAllActive = asyncHandler(async (req, res) => {
  const categorias = await categoriaService.getAllActive();
  
  res.json({
    success: true,
    data: categorias
  });
});

/**
 * GET /api/categorias/:id
 * Obtiene una categoría por ID
 */
const getById = asyncHandler(async (req, res) => {
  const categoria = await categoriaService.getById(parseInt(req.params.id));
  
  res.json({
    success: true,
    data: categoria
  });
});

/**
 * POST /api/categorias
 * Crea una nueva categoría
 */
const create = asyncHandler(async (req, res) => {
  const { nombre, descripcion } = req.body;
  
  const categoria = await categoriaService.create({ nombre, descripcion });
  
  res.status(201).json({
    success: true,
    message: 'Categoría creada exitosamente',
    data: categoria
  });
});

/**
 * PUT /api/categorias/:id
 * Actualiza una categoría
 */
const update = asyncHandler(async (req, res) => {
  const { nombre, descripcion, activo } = req.body;
  
  const categoria = await categoriaService.update(parseInt(req.params.id), { 
    nombre, descripcion, activo 
  });
  
  res.json({
    success: true,
    message: 'Categoría actualizada exitosamente',
    data: categoria
  });
});

/**
 * DELETE /api/categorias/:id
 * Elimina una categoría
 */
const remove = asyncHandler(async (req, res) => {
  await categoriaService.delete(parseInt(req.params.id));
  
  res.json({
    success: true,
    message: 'Categoría eliminada exitosamente'
  });
});

module.exports = {
  getAll,
  getAllActive,
  getById,
  create,
  update,
  remove
};
