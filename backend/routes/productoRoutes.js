/**
 * Rutas de Productos
 * Endpoints: /api/productos
 */
const express = require('express');
const router = express.Router();
const { productoController } = require('../controllers');
const { authenticate, isAdmin, productValidation, commonValidation } = require('../middleware');

/**
 * @route   GET /api/productos
 * @desc    Listar todos los productos
 * @access  Private
 */
router.get('/', authenticate, commonValidation.pagination, productoController.getAll);

/**
 * @route   GET /api/productos/low-stock
 * @desc    Obtener productos con bajo stock
 * @access  Private
 */
router.get('/low-stock', authenticate, productoController.getLowStock);

/**
 * @route   GET /api/productos/top-selling
 * @desc    Obtener productos más vendidos
 * @access  Private
 */
router.get('/top-selling', authenticate, productoController.getTopSelling);

/**
 * @route   GET /api/productos/barcode/:codigo
 * @desc    Buscar producto por código de barras
 * @access  Private
 */
router.get('/barcode/:codigo', authenticate, productoController.getByBarcode);

/**
 * @route   GET /api/productos/:id
 * @desc    Obtener un producto por ID
 * @access  Private
 */
router.get('/:id', authenticate, commonValidation.id, productoController.getById);

/**
 * @route   GET /api/productos/:id/stock-history
 * @desc    Obtener historial de stock de un producto
 * @access  Private
 */
router.get('/:id/stock-history', authenticate, commonValidation.id, productoController.getStockHistory);

/**
 * @route   POST /api/productos
 * @desc    Crear un nuevo producto
 * @access  Admin
 */
router.post('/', authenticate, isAdmin, productValidation.create, productoController.create);

/**
 * @route   PUT /api/productos/:id
 * @desc    Actualizar un producto
 * @access  Admin
 */
router.put('/:id', authenticate, isAdmin, productValidation.update, productoController.update);

/**
 * @route   PUT /api/productos/:id/stock
 * @desc    Actualizar stock de un producto
 * @access  Admin
 */
router.put('/:id/stock', authenticate, isAdmin, productValidation.updateStock, productoController.updateStock);

/**
 * @route   DELETE /api/productos/:id
 * @desc    Eliminar un producto
 * @access  Admin
 */
router.delete('/:id', authenticate, isAdmin, commonValidation.id, productoController.remove);

module.exports = router;
