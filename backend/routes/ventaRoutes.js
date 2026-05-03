/**
 * Rutas de Ventas
 * Endpoints: /api/v1/ventas
 */
const express = require('express');
const router = express.Router();
const { ventaController } = require('../controllers');
const { authenticate, isAdmin, saleValidation, commonValidation } = require('../middleware');

/**
 * @swagger
 * tags:
 *   name: Ventas
 *   description: Registro y gestión de ventas (POS)
 */

/**
 * @swagger
 * /ventas:
 *   get:
 *     summary: Listar ventas con paginación
 *     tags: [Ventas]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [completada, cancelada]
 *       - in: query
 *         name: fecha_inicio
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: fecha_fin
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Lista paginada de ventas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Venta' }
 *   post:
 *     summary: Registrar una nueva venta
 *     tags: [Ventas]
 *     description: Disponible para vendedores y administradores. Descuenta stock automáticamente con transacción ACID. Usa SELECT FOR UPDATE para evitar condiciones de carrera.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productos, metodo_pago]
 *             properties:
 *               productos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [producto_id, cantidad]
 *                   properties:
 *                     producto_id: { type: integer, example: 1 }
 *                     cantidad: { type: integer, example: 3 }
 *               metodo_pago:
 *                 type: string
 *                 enum: [efectivo, tarjeta, transferencia]
 *                 example: efectivo
 *               descuento:
 *                 type: number
 *                 example: 0
 *               observaciones:
 *                 type: string
 *                 example: Cliente frecuente
 *     responses:
 *       201:
 *         description: Venta registrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Venta' }
 *       400:
 *         description: Stock insuficiente o datos inválidos
 *       401:
 *         description: No autorizado
 */
router.get('/', authenticate, commonValidation.pagination, ventaController.getAll);
router.post('/', authenticate, saleValidation.create, ventaController.create);

/**
 * @swagger
 * /ventas/today:
 *   get:
 *     summary: Obtener resumen de ventas del día actual
 *     tags: [Ventas]
 *     responses:
 *       200:
 *         description: Ventas de hoy con totales
 */
router.get('/today', authenticate, ventaController.getTodaySales);

/**
 * @swagger
 * /ventas/stats:
 *   get:
 *     summary: Estadísticas de ventas por período
 *     tags: [Ventas]
 *     parameters:
 *       - in: query
 *         name: fecha_inicio
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: fecha_fin
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Estadísticas agrupadas por período
 */
router.get('/stats', authenticate, ventaController.getStats);

/**
 * @swagger
 * /ventas/{id}:
 *   get:
 *     summary: Obtener detalle de una venta con sus productos
 *     tags: [Ventas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Venta con líneas de detalle y datos de productos
 *       404:
 *         description: Venta no encontrada
 */
router.get('/:id', authenticate, commonValidation.id, ventaController.getById);

/**
 * @swagger
 * /ventas/{id}/cancel:
 *   put:
 *     summary: Cancelar una venta y restaurar stock
 *     tags: [Ventas]
 *     description: Solo administradores. Restaura el stock de cada producto vendido en la transacción.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               motivo:
 *                 type: string
 *                 example: Error en el cobro
 *     responses:
 *       200:
 *         description: Venta cancelada y stock restaurado
 *       400:
 *         description: La venta ya está cancelada
 *       403:
 *         description: Se requiere rol admin
 *       404:
 *         description: Venta no encontrada
 */
router.put('/:id/cancel', authenticate, isAdmin, commonValidation.id, ventaController.cancel);

module.exports = router;
