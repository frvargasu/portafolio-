/**
 * Repositorio de Productos
 * Capa de acceso a datos para la tabla productos
 */
const db = require('../database');
const { Producto } = require('../models');

class ProductoRepository {
  /**
   * Obtiene todos los productos con información de categoría
   * @param {Object} options - Opciones de filtrado y paginación
   * @returns {Promise<Array>} Lista de productos
   */
  async findAll({ page = 1, limit = 10, categoria_id, search, includeInactive = false } = {}) {
    const offset = (page - 1) * limit;
    const params = [];
    
    let sql = `
      SELECT 
        p.id, p.codigo_barras, p.nombre, p.descripcion, p.imagen_url,
        p.categoria_id, c.nombre as categoria_nombre,
        p.precio_compra, p.precio_venta, p.stock, p.stock_minimo,
        p.activo, p.created_at, p.updated_at
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE 1=1
    `;
    
    if (!includeInactive) {
      sql += ' AND p.activo = 1';
    }

    if (categoria_id) {
      sql += ' AND p.categoria_id = ?';
      params.push(categoria_id);
    }

    if (search) {
      sql += ' AND (p.nombre LIKE ? OR p.codigo_barras LIKE ? OR p.descripcion LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    sql += ' ORDER BY p.nombre ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    return await db.query(sql, params);
  }

  /**
   * Cuenta el total de productos
   * @param {Object} options - Opciones de filtrado
   * @returns {Promise<number>} Total de productos
   */
  async count({ categoria_id, search, includeInactive = false } = {}) {
    const params = [];
    let sql = 'SELECT COUNT(*) as total FROM productos WHERE 1=1';
    
    if (!includeInactive) {
      sql += ' AND activo = 1';
    }

    if (categoria_id) {
      sql += ' AND categoria_id = ?';
      params.push(categoria_id);
    }

    if (search) {
      sql += ' AND (nombre LIKE ? OR codigo_barras LIKE ? OR descripcion LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const result = await db.queryOne(sql, params);
    return result.total;
  }

  /**
   * Busca un producto por ID
   * @param {number} id - ID del producto
   * @returns {Promise<Object|null>} Producto encontrado
   */
  async findById(id) {
    const sql = `
      SELECT 
        p.*, c.nombre as categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.id = ?
    `;
    return await db.queryOne(sql, [id]);
  }

  /**
   * Busca un producto por código de barras
   * @param {string} codigoBarras - Código de barras
   * @returns {Promise<Object|null>} Producto encontrado
   */
  async findByBarcode(codigoBarras) {
    const sql = `
      SELECT 
        p.*, c.nombre as categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.codigo_barras = ?
    `;
    return await db.queryOne(sql, [codigoBarras]);
  }

  /**
   * Crea un nuevo producto
   * @param {Object} data - Datos del producto
   * @returns {Promise<Object>} Producto creado
   */
  async create(data) {
    const sql = `
      INSERT INTO productos (
        codigo_barras, nombre, descripcion, imagen_url, categoria_id,
        precio_compra, precio_venta, stock, stock_minimo
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await db.run(sql, [
      data.codigo_barras || null,
      data.nombre,
      data.descripcion || null,
      data.imagen_url || null,
      data.categoria_id || null,
      data.precio_compra || 0,
      data.precio_venta,
      data.stock || 0,
      data.stock_minimo || 10
    ]);
    
    return await this.findById(result.lastInsertRowid);
  }

  /**
   * Actualiza un producto
   * @param {number} id - ID del producto
   * @param {Object} data - Datos a actualizar
   * @returns {Promise<Object>} Producto actualizado
   */
  async update(id, data) {
    const allowedFields = Producto.updateFields;
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
    const sql = `UPDATE productos SET ${updates.join(', ')} WHERE id = ?`;
    await db.run(sql, values);
    
    return await this.findById(id);
  }

  /**
   * Actualiza el stock de un producto
   * @param {number} id - ID del producto
   * @param {number} nuevoStock - Nuevo valor de stock
   */
  async updateStock(id, nuevoStock) {
    const sql = 'UPDATE productos SET stock = ? WHERE id = ?';
    await db.run(sql, [nuevoStock, id]);
  }

  /**
   * Elimina un producto (soft delete)
   * @param {number} id - ID del producto
   */
  async delete(id) {
    const sql = 'UPDATE productos SET activo = 0 WHERE id = ?';
    await db.run(sql, [id]);
  }

  /**
   * Obtiene productos con stock bajo
   * @param {number} threshold - Umbral de stock bajo (opcional)
   * @returns {Promise<Array>} Lista de productos con bajo stock
   */
  async findLowStock(threshold = null) {
    const sql = `
      SELECT 
        p.*, c.nombre as categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.activo = 1 
        AND p.stock <= ${threshold ? '?' : 'p.stock_minimo'}
      ORDER BY p.stock ASC
    `;
    
    return threshold ? await db.query(sql, [threshold]) : await db.query(sql);
  }

  /**
   * Obtiene los productos más vendidos
   * @param {number} limit - Cantidad de productos
   * @param {string} fechaInicio - Fecha de inicio (opcional)
   * @param {string} fechaFin - Fecha de fin (opcional)
   * @returns {Promise<Array>} Productos más vendidos
   */
  async findTopSelling(limit = 10, fechaInicio = null, fechaFin = null) {
    let sql = `
      SELECT 
        p.id, p.nombre, p.codigo_barras, p.precio_venta,
        SUM(dv.cantidad) as total_vendido,
        SUM(dv.subtotal) as total_ingresos
      FROM productos p
      INNER JOIN detalle_ventas dv ON p.id = dv.producto_id
      INNER JOIN ventas v ON dv.venta_id = v.id
      WHERE v.estado = 'completada'
    `;
    
    const params = [];
    
    if (fechaInicio) {
      sql += ' AND DATE(v.fecha) >= DATE(?)';
      params.push(fechaInicio);
    }
    
    if (fechaFin) {
      sql += ' AND DATE(v.fecha) <= DATE(?)';
      params.push(fechaFin);
    }
    
    sql += `
      GROUP BY p.id
      ORDER BY total_vendido DESC
      LIMIT ?
    `;
    params.push(limit);
    
    return await db.query(sql, params);
  }
}

module.exports = new ProductoRepository();
