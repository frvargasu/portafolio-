/**
 * Tests de integración para endpoints de ventas
 * /api/ventas/*
 */
const request = require('supertest');
const express = require('express');

// Mock de la base de datos
jest.mock('../database', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  transaction: jest.fn()
}));

// Mock de jwt para autenticación
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock_token'),
  verify: jest.fn().mockImplementation((token, secret) => {
    if (token === 'valid_token') {
      return { id: 1, email: 'test@example.com', rol: 'vendedor' };
    }
    throw new Error('Invalid token');
  })
}));

const db = require('../database');

// Crear app de Express para testing
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  const ventaController = require('../controllers/ventaController');
  const { authenticate, saleValidation } = require('../middleware');

  app.get('/api/ventas', authenticate, ventaController.getAll);
  app.get('/api/ventas/:id', authenticate, ventaController.getById);
  app.post('/api/ventas', authenticate, saleValidation.create, ventaController.create);
  
  // Error handler
  app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message
    });
  });
  
  return app;
};

describe('Ventas Endpoints', () => {
  let app;
  const authHeader = { Authorization: 'Bearer valid_token' };

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock del usuario autenticado
    db.queryOne.mockImplementation((sql, params) => {
      if (sql.includes('usuarios') && sql.includes('id = ?')) {
        return Promise.resolve({
          id: 1,
          email: 'test@example.com',
          rol: 'vendedor',
          activo: true
        });
      }
      return Promise.resolve(null);
    });
  });

  describe('GET /api/ventas', () => {
    it('debería retornar lista paginada de ventas', async () => {
      const mockVentas = [
        { id: 1, total: 5000, estado: 'completada', fecha: '2026-04-19' },
        { id: 2, total: 3000, estado: 'completada', fecha: '2026-04-19' }
      ];
      
      db.query.mockResolvedValueOnce(mockVentas);
      db.queryOne.mockImplementation((sql) => {
        if (sql.includes('usuarios')) {
          return Promise.resolve({ id: 1, rol: 'vendedor', activo: true });
        }
        if (sql.includes('COUNT')) {
          return Promise.resolve({ total: 2 });
        }
        return Promise.resolve(null);
      });

      const res = await request(app)
        .get('/api/ventas')
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination).toBeDefined();
    });

    it('debería filtrar por rango de fechas', async () => {
      db.query.mockResolvedValueOnce([]);
      db.queryOne.mockImplementation((sql) => {
        if (sql.includes('usuarios')) {
          return Promise.resolve({ id: 1, rol: 'vendedor', activo: true });
        }
        return Promise.resolve({ total: 0 });
      });

      const res = await request(app)
        .get('/api/ventas?fecha_inicio=2026-04-01&fecha_fin=2026-04-19')
        .set(authHeader);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/ventas/:id', () => {
    it('debería retornar una venta con sus detalles', async () => {
      const mockVenta = {
        id: 1,
        total: 5000,
        estado: 'completada',
        detalles: [
          { producto_id: 1, cantidad: 2, precio_unitario: 1500, subtotal: 3000 },
          { producto_id: 2, cantidad: 1, precio_unitario: 2000, subtotal: 2000 }
        ]
      };
      
      db.queryOne.mockImplementation((sql, params) => {
        if (sql.includes('FROM usuarios WHERE')) {
          return Promise.resolve({ id: 1, rol: 'vendedor', activo: true });
        }
        if (sql.includes('FROM ventas v')) {
          return Promise.resolve(mockVenta);
        }
        return Promise.resolve(null);
      });

      db.query.mockResolvedValueOnce(mockVenta.detalles);

      const res = await request(app)
        .get('/api/ventas/1')
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(5000);
    });

    it('debería retornar 404 para venta inexistente', async () => {
      db.queryOne.mockImplementation((sql) => {
        if (sql.includes('FROM usuarios WHERE')) {
          return Promise.resolve({ id: 1, rol: 'vendedor', activo: true });
        }
        return Promise.resolve(null);
      });

      const res = await request(app)
        .get('/api/ventas/999')
        .set(authHeader);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/ventas', () => {
    const nuevaVenta = {
      productos: [
        { producto_id: 1, cantidad: 2 },
        { producto_id: 2, cantidad: 1 }
      ],
      metodo_pago: 'efectivo',
      descuento: 0
    };

    it('debería validar que tenga al menos un producto', async () => {
      const res = await request(app)
        .post('/api/ventas')
        .set(authHeader)
        .send({ ...nuevaVenta, productos: [] });

      expect(res.status).toBe(400);
    });

    it('debería validar método de pago válido', async () => {
      const res = await request(app)
        .post('/api/ventas')
        .set(authHeader)
        .send({ ...nuevaVenta, metodo_pago: 'bitcoin' });

      expect(res.status).toBe(400);
    });

    it('debería validar cantidades positivas', async () => {
      const res = await request(app)
        .post('/api/ventas')
        .set(authHeader)
        .send({
          ...nuevaVenta,
          productos: [{ producto_id: 1, cantidad: -1 }]
        });

      expect(res.status).toBe(400);
    });
  });
});
