/**
 * Repositorio de Categorías
 * Capa de acceso a datos para la tabla categorias
 */
const db = require('../database');
const { Categoria } = require('../models');

class CategoriaRepository {
  /**
   * Obtiene todas las categorías
   * @param {Object} options - Opciones de paginación
   * @returns {Promise<Array>} Lista de categorías
   */
  async findAll({ page = 1, limit = 10, includeInactive = false } = {}) {
    const offset = (page - 1) * limit;
    let sql = `SELECT ${Categoria.publicFields.join(', ')} FROM categorias`;
    
    if (!includeInactive) {
      sql += ' WHERE activo = 1';
    }
    
    sql += ' ORDER BY nombre ASC LIMIT ? OFFSET ?';
    
    return await db.query(sql, [limit, offset]);
  }

  /**
   * Obtiene todas las categorías sin paginación (para selects)
   * @returns {Promise<Array>} Lista de categorías activas
   */
  async findAllActive() {
    const sql = `
      SELECT id, nombre 
      FROM categorias 
      WHERE activo = 1 
      ORDER BY nombre ASC
    `;
    return await db.query(sql);
  }

  /**
   * Cuenta el total de categorías
   * @param {boolean} includeInactive - Incluir categorías inactivas
   * @returns {Promise<number>} Total de categorías
   */
  async count(includeInactive = false) {
    let sql = 'SELECT COUNT(*) as total FROM categorias';
    if (!includeInactive) {
      sql += ' WHERE activo = 1';
    }
    const result = await db.queryOne(sql);
    return result.total;
  }

  /**
   * Busca una categoría por ID
   * @param {number} id - ID de la categoría
   * @returns {Promise<Object|null>} Categoría encontrada
   */
  async findById(id) {
    const sql = `SELECT ${Categoria.publicFields.join(', ')} FROM categorias WHERE id = ?`;
    return await db.queryOne(sql, [id]);
  }

  /**
   * Busca una categoría por nombre
   * @param {string} nombre - Nombre de la categoría
   * @returns {Promise<Object|null>} Categoría encontrada
   */
  async findByName(nombre) {
    const sql = 'SELECT * FROM categorias WHERE nombre = ?';
    return await db.queryOne(sql, [nombre]);
  }

  /**
   * Crea una nueva categoría
   * @param {Object} data - Datos de la categoría
   * @returns {Promise<Object>} Categoría creada
   */
  async create({ nombre, descripcion = null }) {
    const sql = `
      INSERT INTO categorias (nombre, descripcion)
      VALUES (?, ?)
    `;
    const result = await db.run(sql, [nombre, descripcion]);
    return await this.findById(result.lastInsertRowid);
  }

  /**
   * Actualiza una categoría
   * @param {number} id - ID de la categoría
   * @param {Object} data - Datos a actualizar
   * @returns {Promise<Object>} Categoría actualizada
   */
  async update(id, data) {
    const allowedFields = Categoria.updateFields;
    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(data[field]);
      }
    }

    if (updates.length === 0) return await this.findById(id);

    values.push(id);
    const sql = `UPDATE categorias SET ${updates.join(', ')} WHERE id = ?`;
    await db.run(sql, values);
    
    return await this.findById(id);
  }

  /**
   * Elimina una categoría (soft delete)
   * @param {number} id - ID de la categoría
   */
  async delete(id) {
    const sql = 'UPDATE categorias SET activo = 0 WHERE id = ?';
    await db.run(sql, [id]);
  }

  /**
   * Cuenta productos en una categoría
   * @param {number} categoriaId - ID de la categoría
   * @returns {Promise<number>} Cantidad de productos
   */
  async countProducts(categoriaId) {
    const sql = 'SELECT COUNT(*) as total FROM productos WHERE categoria_id = ? AND activo = 1';
    const result = await db.queryOne(sql, [categoriaId]);
    return result.total;
  }
}

module.exports = new CategoriaRepository();
