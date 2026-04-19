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
  transaction: jest.fn()
}));

// Mock de bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn()
}));

// Mock de jwt
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock_token'),
  verify: jest.fn()
}));

const db = require('../database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Crear app de Express para testing
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Cargar rutas de auth sin rate limiting para tests
  const authController = require('../controllers/authController');
  const { userValidation } = require('../middleware');
  
  app.post('/api/auth/register', userValidation.register, authController.register);
  app.post('/api/auth/login', userValidation.login, authController.login);
  
  // Error handler
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

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    const validUser = {
      nombre: 'Test User',
      email: 'test@example.com',
      password: 'Password123!'
    };

    it('debería registrar un usuario válido', async () => {
      db.queryOne.mockResolvedValueOnce(null); // No existe el email
      db.query.mockResolvedValueOnce({ insertId: 1 }); // Insert exitoso
      db.queryOne.mockResolvedValueOnce({ // Usuario creado
        id: 1,
        nombre: 'Test User',
        email: 'test@example.com',
        rol: 'vendedor'
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBe('mock_token');
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

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
