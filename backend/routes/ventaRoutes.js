/**
 * Rutas de Ventas
 * Endpoints: /api/ventas
 */
const express = require('express');
const router = express.Router();
const { ventaController } = require('../controllers');
const { authenticate, isAdmin, saleValidation, commonValidation } = require('../middleware');

/**
 * @route   GET /api/ventas
 * @desc    Listar todas las ventas
 * @access  Private
 */
router.get('/', authenticate, commonValidation.pagination, ventaController.getAll);

/**
 * @route   GET /api/ventas/today
 * @desc    Obtener ventas del día
 * @access  Private
 */
router.get('/today', authenticate, ventaController.getTodaySales);

/**
 * @route   GET /api/ventas/stats
 * @desc    Obtener estadísticas de ventas
 * @access  Private
 */
router.get('/stats', authenticate, ventaController.getStats);

/**
 * @route   GET /api/ventas/:id
 * @desc    Obtener una venta por ID con detalles
 * @access  Private
 */
router.get('/:id', authenticate, commonValidation.id, ventaController.getById);

/**
 * @route   POST /api/ventas
 * @desc    Registrar una nueva venta
 * @access  Private (vendedor o admin)
 */
router.post('/', authenticate, saleValidation.create, ventaController.create);

/**
 * @route   PUT /api/ventas/:id/cancel
 * @desc    Cancelar una venta
 * @access  Admin
 */
router.put('/:id/cancel', authenticate, isAdmin, commonValidation.id, ventaController.cancel);

module.exports = router;
