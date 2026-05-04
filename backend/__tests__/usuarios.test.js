/**
 * Tests de integración para endpoints de usuarios
 * /api/usuarios/*
 */
const request = require('supertest');
const express = require('express');

jest.mock('../database', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  run: jest.fn(),
  transaction: jest.fn()
}));

jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('mock_salt'),
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn()
}));

const db = require('../database');
const bcrypt = require('bcryptjs');

const mockAdminUser = { id: 1, rol: 'admin', email: 'admin@test.com' };

const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Inyectar usuario admin autenticado (bypass authenticate + isAdmin)
  app.use((req, res, next) => {
    req.user = mockAdminUser;
    next();
  });

  const usuarioController = require('../controllers/usuarioController');
  const { userValidation, commonValidation, changePasswordValidation } = require('../middleware');

  app.put('/api/usuarios/cambiar-password', changePasswordValidation, usuarioController.changePassword);
  app.get('/api/usuarios', commonValidation.pagination, usuarioController.getAll);
  app.get('/api/usuarios/:id', commonValidation.id, usuarioController.getById);
  app.post('/api/usuarios', userValidation.register, usuarioController.create);
  app.put('/api/usuarios/:id', userValidation.update, usuarioController.update);
  app.delete('/api/usuarios/:id', commonValidation.id, usuarioController.remove);

  app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  });

  return app;
};

describe('Usuarios Endpoints', () => {
  let app;

  beforeAll(() => { app = createTestApp(); });

  beforeEach(() => { jest.resetAllMocks(); });

  describe('GET /api/usuarios', () => {
    it('debería retornar lista paginada de usuarios', async () => {
      const usuarios = [
        { id: 1, nombre: 'Admin', email: 'admin@test.com', rol: 'admin', activo: true },
        { id: 2, nombre: 'Vendedor', email: 'vendedor@test.com', rol: 'vendedor', activo: true }
      ];
      db.query.mockResolvedValueOnce(usuarios);
      db.queryOne.mockResolvedValueOnce({ total: 2 });

      const res = await request(app).get('/api/usuarios');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBe(2);
    });

    it('debería rechazar parámetro page inválido', async () => {
      const res = await request(app).get('/api/usuarios?page=abc');
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/usuarios/:id', () => {
    it('debería retornar un usuario existente', async () => {
      const usuario = { id: 1, nombre: 'Admin', email: 'admin@test.com', rol: 'admin', activo: true };
      db.queryOne.mockResolvedValueOnce(usuario);

      const res = await request(app).get('/api/usuarios/1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(1);
    });

    it('debería retornar 404 si el usuario no existe', async () => {
      db.queryOne.mockResolvedValueOnce(null);

      const res = await request(app).get('/api/usuarios/999');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/usuarios', () => {
    const nuevoUsuario = {
      nombre: 'Nuevo Vendedor',
      email: 'vendedor@test.com',
      password: 'Password123!'
    };

    it('debería crear un usuario válido', async () => {
      db.queryOne.mockResolvedValueOnce(null);            // findByEmail → no existe
      db.run.mockResolvedValueOnce({ lastInsertRowid: 5 }); // INSERT
      db.queryOne.mockResolvedValueOnce({                 // findById
        id: 5, nombre: 'Nuevo Vendedor', email: 'vendedor@test.com', rol: 'vendedor', activo: true
      });

      const res = await request(app).post('/api/usuarios').send(nuevoUsuario);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('vendedor@test.com');
    });

    it('debería rechazar email duplicado', async () => {
      db.queryOne.mockResolvedValueOnce({ id: 1, email: 'vendedor@test.com' }); // ya existe

      const res = await request(app).post('/api/usuarios').send(nuevoUsuario);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('debería rechazar datos inválidos', async () => {
      const res = await request(app)
        .post('/api/usuarios')
        .send({ nombre: '', email: 'noesemail', password: '123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/usuarios/:id', () => {
    it('debería actualizar un usuario existente', async () => {
      const usuarioExistente = { id: 2, nombre: 'Vendedor', email: 'v@test.com', rol: 'vendedor', activo: true };
      db.queryOne.mockResolvedValueOnce(usuarioExistente); // findById
      db.run.mockResolvedValueOnce({ changes: 1 });        // UPDATE
      db.queryOne.mockResolvedValueOnce({ ...usuarioExistente, nombre: 'Actualizado' }); // findById post-update

      const res = await request(app)
        .put('/api/usuarios/2')
        .send({ nombre: 'Actualizado' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('debería retornar 404 si el usuario no existe', async () => {
      db.queryOne.mockResolvedValueOnce(null);

      const res = await request(app)
        .put('/api/usuarios/999')
        .send({ nombre: 'Nuevo Nombre' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/usuarios/:id', () => {
    it('debería desactivar (soft delete) un usuario vendedor', async () => {
      const vendedor = { id: 2, nombre: 'Vendedor', rol: 'vendedor', activo: true };
      db.queryOne.mockResolvedValueOnce(vendedor);                  // findById
      db.run.mockResolvedValueOnce({ changes: 1 });                  // UPDATE activo=0
      db.run.mockResolvedValueOnce({ changes: 1 });                  // INSERT blacklist

      const res = await request(app).delete('/api/usuarios/2');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/desactivado/i);
    });

    it('debería proteger al último administrador activo', async () => {
      const ultimoAdmin = { id: 1, nombre: 'Admin', rol: 'admin', activo: true };
      db.queryOne.mockResolvedValueOnce(ultimoAdmin);    // findById
      db.queryOne.mockResolvedValueOnce({ total: 1 });   // countAdmins → solo 1

      const res = await request(app).delete('/api/usuarios/1');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/único administrador/i);
    });
  });

  describe('PUT /api/usuarios/cambiar-password', () => {
    it('debería cambiar la contraseña con datos correctos', async () => {
      const usuario = { id: 1, password: 'hashed_old' };
      db.queryOne.mockResolvedValueOnce(usuario);  // findById
      bcrypt.compare.mockResolvedValueOnce(true);  // contraseña actual correcta
      db.run.mockResolvedValueOnce({ changes: 1 }); // UPDATE password

      const res = await request(app)
        .put('/api/usuarios/cambiar-password')
        .send({ passwordActual: 'OldPass1!', passwordNueva: 'NewPass1!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('debería rechazar si la contraseña actual es incorrecta', async () => {
      const usuario = { id: 1, password: 'hashed_old' };
      db.queryOne.mockResolvedValueOnce(usuario);   // findById
      bcrypt.compare.mockResolvedValueOnce(false);  // contraseña incorrecta

      const res = await request(app)
        .put('/api/usuarios/cambiar-password')
        .send({ passwordActual: 'WrongPass', passwordNueva: 'NewPass1!' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('debería rechazar si falta la contraseña nueva', async () => {
      const res = await request(app)
        .put('/api/usuarios/cambiar-password')
        .send({ passwordActual: 'OldPass1!' });

      expect(res.status).toBe(400);
    });
  });
});
