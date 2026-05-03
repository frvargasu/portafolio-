/**
 * Tests de integración para endpoints de productos
 * /api/productos/*
 */
const request = require('supertest');
const express = require('express');

// Mock de la base de datos
jest.mock('../database', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  run: jest.fn(),
  transaction: jest.fn()
}));

// Mock de jwt para autenticación
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock_token'),
  verify: jest.fn().mockImplementation((token, secret) => {
    if (token === 'valid_token') {
      return { id: 1, email: 'test@example.com', rol: 'admin' };
    }
    throw new Error('Invalid token');
  })
}));

const db = require('../database');

// Crear app de Express para testing
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  const productoController = require('../controllers/productoController');
  const { authenticate, isAdmin, productValidation } = require('../middleware');

  app.get('/api/productos', authenticate, productoController.getAll);
  app.get('/api/productos/:id', authenticate, productoController.getById);
  app.post('/api/productos', authenticate, isAdmin, productValidation.create, productoController.create);
  
  // Error handler
  app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message
    });
  });
  
  return app;
};

describe('Productos Endpoints', () => {
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
          rol: 'admin',
          activo: true
        });
      }
      return Promise.resolve(null);
    });
  });

  describe('GET /api/productos', () => {
    it('debería retornar lista paginada de productos', async () => {
      const mockProductos = [
        { id: 1, nombre: 'Producto 1', precio_venta: 1000, stock: 50 },
        { id: 2, nombre: 'Producto 2', precio_venta: 2000, stock: 30 }
      ];
      
      db.query.mockResolvedValueOnce(mockProductos);
      db.queryOne.mockResolvedValueOnce({ total: 2 });

      const res = await request(app)
        .get('/api/productos')
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBe(2);
    });

    it('debería soportar paginación', async () => {
      db.query.mockResolvedValueOnce([{ id: 3, nombre: 'Producto 3' }]);
      db.queryOne.mockResolvedValueOnce({ total: 25 });

      const res = await request(app)
        .get('/api/productos?page=2&limit=10')
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(2);
      expect(res.body.pagination.limit).toBe(10);
    });

    it('debería filtrar por categoría', async () => {
      db.query.mockResolvedValueOnce([{ id: 1, nombre: 'Producto', categoria_id: 5 }]);
      db.queryOne.mockResolvedValueOnce({ total: 1 });

      const res = await request(app)
        .get('/api/productos?categoria_id=5')
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(db.query).toHaveBeenCalled();
    });

    it('debería rechazar sin token', async () => {
      const res = await request(app)
        .get('/api/productos');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/productos/:id', () => {
    it('debería retornar un producto por ID', async () => {
      const mockProducto = {
        id: 1,
        nombre: 'Producto Test',
        precio_venta: 1500,
        stock: 100,
        categoria_nombre: 'Bebidas'
      };
      
      db.queryOne.mockImplementation((sql, params) => {
        if (sql.includes('usuarios')) {
          return Promise.resolve({ id: 1, rol: 'admin', activo: true });
        }
        if (sql.includes('productos') && params[0] === 1) {
          return Promise.resolve(mockProducto);
        }
        return Promise.resolve(null);
      });

      const res = await request(app)
        .get('/api/productos/1')
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.nombre).toBe('Producto Test');
    });

    it('debería retornar 404 para producto inexistente', async () => {
      db.queryOne.mockImplementation((sql) => {
        if (sql.includes('usuarios')) {
          return Promise.resolve({ id: 1, rol: 'admin', activo: true });
        }
        return Promise.resolve(null);
      });

      const res = await request(app)
        .get('/api/productos/999')
        .set(authHeader);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/productos', () => {
    const nuevoProducto = {
      nombre: 'Nuevo Producto',
      precio_compra: 800,
      precio_venta: 1200,
      stock: 50,
      stock_minimo: 10,
      categoria_id: 1
    };

    it('debería crear un producto válido', async () => {
      db.queryOne.mockImplementation((sql) => {
        if (sql.includes('FROM usuarios WHERE')) {
          return Promise.resolve({ id: 1, rol: 'admin', activo: true });
        }
        if (sql.includes('FROM categorias')) {
          return Promise.resolve({ id: 1, nombre: 'Categoría' });
        }
        // findById tras crear: LEFT JOIN categorias
        return Promise.resolve({ id: 1, ...nuevoProducto, categoria_nombre: 'Categoría' });
      });

      db.run.mockResolvedValueOnce({ lastInsertRowid: 1 });

      const res = await request(app)
        .post('/api/productos')
        .set(authHeader)
        .send(nuevoProducto);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('debería rechazar sin nombre', async () => {
      const res = await request(app)
        .post('/api/productos')
        .set(authHeader)
        .send({ ...nuevoProducto, nombre: '' });

      expect(res.status).toBe(400);
    });

    it('debería rechazar precio negativo', async () => {
      const res = await request(app)
        .post('/api/productos')
        .set(authHeader)
        .send({ ...nuevoProducto, precio_venta: -100 });

      expect(res.status).toBe(400);
    });
  });
});
