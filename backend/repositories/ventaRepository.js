/**
 * Repositorio de Ventas
 * Capa de acceso a datos para las tablas ventas y detalle_ventas
 */
const db = require('../database');
const { AppError } = require('../middleware/errorHandler');
const { Venta, DetalleVenta } = require('../models');

class VentaRepository {
  /**
   * Obtiene todas las ventas con información del usuario
   * @param {Object} options - Opciones de filtrado y paginación
   * @returns {Promise<Array>} Lista de ventas
   */
  async findAll({ page = 1, limit = 10, usuario_id, estado, fecha_inicio, fecha_fin } = {}) {
    const offset = (page - 1) * limit;
    const params = [];

    let sql = `
      SELECT
        v.id, v.fecha, v.subtotal, v.descuento, v.impuesto, v.total,
        v.metodo_pago, v.estado, v.observaciones, v.created_at,
        v.usuario_id, u.nombre as usuario_nombre
      FROM ventas v
      INNER JOIN usuarios u ON v.usuario_id = u.id
      WHERE 1=1
    `;

    if (usuario_id) {
      sql += ' AND v.usuario_id = ?';
      params.push(usuario_id);
    }

    if (estado) {
      sql += ' AND v.estado = ?';
      params.push(estado);
    }

    if (fecha_inicio) {
      sql += ' AND DATE(v.fecha) >= DATE(?)';
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      sql += ' AND DATE(v.fecha) <= DATE(?)';
      params.push(fecha_fin);
    }

    sql += ' ORDER BY v.fecha DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return await db.query(sql, params);
  }

  /**
   * Cuenta el total de ventas
   * @param {Object} options - Opciones de filtrado
   * @returns {Promise<number>} Total de ventas
   */
  async count({ usuario_id, estado, fecha_inicio, fecha_fin } = {}) {
    const params = [];
    let sql = 'SELECT COUNT(*) as total FROM ventas WHERE 1=1';

    if (usuario_id) {
      sql += ' AND usuario_id = ?';
      params.push(usuario_id);
    }

    if (estado) {
      sql += ' AND estado = ?';
      params.push(estado);
    }

    if (fecha_inicio) {
      sql += ' AND DATE(fecha) >= DATE(?)';
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      sql += ' AND DATE(fecha) <= DATE(?)';
      params.push(fecha_fin);
    }

    const result = await db.queryOne(sql, params);
    return result.total;
  }

  /**
   * Busca una venta por ID con sus detalles
   * @param {number} id - ID de la venta
   * @returns {Promise<Object|null>} Venta encontrada con detalles
   */
  async findById(id) {
    const ventaSql = `
      SELECT
        v.*, u.nombre as usuario_nombre
      FROM ventas v
      INNER JOIN usuarios u ON v.usuario_id = u.id
      WHERE v.id = ?
    `;

    const venta = await db.queryOne(ventaSql, [id]);

    if (!venta) return null;

    const detallesSql = `
      SELECT
        dv.*, p.nombre as producto_nombre, p.codigo_barras
      FROM detalle_ventas dv
      INNER JOIN productos p ON dv.producto_id = p.id
      WHERE dv.venta_id = ?
    `;

    venta.detalles = await db.query(detallesSql, [id]);

    return venta;
  }

