/**
 * Rutas de Reportes
 * Endpoints: /api/reportes
 */
const express = require('express');
const router = express.Router();
const { reporteController } = require('../controllers');
const { authenticate } = require('../middleware');

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * @route   GET /api/reportes/dashboard
 * @desc    Obtener dashboard con métricas principales
 * @access  Private
 */
router.get('/dashboard', reporteController.getDashboard);

/**
 * @route   GET /api/reportes/ventas-diarias
 * @desc    Obtener reporte de ventas por día
 * @access  Private
 */
router.get('/ventas-diarias', reporteController.getVentasPorDia);

/**
 * @route   GET /api/reportes/productos-mas-vendidos
 * @desc    Obtener reporte de productos más vendidos
 * @access  Private
 */
router.get('/productos-mas-vendidos', reporteController.getProductosMasVendidos);

/**
 * @route   GET /api/reportes/bajo-stock
 * @desc    Obtener reporte de productos con bajo stock
 * @access  Private
 */
router.get('/bajo-stock', reporteController.getProductosBajoStock);

/**
 * @route   GET /api/reportes/movimientos-stock
 * @desc    Obtener reporte de movimientos de inventario
 * @access  Private
 */
router.get('/movimientos-stock', reporteController.getMovimientosStock);

/**
 * @route   GET /api/reportes/ventas-metodo-pago
 * @desc    Obtener ventas agrupadas por método de pago
 * @access  Private
 */
router.get('/ventas-metodo-pago', reporteController.getVentasPorMetodoPago);

/**
 * @route   GET /api/reportes/ventas-categoria
 * @desc    Obtener ventas agrupadas por categoría
 * @access  Private
 */
router.get('/ventas-categoria', reporteController.getVentasPorCategoria);

module.exports = router;
