/**
 * Rutas de Categorías
 * Endpoints: /api/categorias
 */
const express = require('express');
const router = express.Router();
const { categoriaController } = require('../controllers');
const { authenticate, isAdmin, categoryValidation, commonValidation } = require('../middleware');

/**
 * @route   GET /api/categorias
 * @desc    Listar todas las categorías
 * @access  Private
 */
router.get('/', authenticate, commonValidation.pagination, categoriaController.getAll);

/**
 * @route   GET /api/categorias/active
 * @desc    Listar categorías activas (para selects)
 * @access  Private
 */
router.get('/active', authenticate, categoriaController.getAllActive);

/**
 * @route   GET /api/categorias/:id
 * @desc    Obtener una categoría por ID
 * @access  Private
 */
router.get('/:id', authenticate, commonValidation.id, categoriaController.getById);

/**
 * @route   POST /api/categorias
 * @desc    Crear una nueva categoría
 * @access  Admin
 */
router.post('/', authenticate, isAdmin, categoryValidation.create, categoriaController.create);

/**
 * @route   PUT /api/categorias/:id
 * @desc    Actualizar una categoría
 * @access  Admin
 */
router.put('/:id', authenticate, isAdmin, categoryValidation.update, categoriaController.update);

/**
 * @route   DELETE /api/categorias/:id
 * @desc    Eliminar una categoría
 * @access  Admin
 */
router.delete('/:id', authenticate, isAdmin, commonValidation.id, categoriaController.remove);

module.exports = router;
