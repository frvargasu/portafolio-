/**
 * Repositorio de Usuarios
 * Capa de acceso a datos para la tabla usuarios
 */
const db = require('../database');
const { Usuario } = require('../models');

class UsuarioRepository {
  /**
   * Obtiene todos los usuarios
   * @param {Object} options - Opciones de paginación
   * @returns {Promise<Array>} Lista de usuarios
   */
  async findAll({ page = 1, limit = 10, includeInactive = false } = {}) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT ${Usuario.publicFields.join(', ')}
      FROM usuarios
    `;
    
    if (!includeInactive) {
      sql += ' WHERE activo = 1';
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    
    return await db.query(sql, [limit, offset]);
  }

  /**
   * Cuenta el total de usuarios
   * @param {boolean} includeInactive - Incluir usuarios inactivos
   * @returns {Promise<number>} Total de usuarios
   */
  async count(includeInactive = false) {
    let sql = 'SELECT COUNT(*) as total FROM usuarios';
    if (!includeInactive) {
      sql += ' WHERE activo = 1';
    }
    const result = await db.queryOne(sql);
    return result.total;
  }

  /**
   * Busca un usuario por ID
   * @param {number} id - ID del usuario
   * @returns {Promise<Object|null>} Usuario encontrado
   */
  async findById(id) {
    const sql = 'SELECT * FROM usuarios WHERE id = ?';
    return await db.queryOne(sql, [id]);
  }

  /**
   * Busca un usuario por email
   * @param {string} email - Email del usuario
   * @returns {Promise<Object|null>} Usuario encontrado
   */
  async findByEmail(email) {
    const sql = 'SELECT * FROM usuarios WHERE email = ?';
    return await db.queryOne(sql, [email]);
  }

  /**
   * Crea un nuevo usuario
   * @param {Object} userData - Datos del usuario
   * @returns {Promise<Object>} Usuario creado
   */
  async create({ nombre, email, password, rol = 'vendedor' }) {
    const sql = `
      INSERT INTO usuarios (nombre, email, password, rol)
      VALUES (?, ?, ?, ?)
    `;
    const result = await db.run(sql, [nombre, email, password, rol]);
    return await this.findById(result.lastInsertRowid);
  }

  /**
   * Actualiza un usuario
   * @param {number} id - ID del usuario
   * @param {Object} userData - Datos a actualizar
   * @returns {Promise<Object>} Usuario actualizado
   */
  async update(id, userData) {
    const allowedFields = Usuario.updateFields;
    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (userData[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(userData[field]);
      }
    }

    if (updates.length === 0) return await this.findById(id);

    values.push(id);
    const sql = `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`;
    await db.run(sql, values);
    
    return await this.findById(id);
  }

  /**
   * Actualiza la contraseña de un usuario
   * @param {number} id - ID del usuario
   * @param {string} hashedPassword - Nueva contraseña hasheada
   */
  async updatePassword(id, hashedPassword) {
    const sql = 'UPDATE usuarios SET password = ? WHERE id = ?';
    await db.run(sql, [hashedPassword, id]);
  }

  /**
   * Elimina un usuario (soft delete)
   * @param {number} id - ID del usuario
   */
  async delete(id) {
    const sql = 'UPDATE usuarios SET activo = 0 WHERE id = ?';
    await db.run(sql, [id]);
  }

  /**
   * Elimina un usuario permanentemente
   * @param {number} id - ID del usuario
   */
  async hardDelete(id) {
    const sql = 'DELETE FROM usuarios WHERE id = ?';
    await db.run(sql, [id]);
  }
}

module.exports = new UsuarioRepository();
