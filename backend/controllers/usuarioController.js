/**
 * Controlador de Usuarios
 * Maneja la gestión de usuarios (solo admin)
 */
const { usuarioService } = require('../services');
const { asyncHandler } = require('../middleware');

/**
 * GET /api/usuarios
 * Lista todos los usuarios
 */
const getAll = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, includeInactive } = req.query;
  
  const result = await usuarioService.getAll({
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
 * GET /api/usuarios/:id
 * Obtiene un usuario por ID
 */
const getById = asyncHandler(async (req, res) => {
  const usuario = await usuarioService.getById(parseInt(req.params.id));
  
  res.json({
    success: true,
    data: usuario
  });
});

/**
 * POST /api/usuarios
 * Crea un nuevo usuario
 */
const create = asyncHandler(async (req, res) => {
  const { nombre, email, password, rol } = req.body;
  
  const usuario = await usuarioService.create({ nombre, email, password, rol });
  
  res.status(201).json({
    success: true,
    message: 'Usuario creado exitosamente',
    data: usuario
  });
});

/**
 * PUT /api/usuarios/:id
 * Actualiza un usuario
 */
const update = asyncHandler(async (req, res) => {
  const { nombre, email, rol, activo } = req.body;
  
  const usuario = await usuarioService.update(parseInt(req.params.id), { 
    nombre, email, rol, activo 
  });
  
  res.json({
    success: true,
    message: 'Usuario actualizado exitosamente',
    data: usuario
  });
});

/**
 * DELETE /api/usuarios/:id
 * Desactiva un usuario
 */
const remove = asyncHandler(async (req, res) => {
  await usuarioService.delete(parseInt(req.params.id));
  
  res.json({
    success: true,
    message: 'Usuario desactivado exitosamente'
  });
});

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove
};
