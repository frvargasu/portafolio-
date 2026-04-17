/**
 * Servicio de Ventas
 * Lógica de negocio para gestión de ventas
 */
const { ventaRepository, productoRepository } = require('../repositories');
const { AppError } = require('../middleware/errorHandler');

class VentaService {
  /**
   * Obtiene todas las ventas paginadas
   * @param {Object} options - Opciones de filtrado y paginación
   * @returns {Promise<Object>} Ventas y metadata de paginación
   */
  async getAll(options = {}) {
    const ventas = await ventaRepository.findAll(options);
    const total = await ventaRepository.count(options);

    return {
      data: ventas,
      pagination: {
        page: options.page || 1,
        limit: options.limit || 10,
        total,
        totalPages: Math.ceil(total / (options.limit || 10))
      }
    };
  }

  /**
   * Obtiene una venta por ID con sus detalles
   * @param {number} id - ID de la venta
   * @returns {Promise<Object>} Venta con detalles
   */
  async getById(id) {
    const venta = await ventaRepository.findById(id);
    if (!venta) {
      throw new AppError('Venta no encontrada', 404);
    }
    return venta;
  }

  /**
   * Crea una nueva venta.
   * Pre-valida existencia y estado activo de los productos para un fallo rápido
   * antes de abrir una transacción. La validación definitiva de stock ocurre
   * dentro de la transacción en ventaRepository.create() con SELECT ... FOR UPDATE.
   * @param {Object} ventaData - Datos de la venta (metodo_pago, descuento, observaciones)
   * @param {Array} productos - Lista de productos [{producto_id, cantidad}]
   * @param {number} userId - ID del usuario que registra
   * @returns {Promise<Object>} Venta creada
   */
  async create(ventaData, productos, userId) {
    if (!productos || productos.length === 0) {
      throw new AppError('Debe incluir al menos un producto', 400);
    }

    let subtotal = 0;
    const detalles = [];

    // Pre-validación: verificar existencia, estado activo y obtener precio_venta.
    // No valida stock aquí porque puede cambiar antes de que inicie la transacción.
    // La validación definitiva con bloqueo ocurre en ventaRepository.create().
    for (const item of productos) {
      if (!item.producto_id || !item.cantidad || item.cantidad <= 0) {
        throw new AppError('Cada producto debe tener producto_id y cantidad válida', 400);
      }

      const producto = await productoRepository.findById(item.producto_id);

      if (!producto) {
        throw new AppError(`Producto con ID ${item.producto_id} no encontrado`, 404);
      }

      if (!producto.activo) {
        throw new AppError(`El producto "${producto.nombre}" no está disponible`, 400);
      }

      const itemSubtotal = parseFloat((producto.precio_venta * item.cantidad).toFixed(2));
      subtotal += itemSubtotal;

      detalles.push({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: producto.precio_venta,
        subtotal: itemSubtotal
      });
    }

    subtotal = parseFloat(subtotal.toFixed(2));
    const descuento = parseFloat((ventaData.descuento || 0).toFixed(2));
    const impuesto = 0;
    const total = parseFloat((subtotal - descuento + impuesto).toFixed(2));

    if (total < 0) {
      throw new AppError('El descuento no puede ser mayor al subtotal', 400);
    }

    return await ventaRepository.create({
      usuario_id: userId,
      subtotal,
      descuento,
      impuesto,
      total,
      metodo_pago: ventaData.metodo_pago || 'efectivo',
      observaciones: ventaData.observaciones || null
    }, detalles);
  }

  /**
   * Cancela una venta y restaura el stock de los productos.
   * La lógica de restauración ocurre en una transacción con FOR UPDATE
   * en ventaRepository.cancel() para garantizar consistencia.
   * @param {number} id - ID de la venta
   * @param {number} userId - ID del usuario que cancela
   * @param {string} motivo - Motivo de cancelación
   * @returns {Promise<Object>} Venta cancelada
   */
  async cancel(id, userId, motivo = '') {
    return await ventaRepository.cancel(id, motivo || null, userId);
  }

  /**
   * Obtiene las ventas del día actual
   * @returns {Promise<Object>} Resumen de ventas del día
   */
  async getTodaySales() {
    const today = new Date().toISOString().split('T')[0];
    const ventas = await ventaRepository.findAll({
      fecha_inicio: today,
      fecha_fin: today,
      estado: 'completada'
    });

    const stats = await ventaRepository.getStats(today, today);

    return {
      fecha: today,
      ventas,
      resumen: stats
    };
  }

  /**
   * Obtiene el resumen de ventas por día
   * @param {string} fechaInicio - Fecha de inicio
   * @param {string} fechaFin - Fecha de fin
   * @returns {Promise<Array>} Ventas agrupadas por día
   */
  async getDailySalesReport(fechaInicio, fechaFin) {
    return await ventaRepository.getDailySales(fechaInicio, fechaFin);
  }

  /**
   * Obtiene estadísticas de ventas
   * @param {string} fechaInicio - Fecha de inicio
   * @param {string} fechaFin - Fecha de fin
   * @returns {Promise<Object>} Estadísticas de ventas
   */
  async getStats(fechaInicio = null, fechaFin = null) {
    return await ventaRepository.getStats(fechaInicio, fechaFin);
  }
}

module.exports = new VentaService();