/**
 * Tests para el middleware checkRegistroHabilitado — CRÍTICO
 * Verifica comportamiento fail-closed ante errores de BD
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

  const { checkRegistroHabilitado } = require('../middleware');

  // Ruta de prueba: si el middleware pasa, retorna 200
  app.post('/test/registro', checkRegistroHabilitado, (req, res) => {
    res.status(200).json({ success: true, message: 'Registro permitido' });
  });

  return app;
};

describe('checkRegistroHabilitado middleware', () => {
  let app;

  beforeAll(() => { app = createTestApp(); });

  beforeEach(() => { jest.resetAllMocks(); });

  it('debería permitir el request cuando NO existen admins (total = 0)', async () => {
    db.queryOne.mockResolvedValueOnce({ total: 0 }); // countAdmins → 0

    const res = await request(app).post('/test/registro').send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/permitido/i);
  });

  it('debería retornar 403 cuando ya existe un admin activo', async () => {
    db.queryOne.mockResolvedValueOnce({ total: 1 }); // countAdmins → 1

    const res = await request(app).post('/test/registro').send({});

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/deshabilitado/i);
  });

  it('debería retornar 403 cuando existen múltiples admins', async () => {
    db.queryOne.mockResolvedValueOnce({ total: 3 }); // countAdmins → 3

    const res = await request(app).post('/test/registro').send({});

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('debería retornar 503 (fail-closed) cuando la BD falla — NO llamar next()', async () => {
    db.queryOne.mockRejectedValueOnce(new Error('Connection timeout'));

    const res = await request(app).post('/test/registro').send({});

    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/no disponible/i);
  });

  it('debería retornar 503 ante cualquier error de BD, no 200 ni 403', async () => {
    db.queryOne.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const res = await request(app).post('/test/registro').send({});

    // El sistema debe BLOQUEAR el registro ante errores (fail-closed)
    expect(res.status).not.toBe(200); // nunca permitir
    expect(res.status).not.toBe(403); // no es un rechazo de negocio
    expect(res.status).toBe(503);     // es un error de infraestructura
  });
});
