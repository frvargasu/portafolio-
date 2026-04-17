/**
 * Repositorio de Movimientos de Stock
 * Capa de acceso a datos para la tabla movimientos_stock
 */
const db = require('../database');
const { MovimientoStock } = require('../models');

class MovimientoStockRepository {
  /**
   * Obtiene todos los movimientos de stock
   * @param {Object} options - Opciones de filtrado y paginación
   * @returns {Promise<Array>} Lista de movimientos
   */
  async findAll({ page = 1, limit = 20, producto_id, tipo, fecha_inicio, fecha_fin } = {}) {
    const offset = (page - 1) * limit;
    const params = [];
    
    let sql = `
      SELECT 
        ms.*, 
        p.nombre as producto_nombre,
        p.codigo_barras,
        u.nombre as usuario_nombre
      FROM movimientos_stock ms
      INNER JOIN productos p ON ms.producto_id = p.id
      LEFT JOIN usuarios u ON ms.usuario_id = u.id
      WHERE 1=1
    `;
    
    if (producto_id) {
      sql += ' AND ms.producto_id = ?';
      params.push(producto_id);
    }

    if (tipo) {
      sql += ' AND ms.tipo = ?';
      params.push(tipo);
    }

    if (fecha_inicio) {
      sql += ' AND DATE(ms.created_at) >= DATE(?)';
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      sql += ' AND DATE(ms.created_at) <= DATE(?)';
      params.push(fecha_fin);
    }
    
    sql += ' ORDER BY ms.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    return await db.query(sql, params);
  }

  /**
   * Cuenta el total de movimientos
   * @param {Object} options - Opciones de filtrado
   * @returns {Promise<number>} Total de movimientos
   */
  async count({ producto_id, tipo, fecha_inicio, fecha_fin } = {}) {
    const params = [];
    let sql = 'SELECT COUNT(*) as total FROM movimientos_stock WHERE 1=1';
    
    if (producto_id) {
      sql += ' AND producto_id = ?';
      params.push(producto_id);
    }

    if (tipo) {
      sql += ' AND tipo = ?';
      params.push(tipo);
    }

    if (fecha_inicio) {
      sql += ' AND DATE(created_at) >= DATE(?)';
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      sql += ' AND DATE(created_at) <= DATE(?)';
      params.push(fecha_fin);
    }

    const result = await db.queryOne(sql, params);
    return result.total;
  }

  /**
   * Busca un movimiento por ID
   * @param {number} id - ID del movimiento
   * @returns {Promise<Object|null>} Movimiento encontrado
   */
  async findById(id) {
    const sql = `
      SELECT 
        ms.*, 
        p.nombre as producto_nombre,
        u.nombre as usuario_nombre
      FROM movimientos_stock ms
      INNER JOIN productos p ON ms.producto_id = p.id
      LEFT JOIN usuarios u ON ms.usuario_id = u.id
      WHERE ms.id = ?
    `;
    return await db.queryOne(sql, [id]);
  }

  /**
   * Crea un nuevo movimiento de stock
   * @param {Object} data - Datos del movimiento
   * @returns {Promise<Object>} Movimiento creado
   */
  async create(data) {
    const sql = `
      INSERT INTO movimientos_stock (
        producto_id, tipo, cantidad, stock_anterior, stock_nuevo,
        motivo, referencia_id, referencia_tipo, usuario_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await db.run(sql, [
      data.producto_id,
      data.tipo,
      data.cantidad,
      data.stock_anterior,
      data.stock_nuevo,
      data.motivo || null,
      data.referencia_id || null,
      data.referencia_tipo || null,
      data.usuario_id || null
    ]);
    
    return await this.findById(result.lastInsertRowid);
  }

  /**
   * Obtiene los movimientos de un producto específico
   * @param {number} productoId - ID del producto
   * @param {number} limit - Cantidad de registros
   * @returns {Promise<Array>} Movimientos del producto
   */
  async findByProducto(productoId, limit = 20) {
    const sql = `
      SELECT 
        ms.*, u.nombre as usuario_nombre
      FROM movimientos_stock ms
      LEFT JOIN usuarios u ON ms.usuario_id = u.id
      WHERE ms.producto_id = ?
      ORDER BY ms.created_at DESC
      LIMIT ?
    `;
    return await db.query(sql, [productoId, limit]);
  }

  /**
   * Obtiene resumen de movimientos por tipo
   * @param {string} fechaInicio - Fecha de inicio
   * @param {string} fechaFin - Fecha de fin
   * @returns {Promise<Array>} Movimientos agrupados por tipo
   */
  async getSummaryByType(fechaInicio = null, fechaFin = null) {
    let sql = `
      SELECT 
        tipo,
        COUNT(*) as total_movimientos,
        SUM(cantidad) as total_unidades
      FROM movimientos_stock
      WHERE 1=1
    `;
    
    const params = [];
    
    if (fechaInicio) {
      sql += ' AND DATE(created_at) >= DATE(?)';
      params.push(fechaInicio);
    }
    
    if (fechaFin) {
      sql += ' AND DATE(created_at) <= DATE(?)';
      params.push(fechaFin);
    }
    
    sql += ' GROUP BY tipo ORDER BY total_movimientos DESC';
    
    return await db.query(sql, params);
  }
}

module.exports = new MovimientoStockRepository();
