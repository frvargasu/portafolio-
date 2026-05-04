/**
 * Tests de integración para endpoints de reportes
 * /api/reportes/*
 */
const request = require('supertest');
const express = require('express');

jest.mock('../database', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  run: jest.fn(),
  transaction: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock_token'),
  verify: jest.fn(),
  decode: jest.fn()
}));

const db = require('../database');
const jwt = require('jsonwebtoken');

// App sin auth (casos de éxito)
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  app.use((req, res, next) => {
    req.user = { id: 1, rol: 'admin', email: 'admin@test.com' };
    next();
  });

  const reporteController = require('../controllers/reporteController');

  app.get('/api/reportes/dashboard', reporteController.getDashboard);
  app.get('/api/reportes/ventas-diarias', reporteController.getVentasPorDia);
  app.get('/api/reportes/productos-mas-vendidos', reporteController.getProductosMasVendidos);
  app.get('/api/reportes/bajo-stock', reporteController.getProductosBajoStock);
  app.get('/api/reportes/movimientos-stock', reporteController.getMovimientosStock);
  app.get('/api/reportes/ventas-metodo-pago', reporteController.getVentasPorMetodoPago);
  app.get('/api/reportes/ventas-categoria', reporteController.getVentasPorCategoria);

  app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  });

  return app;
};

// App con authenticate real (para casos de auth denegada)
const createAuthTestApp = () => {
  const app = express();
  app.use(express.json());

  const { authenticate } = require('../middleware');
  const reporteController = require('../controllers/reporteController');

  app.get('/api/reportes/ventas-diarias', authenticate, reporteController.getVentasPorDia);

  app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  });

  return app;
};

describe('Reportes Endpoints', () => {
  let app;
  let authApp;

  beforeAll(() => {
    app = createTestApp();
    authApp = createAuthTestApp();
  });

  beforeEach(() => { jest.resetAllMocks(); });

  describe('GET /api/reportes/ventas-diarias', () => {
    it('debería retornar datos de ventas agrupados por día', async () => {
      const ventasPorDia = [
        { fecha: '2026-05-01', total: 15000, cantidad_ventas: 5 },
        { fecha: '2026-05-02', total: 22000, cantidad_ventas: 8 }
      ];
      // getDailySales usa db.query; getStats usa db.queryOne
      db.query.mockResolvedValueOnce(ventasPorDia);
      db.queryOne.mockResolvedValueOnce({ total_ventas: 13, total_ingresos: 37000, promedio_venta: 2846, venta_maxima: 22000, venta_minima: 15000 });

      const res = await request(app).get('/api/reportes/ventas-diarias');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.detalle_diario).toHaveLength(2);
      expect(res.body.data.detalle_diario[0]).toHaveProperty('fecha');
      expect(res.body.data.detalle_diario[0]).toHaveProperty('total');
    });

    it('debería aceptar filtros de fecha', async () => {
      db.query.mockResolvedValueOnce([]);
      db.queryOne.mockResolvedValueOnce({ total_ventas: 0, total_ingresos: 0, promedio_venta: 0, venta_maxima: 0, venta_minima: 0 });

      const res = await request(app)
        .get('/api/reportes/ventas-diarias?fecha_inicio=2026-05-01&fecha_fin=2026-05-31');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('debería retornar 401 sin token de autenticación', async () => {
      const res = await request(authApp).get('/api/reportes/ventas-diarias');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/reportes/productos-mas-vendidos', () => {
    it('debería retornar lista de productos más vendidos', async () => {
      const productos = [
        { producto_id: 1, nombre: 'Producto A', cantidad_vendida: 50, total_ventas: 75000 },
        { producto_id: 2, nombre: 'Producto B', cantidad_vendida: 30, total_ventas: 45000 }
      ];
      // findTopSelling usa db.query
      db.query.mockResolvedValueOnce(productos);

      const res = await request(app).get('/api/reportes/productos-mas-vendidos');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // El servicio retorna { periodo, resumen, productos }
      expect(res.body.data.productos).toHaveLength(2);
      expect(res.body.data.productos[0]).toHaveProperty('cantidad_vendida');
    });
  });

  describe('GET /api/reportes/bajo-stock', () => {
    it('debería retornar productos con stock bajo', async () => {
      const productosBajoStock = [
        { id: 5, nombre: 'Producto Critico', stock: 3, stock_minimo: 10 }
      ];
      // findLowStock usa db.query
      db.query.mockResolvedValueOnce(productosBajoStock);

      const res = await request(app).get('/api/reportes/bajo-stock');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // El servicio retorna { umbral_configurado, resumen, productos: { sin_stock, criticos, alertas } }
      expect(res.body.data.resumen.total_productos).toBe(1);
      expect(res.body.data.productos).toBeDefined();
    });
  });

  describe('GET /api/reportes/dashboard', () => {
    it('debería retornar métricas del dashboard', async () => {
      const stats = { total_ventas: 5, total_ingresos: 25000, promedio_venta: 5000, venta_maxima: 8000, venta_minima: 2000 };
      // getDashboard: 3x getStats (queryOne) + findLowStock (query) + findTopSelling (query)
      db.queryOne.mockResolvedValue(stats);
      db.query.mockResolvedValue([]);

      const res = await request(app).get('/api/reportes/dashboard');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('ventas');
      expect(res.body.data).toHaveProperty('inventario');
    });
  });
});
