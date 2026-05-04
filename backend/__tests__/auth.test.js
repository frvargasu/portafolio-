/**
 * Tests de integración para endpoints de autenticación
 * /api/auth/*
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

// Mock de bcrypt
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('mock_salt'),
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn()
}));

// Mock de jwt
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock_token'),
  verify: jest.fn(),
  decode: jest.fn()
}));

const db = require('../database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const createTestApp = () => {
  const app = express();
  app.use(express.json());

  const authController = require('../controllers/authController');
  const { userValidation } = require('../middleware');

  app.post('/api/auth/register', userValidation.register, authController.register);
  app.post('/api/auth/login', userValidation.login, authController.login);

  app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message
    });
  });

  return app;
};

// App con authenticate real para probar logout
const createAuthTestApp = () => {
  const app = express();
  app.use(express.json());

  const { authenticate } = require('../middleware');
  const authController = require('../controllers/authController');

  app.post('/api/auth/logout', authenticate, authController.logout);

  app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message
    });
  });

  return app;
};

describe('Auth Endpoints', () => {
  let app;
  let authApp;

  beforeAll(() => {
    app = createTestApp();
    authApp = createAuthTestApp();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    jwt.sign.mockReturnValue('mock_token');
    bcrypt.genSalt.mockResolvedValue('mock_salt');
    bcrypt.hash.mockResolvedValue('hashed_password');
  });

  describe('POST /api/auth/register', () => {
    const validUser = {
      nombre: 'Test User',
      email: 'test@example.com',
      password: 'Password123!'
    };

    it('debería registrar el primer usuario como admin', async () => {
      db.queryOne.mockResolvedValueOnce(null);             // findByEmail: no existe
      db.queryOne.mockResolvedValueOnce({ total: 0 });     // countAdmins: ninguno aún
      db.run.mockResolvedValueOnce({ lastInsertRowid: 1 }); // INSERT usuario
      db.queryOne.mockResolvedValueOnce({                  // findById tras crear
        id: 1,
        nombre: 'Test User',
        email: 'test@example.com',
        rol: 'admin'
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBe('mock_token');
      expect(res.body.data.user.rol).toBe('admin');
    });

    it('debería rechazar registro cuando ya existe un admin activo', async () => {
      db.queryOne.mockResolvedValueOnce(null);           // findByEmail: no existe
      db.queryOne.mockResolvedValueOnce({ total: 1 });   // countAdmins: ya hay uno

      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/cerrado/);
    });

    it('debería rechazar email duplicado', async () => {
      db.queryOne.mockResolvedValueOnce({ id: 1, email: 'test@example.com' });

      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('debería rechazar email inválido', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, email: 'invalid-email' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('debería rechazar password débil', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, password: '123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('debería rechazar nombre vacío', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, nombre: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    const credentials = {
      email: 'test@example.com',
      password: 'Password123!'
    };

    it('debería autenticar credenciales válidas', async () => {
      db.queryOne.mockResolvedValueOnce({
        id: 1,
        nombre: 'Test User',
        email: 'test@example.com',
        password: 'hashed_password',
        rol: 'vendedor',
        activo: true
      });
      bcrypt.compare.mockResolvedValueOnce(true);

      const res = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBe('mock_token');
    });

    it('debería rechazar email inexistente', async () => {
      db.queryOne.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('debería rechazar password incorrecta', async () => {
      db.queryOne.mockResolvedValueOnce({
        id: 1,
        email: 'test@example.com',
        password: 'hashed_password',
        activo: true
      });
      bcrypt.compare.mockResolvedValueOnce(false);

      const res = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('debería rechazar usuario inactivo', async () => {
      db.queryOne.mockResolvedValueOnce({
        id: 1,
        email: 'test@example.com',
        password: 'hashed_password',
        activo: false
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('debería cerrar sesión e invalidar el token', async () => {
      const exp = Math.floor(Date.now() / 1000) + 3600;
      jwt.verify.mockReturnValueOnce({ id: 1, email: 'test@example.com', rol: 'admin', exp });
      jwt.decode.mockReturnValueOnce({ id: 1, exp });
      db.queryOne.mockResolvedValueOnce(null); // isBlacklisted → false
      db.run.mockResolvedValueOnce({ changes: 1 }); // INSERT en blacklist

      const res = await request(authApp)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer eyJ.test.token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/cerrada/i);
    });

    it('debería rechazar logout sin Authorization header', async () => {
      const res = await request(authApp).post('/api/auth/logout');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('debería rechazar logout con token expirado', async () => {
      jwt.verify.mockImplementationOnce(() => {
        const err = new Error('jwt expired');
        err.name = 'TokenExpiredError';
        throw err;
      });

      const res = await request(authApp)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer expired.token.here');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
