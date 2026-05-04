/**
 * Tests de integración para endpoints de categorías
 * /api/categorias/*
 */
const request = require('supertest');
const express = require('express');

jest.mock('../database', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  run: jest.fn(),
  transaction: jest.fn()
}));

const db = require('../database');

const createTestApp = () => {
  const app = express();
  app.use(express.json());

  app.use((req, res, next) => {
    req.user = { id: 1, rol: 'admin', email: 'admin@test.com' };
    next();
  });

  const categoriaController = require('../controllers/categoriaController');
  const { categoryValidation, commonValidation } = require('../middleware');

  app.get('/api/categorias', commonValidation.pagination, categoriaController.getAll);
  app.get('/api/categorias/active', categoriaController.getAllActive);
  app.get('/api/categorias/:id', commonValidation.id, categoriaController.getById);
  app.post('/api/categorias', categoryValidation.create, categoriaController.create);
  app.put('/api/categorias/:id', categoryValidation.update, categoriaController.update);
  app.delete('/api/categorias/:id', commonValidation.id, categoriaController.remove);

  app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  });

  return app;
};

describe('Categorias Endpoints', () => {
  let app;

  beforeAll(() => { app = createTestApp(); });

  beforeEach(() => { jest.resetAllMocks(); });

  describe('GET /api/categorias', () => {
    it('debería retornar lista completa de categorías con paginación', async () => {
      const categorias = [
        { id: 1, nombre: 'Electrónica', activo: true },
        { id: 2, nombre: 'Alimentos', activo: true }
      ];
      db.query.mockResolvedValueOnce(categorias);
      db.queryOne.mockResolvedValueOnce({ total: 2 });

      const res = await request(app).get('/api/categorias');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination.total).toBe(2);
    });
  });

  describe('POST /api/categorias', () => {
    it('debería crear una categoría con datos válidos', async () => {
      const nueva = { id: 6, nombre: 'Deportes', descripcion: 'Artículos deportivos', activo: true };
      db.queryOne.mockResolvedValueOnce(null);              // findByNombre → no existe
      db.run.mockResolvedValueOnce({ lastInsertRowid: 6 }); // INSERT
      db.queryOne.mockResolvedValueOnce(nueva);              // findById

      const res = await request(app)
        .post('/api/categorias')
        .send({ nombre: 'Deportes', descripcion: 'Artículos deportivos' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.nombre).toBe('Deportes');
    });

    it('debería rechazar nombre duplicado', async () => {
      db.queryOne.mockResolvedValueOnce({ id: 1, nombre: 'Electrónica' }); // ya existe

      const res = await request(app)
        .post('/api/categorias')
        .send({ nombre: 'Electrónica' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('debería rechazar nombre vacío', async () => {
      const res = await request(app)
        .post('/api/categorias')
        .send({ nombre: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('debería rechazar nombre demasiado corto', async () => {
      const res = await request(app)
        .post('/api/categorias')
        .send({ nombre: 'A' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/categorias/:id', () => {
    it('debería actualizar una categoría existente', async () => {
      const categoriaExistente = { id: 1, nombre: 'Electrónica', activo: true };
      const categoriaActualizada = { ...categoriaExistente, nombre: 'Tecnología' };
      db.queryOne.mockResolvedValueOnce(categoriaExistente); // findById
      db.queryOne.mockResolvedValueOnce(null);               // findByNombre → libre
      db.run.mockResolvedValueOnce({ changes: 1 });           // UPDATE
      db.queryOne.mockResolvedValueOnce(categoriaActualizada); // findById post-update

      const res = await request(app)
        .put('/api/categorias/1')
        .send({ nombre: 'Tecnología' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('debería retornar 404 para categoría inexistente', async () => {
      db.queryOne.mockResolvedValueOnce(null);

      const res = await request(app)
        .put('/api/categorias/999')
        .send({ nombre: 'Nueva' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/categorias/:id', () => {
    it('debería realizar soft delete de una categoría', async () => {
      const categoria = { id: 3, nombre: 'Hogar', activo: true };
      db.queryOne.mockResolvedValueOnce(categoria);    // findById
      db.queryOne.mockResolvedValueOnce({ total: 0 }); // countProducts → sin productos asociados
      db.run.mockResolvedValueOnce({ changes: 1 });    // UPDATE activo=0

      const res = await request(app).delete('/api/categorias/3');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/eliminada/i);
    });

    it('debería retornar 404 para categoría inexistente', async () => {
      db.queryOne.mockResolvedValueOnce(null);

      const res = await request(app).delete('/api/categorias/999');

      expect(res.status).toBe(404);
    });
  });
});