  /**
   * Crea una nueva venta con sus detalles dentro de una única transacción.
   *
   * Flujo:
   *   1. FOR UPDATE en todos los productos → bloquea filas hasta COMMIT
   *   2. Valida stock y cantidad con datos bloqueados (imposible stock negativo)
   *   3. Recalcula subtotales dentro de la TX → elimina dependencia del service
   *   4. Inserta ventas, detalle_ventas, actualiza stock y registra movimientos
   *   5. Una sola conexión durante todo el proceso; ROLLBACK automático ante cualquier fallo
   *
   * @param {Object} ventaData - {usuario_id, descuento, impuesto, metodo_pago, observaciones}
   * @param {Array}  detalles  - [{producto_id, cantidad, precio_unitario}]
   * @returns {Promise<Object>} Venta creada con sus detalles
   */
  async create(ventaData, detalles) {
    let ventaId;

    await db.transaction(async (connection) => {
      // ─── 1. BLOQUEAR TODOS LOS PRODUCTOS ANTES DE MODIFICAR NADA ──────────
      // FOR UPDATE adquiere un lock de fila exclusivo en InnoDB.
      // Cualquier otra transacción que intente leer/modificar el mismo producto
      // quedará en espera hasta que esta haga COMMIT o ROLLBACK.
      // Esto garantiza que el stock leído aquí es el mismo que se va a decrementar.
      //
      // Se usa un Map<producto_id, producto> para evitar alineación por índice,
      // que sería frágil si el orden del array cambiara.
      const productosMap = new Map();

      for (const detalle of detalles) {
        // Validar que cantidad sea un entero positivo antes de hablar con la BD
        if (!Number.isInteger(detalle.cantidad) || detalle.cantidad <= 0) {
          throw new AppError(
            `La cantidad del producto ID ${detalle.producto_id} debe ser un entero positivo`,
            400
          );
        }

        const [rows] = await connection.query(
          `SELECT id, nombre, stock, stock_minimo
           FROM productos
           WHERE id = ? AND activo = TRUE
           FOR UPDATE`,
          [detalle.producto_id]
        );

        if (rows.length === 0) {
          throw new AppError(
            `Producto con ID ${detalle.producto_id} no encontrado o inactivo`,
            404
          );
        }

        const producto = rows[0];

        if (producto.stock < detalle.cantidad) {
          throw new AppError(
            `Stock insuficiente para "${producto.nombre}". ` +
            `Disponible: ${producto.stock}, solicitado: ${detalle.cantidad}`,
            400
          );
        }

        productosMap.set(detalle.producto_id, producto);
      }

      // ─── 2. RECALCULAR TOTALES DENTRO DE LA TRANSACCIÓN ──────────────────
      // No se confía en los subtotales enviados por el service: se recalculan
      // con los precios bloqueados. Esto evita discrepancias si el precio
      // cambió entre la pre-validación del service y la apertura de la TX.
      let subtotalCalculado = 0;
      const detallesVerificados = detalles.map((detalle) => {
        const producto = productosMap.get(detalle.producto_id);
        const subtotal = parseFloat((detalle.precio_unitario * detalle.cantidad).toFixed(2));
        subtotalCalculado += subtotal;
        return { ...detalle, subtotal };
      });

      subtotalCalculado = parseFloat(subtotalCalculado.toFixed(2));
      const descuento = parseFloat((ventaData.descuento || 0).toFixed(2));
      const impuesto  = parseFloat((ventaData.impuesto  || 0).toFixed(2));
      const total     = parseFloat((subtotalCalculado - descuento + impuesto).toFixed(2));

      if (total < 0) {
        throw new AppError('El descuento no puede ser mayor al subtotal', 400);
      }

      // ─── 3. INSERTAR LA VENTA ─────────────────────────────────────────────
      const [ventaResult] = await connection.query(
        `INSERT INTO ventas
           (usuario_id, subtotal, descuento, impuesto, total, metodo_pago, observaciones)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          ventaData.usuario_id,
          subtotalCalculado,
          descuento,
          impuesto,
          total,
          ventaData.metodo_pago || 'efectivo',
          ventaData.observaciones || null
        ]
      );
      ventaId = ventaResult.insertId;

      // ─── 4. INSERTAR DETALLES, ACTUALIZAR STOCK Y REGISTRAR MOVIMIENTOS ───
      // Se itera sobre detallesVerificados (con subtotales recalculados).
      // El stock se actualiza por valor absoluto (SET stock = ?) y no con
      // decrementos relativos (SET stock = stock - ?) para mayor claridad
      // y porque el valor ya está bloqueado: no puede cambiar entre lecturas.
      for (const detalle of detallesVerificados) {
        const producto   = productosMap.get(detalle.producto_id);
        const stockNuevo = producto.stock - detalle.cantidad;
        const bajoDeMínimo = stockNuevo <= producto.stock_minimo;

        await connection.query(
          `INSERT INTO detalle_ventas
             (venta_id, producto_id, cantidad, precio_unitario, subtotal)
           VALUES (?, ?, ?, ?, ?)`,
          [ventaId, detalle.producto_id, detalle.cantidad, detalle.precio_unitario, detalle.subtotal]
        );

        await connection.query(
          'UPDATE productos SET stock = ? WHERE id = ?',
          [stockNuevo, detalle.producto_id]
        );

        const motivo = bajoDeMínimo
          ? `Venta #${ventaId} — ALERTA: stock bajo (actual: ${stockNuevo}, mínimo: ${producto.stock_minimo})`
          : `Venta #${ventaId}`;

        await connection.query(
          `INSERT INTO movimientos_stock
             (producto_id, tipo, cantidad, stock_anterior, stock_nuevo,
              motivo, referencia_id, referencia_tipo, usuario_id)
           VALUES (?, 'venta', ?, ?, ?, ?, ?, 'venta', ?)`,
          [
            detalle.producto_id,
            detalle.cantidad,
            producto.stock,
            stockNuevo,
            motivo,
            ventaId,
            ventaData.usuario_id
          ]
        );
      }
      // COMMIT ocurre automáticamente al resolver db.transaction()
    });

    // findById usa el pool general (lectura simple, no transaccional)
    // y se ejecuta obligatoriamente después del COMMIT exitoso.
    return await this.findById(ventaId);
  }

