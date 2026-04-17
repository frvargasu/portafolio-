/**
 * Rutas de Usuarios
 * Endpoints: /api/usuarios
 * Solo accesibles por administradores
 */
const express = require('express');
const router = express.Router();
const { usuarioController } = require('../controllers');
const { authenticate, isAdmin, userValidation, commonValidation } = require('../middleware');

// Todas las rutas requieren autenticación y rol admin
router.use(authenticate, isAdmin);

/**
 * @route   GET /api/usuarios
 * @desc    Listar todos los usuarios
 * @access  Admin
 */
router.get('/', commonValidation.pagination, usuarioController.getAll);

/**
 * @route   GET /api/usuarios/:id
 * @desc    Obtener un usuario por ID
 * @access  Admin
 */
router.get('/:id', commonValidation.id, usuarioController.getById);

/**
 * @route   POST /api/usuarios
 * @desc    Crear un nuevo usuario
 * @access  Admin
 */
router.post('/', userValidation.register, usuarioController.create);

/**
 * @route   PUT /api/usuarios/:id
 * @desc    Actualizar un usuario
 * @access  Admin
 */
router.put('/:id', userValidation.update, usuarioController.update);

/**
 * @route   DELETE /api/usuarios/:id
 * @desc    Desactivar un usuario
 * @access  Admin
 */
router.delete('/:id', commonValidation.id, usuarioController.remove);

module.exports = router;
