/**
 * Repositorio de Token Blacklist
 * Gestiona tokens JWT invalidados antes de su expiración natural.
 * Almacena el hash SHA-256 del token, nunca el token en crudo.
 */
const crypto = require('crypto');
const db = require('../database');

class TokenBlacklistRepository {
  /**
   * Devuelve el hash SHA-256 hex (64 chars) del valor recibido.
   * @param {string} value
   * @returns {string}
   */
  _hash(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  /**
   * Agrega un token (o bloqueo de usuario) a la blacklist.
   * Se almacena el hash SHA-256 del token, no el JWT en crudo.
   *
   * Para desactivaciones se usa token = 'BLOCKED' y se bloquea por usuario_id.
   * Para logout se pasa el JWT real, que se hashea antes de guardar.
   *
   * @param {string} token       - JWT string o 'BLOCKED' para bloqueo global de usuario
   * @param {number} usuarioId   - ID del usuario afectado
   * @param {Date}   expiresAt   - Momento en que el registro puede limpiarse
   */
  async add(token, usuarioId, expiresAt) {
    const hash = this._hash(token);
    await db.run(
      `INSERT INTO token_blacklist (token, usuario_id, fecha_expiracion)
       VALUES (?, ?, ?)`,
      [hash, usuarioId, expiresAt]
    );
  }

  /**
   * Verifica si un request debe ser rechazado.
   * Devuelve true si:
   *   - El hash del token está en la blacklist (ej: logout), O
   *   - El usuario tiene un bloqueo global activo (ej: desactivación)
   *
   * @param {string} token     - JWT extraído del header Authorization
   * @param {number} usuarioId - ID del usuario del token decodificado
   * @returns {Promise<boolean>}
   */
  async isBlacklisted(token, usuarioId) {
    const tokenHash = this._hash(token);
    const blockedHash = this._hash('BLOCKED');
    const row = await db.queryOne(
      `SELECT id FROM token_blacklist
       WHERE fecha_expiracion > NOW()
         AND (token = ? OR (usuario_id = ? AND token = ?))
       LIMIT 1`,
      [tokenHash, usuarioId, blockedHash]
    );
    return !!row;
  }

  /**
   * Elimina todos los registros expirados.
   * Ejecutado periódicamente por el job de limpieza.
   *
   * @returns {Promise<number>} Cantidad de filas eliminadas
   */
  async cleanExpired() {
    const result = await db.run(
      'DELETE FROM token_blacklist WHERE fecha_expiracion <= NOW()',
      []
    );
    return result.changes ?? 0;
  }
}

module.exports = new TokenBlacklistRepository();
