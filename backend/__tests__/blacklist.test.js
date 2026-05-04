/**
 * Tests unitarios para tokenBlacklistRepository
 * Verifica que los tokens se almacenan como hash SHA-256
 */
const crypto = require('crypto');

jest.mock('../database', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  run: jest.fn(),
  transaction: jest.fn()
}));

const db = require('../database');
const tokenBlacklistRepository = require('../repositories/tokenBlacklistRepository');

describe('TokenBlacklistRepository — SHA-256 hashing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.run.mockResolvedValue({ changes: 1 });
    db.queryOne.mockResolvedValue(null);
  });

  describe('add()', () => {
    it('debería almacenar el hash SHA-256, no el token en crudo', async () => {
      const rawToken = 'eyJhbGciOiJIUzI1NiJ9.payload.signature';
      const expectedHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      await tokenBlacklistRepository.add(rawToken, 1, new Date());

      expect(db.run).toHaveBeenCalledTimes(1);
      const [, params] = db.run.mock.calls[0];
      expect(params[0]).toBe(expectedHash);
      expect(params[0]).not.toBe(rawToken);
      expect(params[0]).toHaveLength(64); // SHA-256 hex = 64 chars
    });

    it('debería almacenar el hash de BLOCKED para bloqueos de usuario', async () => {
      const blockedHash = crypto.createHash('sha256').update('BLOCKED').digest('hex');

      await tokenBlacklistRepository.add('BLOCKED', 5, new Date());

      const [, params] = db.run.mock.calls[0];
      expect(params[0]).toBe(blockedHash);
      expect(params[0]).toHaveLength(64);
    });
  });

  describe('isBlacklisted()', () => {
    it('debería retornar true cuando el hash del token está en la blacklist', async () => {
      const rawToken = 'eyJhbGciOiJIUzI1NiJ9.payload.signature';
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      db.queryOne.mockResolvedValueOnce({ id: 42 }); // encontrado

      const result = await tokenBlacklistRepository.isBlacklisted(rawToken, 1);

      expect(result).toBe(true);
      const [, params] = db.queryOne.mock.calls[0];
      // Primer parámetro debe ser el hash del token
      expect(params[0]).toBe(tokenHash);
    });

    it('debería retornar false cuando el token no está en la blacklist', async () => {
      db.queryOne.mockResolvedValueOnce(null); // no encontrado

      const result = await tokenBlacklistRepository.isBlacklisted('valid.jwt.token', 1);

      expect(result).toBe(false);
    });

    it('debería verificar bloqueo por usuario usando hash de BLOCKED', async () => {
      const blockedHash = crypto.createHash('sha256').update('BLOCKED').digest('hex');

      db.queryOne.mockResolvedValueOnce({ id: 10 }); // usuario bloqueado

      const result = await tokenBlacklistRepository.isBlacklisted('any.valid.token', 99);

      expect(result).toBe(true);
      const [, params] = db.queryOne.mock.calls[0];
      // Tercer parámetro debe ser el hash de BLOCKED
      expect(params[2]).toBe(blockedHash);
    });

    it('debería usar el hash del token en la query, no el JWT en crudo', async () => {
      const rawToken = 'sensitive.jwt.raw.token';
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      db.queryOne.mockResolvedValueOnce(null);

      await tokenBlacklistRepository.isBlacklisted(rawToken, 1);

      const [, params] = db.queryOne.mock.calls[0];
      expect(params).not.toContain(rawToken); // el token raw NO debe aparecer
      expect(params[0]).toBe(tokenHash);      // solo el hash
    });
  });

  describe('cleanExpired()', () => {
    it('debería eliminar registros expirados y retornar la cantidad', async () => {
      db.run.mockResolvedValueOnce({ changes: 3 });

      const removed = await tokenBlacklistRepository.cleanExpired();

      expect(removed).toBe(3);
      expect(db.run).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        expect.anything()
      );
    });

    it('debería retornar 0 si no hay registros expirados', async () => {
      db.run.mockResolvedValueOnce({ changes: 0 });

      const removed = await tokenBlacklistRepository.cleanExpired();

      expect(removed).toBe(0);
    });
  });
});
