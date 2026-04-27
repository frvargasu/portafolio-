const db = require('../database');
const { Proveedor } = require('../models');

class ProveedorRepository {
  async findAll({ page = 1, limit = 10, includeInactive = false } = {}) {
    const offset = (page - 1) * limit;
    let sql = `SELECT ${Proveedor.publicFields.join(', ')} FROM proveedores`;

    if (!includeInactive) {
      sql += ' WHERE activo = 1';
    }

    sql += ' ORDER BY nombre ASC LIMIT ? OFFSET ?';
    return await db.query(sql, [limit, offset]);
  }

  async count(includeInactive = false) {
    let sql = 'SELECT COUNT(*) as total FROM proveedores';
    if (!includeInactive) {
      sql += ' WHERE activo = 1';
    }
    const result = await db.queryOne(sql);
    return result.total;
  }

  async findById(id) {
    const sql = `SELECT ${Proveedor.publicFields.join(', ')} FROM proveedores WHERE id = ?`;
    return await db.queryOne(sql, [id]);
  }

  async findByName(nombre) {
    const sql = 'SELECT * FROM proveedores WHERE nombre = ?';
    return await db.queryOne(sql, [nombre]);
  }

  async create(data) {
    const fields = Proveedor.createFields.filter(f => data[f] !== undefined);
    const values = fields.map(f => data[f]);
    const sql = `INSERT INTO proveedores (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`;
    const result = await db.run(sql, values);
    return await this.findById(result.lastInsertRowid);
  }

  async update(id, data) {
    const updates = [];
    const values = [];

    for (const field of Proveedor.updateFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(data[field]);
      }
    }

    if (updates.length === 0) return await this.findById(id);

    values.push(id);
    const sql = `UPDATE proveedores SET ${updates.join(', ')} WHERE id = ?`;
    await db.run(sql, values);
    return await this.findById(id);
  }

  async delete(id) {
    const sql = 'UPDATE proveedores SET activo = 0 WHERE id = ?';
    await db.run(sql, [id]);
  }
}

module.exports = new ProveedorRepository();