  /**
   * Cancela una venta y restaura el stock de cada producto.
   * Toda la operación ocurre en una transacción con FOR UPDATE para evitar
   * que otra operación modifique el stock durante la cancelación.
   * @param {number} id - ID de la venta
   * @param {string|null} observaciones - Motivo de cancelación
   * @param {number} userId - ID del usuario que cancela
   * @returns {Promise<Object>} Venta cancelada con detalles
   */
  async cancel(id, observaciones, userId) {
    await db.transaction(async (connection) => {
      // 1. Bloquear la venta y verificar estado actual
      const [ventaRows] = await connection.query(
        'SELECT id, estado, observaciones FROM ventas WHERE id = ? FOR UPDATE',
        [id]
      );
      if (ventaRows.length === 0) throw new AppError('Venta no encontrada', 404);
      const venta = ventaRows[0];
      if (venta.estado === 'cancelada') throw new AppError('La venta ya está cancelada', 400);

      // 2. Obtener detalles de la venta
      const [detalles] = await connection.query(
        'SELECT producto_id, cantidad FROM detalle_ventas WHERE venta_id = ?',
        [id]
      );

      // 3. Para cada producto: bloquear fila, restaurar stock, registrar movimiento
      for (const detalle of detalles) {
        const [prodRows] = await connection.query(
          'SELECT id, stock FROM productos WHERE id = ? FOR UPDATE',
          [detalle.producto_id]
        );
        const producto  = prodRows[0];
        const stockNuevo = producto.stock + detalle.cantidad;

        await connection.query(
          'UPDATE productos SET stock = ? WHERE id = ?',
          [stockNuevo, detalle.producto_id]
        );

        await connection.query(
          `INSERT INTO movimientos_stock
             (producto_id, tipo, cantidad, stock_anterior, stock_nuevo,
              motivo, referencia_id, referencia_tipo, usuario_id)
           VALUES (?, 'devolucion', ?, ?, ?, ?, ?, 'cancelacion', ?)`,
          [
            detalle.producto_id,
            detalle.cantidad,
            producto.stock,
            stockNuevo,
            `Cancelación de venta #${id}`,
            id,
            userId
          ]
        );
      }

      // 4. Actualizar estado de la venta
      const obsNueva = observaciones
        ? `${venta.observaciones || ''}\nCANCELADA: ${observaciones}`.trim()
        : venta.observaciones;

      await connection.query(
        'UPDATE ventas SET estado = ?, observaciones = ? WHERE id = ?',
        ['cancelada', obsNueva, id]
      );
    });

    return await this.findById(id);
  }

  /**
   * Actualiza el estado de una venta (uso general, sin lógica de stock)
   * @param {number} id - ID de la venta
   * @param {string} estado - Nuevo estado
   * @param {string} observaciones - Observaciones adicionales
   * @returns {Promise<Object>} Venta actualizada
   */
  async updateStatus(id, estado, observaciones = null) {
    let sql = 'UPDATE ventas SET estado = ?';
    const params = [estado];

    if (observaciones) {
      sql += ', observaciones = ?';
      params.push(observaciones);
    }

    sql += ' WHERE id = ?';
    params.push(id);

    await db.run(sql, params);
    return await this.findById(id);
  }

  /**
   * Obtiene los detalles de una venta
   * @param {number} ventaId - ID de la venta
   * @returns {Promise<Array>} Detalles de la venta
   */
  async getDetalles(ventaId) {
    const sql = `
      SELECT
        dv.*, p.nombre as producto_nombre, p.codigo_barras
      FROM detalle_ventas dv
      INNER JOIN productos p ON dv.producto_id = p.id
      WHERE dv.venta_id = ?
    `;
    return await db.query(sql, [ventaId]);
  }

  /**
   * Obtiene resumen de ventas por día
   * @param {string} fechaInicio - Fecha de inicio
   * @param {string} fechaFin - Fecha de fin
   * @returns {Promise<Array>} Ventas agrupadas por día
   */
  async getDailySales(fechaInicio, fechaFin) {
    const sql = `
      SELECT
        DATE(fecha) as fecha,
        COUNT(*) as total_ventas,
        SUM(total) as total_ingresos,
        AVG(total) as promedio_venta
      FROM ventas
      WHERE estado = 'completada'
        AND DATE(fecha) >= DATE(?)
        AND DATE(fecha) <= DATE(?)
      GROUP BY DATE(fecha)
      ORDER BY fecha DESC
    `;
    return await db.query(sql, [fechaInicio, fechaFin]);
  }

  /**
   * Obtiene estadísticas generales de ventas
   * @param {string} fechaInicio - Fecha de inicio (opcional)
   * @param {string} fechaFin - Fecha de fin (opcional)
   * @returns {Promise<Object>} Estadísticas de ventas
   */
  async getStats(fechaInicio = null, fechaFin = null) {
    let sql = `
      SELECT
        COUNT(*) as total_ventas,
        SUM(total) as total_ingresos,
        AVG(total) as promedio_venta,
        MAX(total) as venta_maxima,
        MIN(total) as venta_minima
      FROM ventas
      WHERE estado = 'completada'
    `;

    const params = [];

    if (fechaInicio) {
      sql += ' AND DATE(fecha) >= DATE(?)';
      params.push(fechaInicio);
    }

    if (fechaFin) {
      sql += ' AND DATE(fecha) <= DATE(?)';
      params.push(fechaFin);
    }

    return await db.queryOne(sql, params);
  }
}

module.exports = new VentaRepository();