/**
 * Tests de integración para endpoints de proveedores
 * /api/proveedores/*
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

  const proveedorController = require('../controllers/proveedorController');
  const { proveedorValidation, commonValidation } = require('../middleware');

  app.get('/api/proveedores', commonValidation.pagination, proveedorController.getAll);
  app.get('/api/proveedores/:id', commonValidation.id, proveedorController.getById);
  app.post('/api/proveedores', proveedorValidation.create, proveedorController.create);
  app.put('/api/proveedores/:id', proveedorValidation.update, proveedorController.update);
  app.delete('/api/proveedores/:id', commonValidation.id, proveedorController.remove);

  app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  });

  return app;
};

describe('Proveedores Endpoints', () => {
  let app;

  beforeAll(() => { app = createTestApp(); });

  beforeEach(() => { jest.resetAllMocks(); });

  describe('GET /api/proveedores', () => {
    it('debería retornar lista paginada de proveedores', async () => {
      const proveedores = [
        { id: 1, nombre: 'Proveedor A', activo: true },
        { id: 2, nombre: 'Proveedor B', activo: true }
      ];
      db.query.mockResolvedValueOnce(proveedores);
      db.queryOne.mockResolvedValueOnce({ total: 2 });

      const res = await request(app).get('/api/proveedores');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination.total).toBe(2);
    });
  });

  describe('POST /api/proveedores', () => {
    const nuevoProveedor = {
      nombre: 'Distribuidora XYZ',
      contacto: 'Juan Pérez',
      email: 'contacto@xyz.com',
      telefono: '+56912345678'
    };

    it('debería crear un proveedor con datos válidos', async () => {
      const creado = { id: 3, ...nuevoProveedor, activo: true };
      db.queryOne.mockResolvedValueOnce(null);              // findByNombre → libre
      db.run.mockResolvedValueOnce({ lastInsertRowid: 3 }); // INSERT
      db.queryOne.mockResolvedValueOnce(creado);             // findById

      const res = await request(app)
        .post('/api/proveedores')
        .send(nuevoProveedor);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.nombre).toBe('Distribuidora XYZ');
    });

    it('debería rechazar nombre duplicado', async () => {
      db.queryOne.mockResolvedValueOnce({ id: 1, nombre: 'Distribuidora XYZ' }); // ya existe

      const res = await request(app)
        .post('/api/proveedores')
        .send(nuevoProveedor);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('debería rechazar nombre vacío', async () => {
      const res = await request(app)
        .post('/api/proveedores')
        .send({ nombre: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('debería rechazar email con formato inválido', async () => {
      const res = await request(app)
        .post('/api/proveedores')
        .send({ nombre: 'Proveedor Test', email: 'noesemail' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/proveedores/:id', () => {
    it('debería actualizar un proveedor existente', async () => {
      const existente = { id: 1, nombre: 'Proveedor A', activo: true };
      const actualizado = { ...existente, nombre: 'Proveedor A Updated' };
      db.queryOne.mockResolvedValueOnce(existente);  // findById
      db.queryOne.mockResolvedValueOnce(null);        // findByNombre → libre
      db.run.mockResolvedValueOnce({ changes: 1 });   // UPDATE
      db.queryOne.mockResolvedValueOnce(actualizado); // findById post-update

      const res = await request(app)
        .put('/api/proveedores/1')
        .send({ nombre: 'Proveedor A Updated' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('debería retornar 404 para proveedor inexistente', async () => {
      db.queryOne.mockResolvedValueOnce(null);

      const res = await request(app)
        .put('/api/proveedores/999')
        .send({ nombre: 'Nuevo Nombre' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/proveedores/:id', () => {
    it('debería realizar soft delete de un proveedor', async () => {
      const proveedor = { id: 1, nombre: 'Proveedor A', activo: true };
      db.queryOne.mockResolvedValueOnce(proveedor); // findById
      db.run.mockResolvedValueOnce({ changes: 1 });  // UPDATE activo=0

      const res = await request(app).delete('/api/proveedores/1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/eliminado/i);
    });

    it('debería retornar 404 para proveedor inexistente', async () => {
      db.queryOne.mockResolvedValueOnce(null);

      const res = await request(app).delete('/api/proveedores/999');

      expect(res.status).toBe(404);
    });
  });
});
