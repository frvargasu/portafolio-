/**
 * Rutas de Productos
 * Endpoints: /api/v1/productos
 */
const express = require('express');
const router = express.Router();
const { productoController } = require('../controllers');
const { authenticate, isAdmin, productValidation, commonValidation } = require('../middleware');

/**
 * @swagger
 * tags:
 *   name: Productos
 *   description: Gestión de inventario de productos
 */

/**
 * @swagger
 * /productos:
 *   get:
 *     summary: Listar productos con paginación y filtros
 *     tags: [Productos]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Buscar por nombre o código de barras
 *       - in: query
 *         name: categoria_id
 *         schema: { type: integer }
 *       - in: query
 *         name: low_stock
 *         schema: { type: boolean }
 *         description: Filtrar solo productos con stock bajo
 *     responses:
 *       200:
 *         description: Lista paginada de productos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Producto' }
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total: { type: integer }
 *                     page: { type: integer }
 *                     totalPages: { type: integer }
 *       401:
 *         description: No autorizado
 *   post:
 *     summary: Crear un nuevo producto
 *     tags: [Productos]
 *     description: Solo administradores
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, precio_venta, categoria_id]
 *             properties:
 *               nombre: { type: string, example: Leche Entera 1L }
 *               codigo_barras: { type: string, example: '7890000000001' }
 *               precio_compra: { type: number, example: 800 }
 *               precio_venta: { type: number, example: 1200 }
 *               stock: { type: integer, example: 50 }
 *               stock_minimo: { type: integer, example: 10 }
 *               categoria_id: { type: integer, example: 1 }
 *     responses:
 *       201:
 *         description: Producto creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Producto' }
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: Se requiere rol admin
 */
router.get('/', authenticate, commonValidation.pagination, productoController.getAll);
router.post('/', authenticate, isAdmin, productValidation.create, productoController.create);

/**
 * @swagger
 * /productos/low-stock:
 *   get:
 *     summary: Obtener productos con stock bajo o crítico
 *     tags: [Productos]
 *     responses:
 *       200:
 *         description: Lista de productos bajo el umbral de stock mínimo
 */
router.get('/low-stock', authenticate, productoController.getLowStock);

/**
 * @swagger
 * /productos/top-selling:
 *   get:
 *     summary: Obtener los productos más vendidos
 *     tags: [Productos]
 *     responses:
 *       200:
 *         description: Top productos por cantidad vendida
 */
router.get('/top-selling', authenticate, productoController.getTopSelling);

/**
 * @swagger
 * /productos/barcode/{codigo}:
 *   get:
 *     summary: Buscar producto por código de barras
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema: { type: string }
 *         example: '7890000000001'
 *     responses:
 *       200:
 *         description: Producto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Producto' }
 *       404:
 *         description: Producto no encontrado
 */
router.get('/barcode/:codigo', authenticate, productoController.getByBarcode);

/**
 * @swagger
 * /productos/{id}:
 *   get:
 *     summary: Obtener un producto por ID
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Detalle del producto
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Producto' }
 *       404:
 *         description: Producto no encontrado
 *   put:
 *     summary: Actualizar un producto
 *     tags: [Productos]
 *     description: Solo administradores
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Producto' }
 *     responses:
 *       200:
 *         description: Producto actualizado
 *       403:
 *         description: Se requiere rol admin
 *       404:
 *         description: Producto no encontrado
 *   delete:
 *     summary: Eliminar (desactivar) un producto
 *     tags: [Productos]
 *     description: Soft delete — solo administradores. No elimina productos con ventas registradas.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Producto desactivado
 *       403:
 *         description: Se requiere rol admin
 *       409:
 *         description: El producto tiene ventas registradas y no puede eliminarse
 */
router.get('/:id', authenticate, commonValidation.id, productoController.getById);
router.put('/:id', authenticate, isAdmin, productValidation.update, productoController.update);
router.delete('/:id', authenticate, isAdmin, commonValidation.id, productoController.remove);

/**
 * @swagger
 * /productos/{id}/stock:
 *   put:
 *     summary: Ajustar stock de un producto
 *     tags: [Productos]
 *     description: Solo administradores. Registra movimiento en historial de stock.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tipo, cantidad]
 *             properties:
 *               tipo:
 *                 type: string
 *                 enum: [entrada, salida, ajuste]
 *                 example: entrada
 *               cantidad:
 *                 type: integer
 *                 example: 20
 *               motivo:
 *                 type: string
 *                 example: Reposición semanal
 *     responses:
 *       200:
 *         description: Stock actualizado
 *       400:
 *         description: Stock insuficiente para salida
 *       403:
 *         description: Se requiere rol admin
 */
router.put('/:id/stock', authenticate, isAdmin, productValidation.updateStock, productoController.updateStock);

/**
 * @swagger
 * /productos/{id}/stock-history:
 *   get:
 *     summary: Historial de movimientos de stock de un producto
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Lista de movimientos (entradas, salidas, ajustes, ventas)
 */
router.get('/:id/stock-history', authenticate, commonValidation.id, productoController.getStockHistory);

module.exports = router;
