/**
 * Servicio de Productos
 * Lógica de negocio para gestión de productos e inventario
 */
const { productoRepository, movimientoStockRepository, categoriaRepository } = require('../repositories');
const { MovimientoStock } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const db = require('../database');

class ProductoService {
  /**
   * Obtiene todos los productos paginados
   * @param {Object} options - Opciones de filtrado y paginación
   * @returns {Promise<Object>} Productos y metadata de paginación
   */
  async getAll(options = {}) {
    const productos = await productoRepository.findAll(options);
    const total = await productoRepository.count(options);
    
    return {
      data: productos,
      pagination: {
        page: options.page || 1,
        limit: options.limit || 10,
        total,
        totalPages: Math.ceil(total / (options.limit || 10))
      }
    };
  }

  /**
   * Obtiene un producto por ID
   * @param {number} id - ID del producto
   * @returns {Promise<Object>} Producto encontrado
   */
  async getById(id) {
    const producto = await productoRepository.findById(id);
    if (!producto) {
      throw new AppError('Producto no encontrado', 404);
    }
    return producto;
  }

  /**
   * Busca un producto por código de barras
   * @param {string} codigoBarras - Código de barras
   * @returns {Promise<Object>} Producto encontrado
   */
  async getByBarcode(codigoBarras) {
    const producto = await productoRepository.findByBarcode(codigoBarras);
    if (!producto) {
      throw new AppError('Producto no encontrado', 404);
    }
    return producto;
  }

  /**
   * Crea un nuevo producto
   * @param {Object} data - Datos del producto
   * @param {number} userId - ID del usuario que crea
   * @returns {Promise<Object>} Producto creado
   */
  async create(data, userId) {
    // Verificar código de barras único si se proporciona
    if (data.codigo_barras) {
      const existing = await productoRepository.findByBarcode(data.codigo_barras);
      if (existing) {
        throw new AppError('Ya existe un producto con ese código de barras', 409);
      }
    }

    // Verificar que la categoría existe si se proporciona
    if (data.categoria_id) {
      const categoria = await categoriaRepository.findById(data.categoria_id);
      if (!categoria) {
        throw new AppError('Categoría no encontrada', 404);
      }
    }

    // Crear producto (el trigger de MySQL registrará el movimiento de stock inicial)
    const producto = await productoRepository.create(data);
    return producto;
  }

  /**
   * Actualiza un producto
   * @param {number} id - ID del producto
   * @param {Object} data - Datos a actualizar
   * @returns {Promise<Object>} Producto actualizado
   */
  async update(id, data) {
    const producto = await productoRepository.findById(id);
    if (!producto) {
      throw new AppError('Producto no encontrado', 404);
    }

    // Verificar código de barras único si se cambia
    if (data.codigo_barras && data.codigo_barras !== producto.codigo_barras) {
      const existing = await productoRepository.findByBarcode(data.codigo_barras);
      if (existing) {
        throw new AppError('Ya existe un producto con ese código de barras', 409);
      }
    }

    // Verificar categoría si se cambia
    if (data.categoria_id && data.categoria_id !== producto.categoria_id) {
      const categoria = await categoriaRepository.findById(data.categoria_id);
      if (!categoria) {
        throw new AppError('Categoría no encontrada', 404);
      }
    }

    return await productoRepository.update(id, data);
  }

  /**
   * Actualiza el stock de un producto
   * @param {number} id - ID del producto
   * @param {Object} data - Datos del movimiento (tipo, cantidad, motivo)
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} Producto actualizado con movimiento
   */
  async updateStock(id, { tipo, cantidad, motivo }, userId) {
    const producto = await productoRepository.findById(id);
    if (!producto) {
      throw new AppError('Producto no encontrado', 404);
    }

    let nuevoStock;
    
    switch (tipo) {
      case MovimientoStock.TIPOS.ENTRADA:
        nuevoStock = producto.stock + cantidad;
        break;
      case MovimientoStock.TIPOS.SALIDA:
        nuevoStock = producto.stock - cantidad;
        if (nuevoStock < 0) {
          throw new AppError('Stock insuficiente para realizar la salida', 400);
        }
        break;
      case MovimientoStock.TIPOS.AJUSTE:
        nuevoStock = cantidad; // En ajuste, la cantidad es el nuevo stock
        break;
      default:
        throw new AppError('Tipo de movimiento inválido', 400);
    }

    // Actualizar stock (el trigger de MySQL registrará el movimiento)
    await productoRepository.updateStock(id, nuevoStock);

    const productoActualizado = await productoRepository.findById(id);
    
    return {
      producto: productoActualizado
    };
  }

  /**
   * Elimina un producto (soft delete)
   * @param {number} id - ID del producto
   */
  async delete(id) {
    const producto = await productoRepository.findById(id);
    if (!producto) {
      throw new AppError('Producto no encontrado', 404);
    }

    await productoRepository.delete(id);
  }

  /**
   * Obtiene productos con bajo stock
   * @param {number} threshold - Umbral opcional
   * @returns {Promise<Array>} Productos con bajo stock
   */
  async getLowStock(threshold = null) {
    return await productoRepository.findLowStock(threshold);
  }

  /**
   * Obtiene los productos más vendidos
   * @param {Object} options - Opciones de filtrado
   * @returns {Promise<Array>} Productos más vendidos
   */
  async getTopSelling({ limit = 10, fecha_inicio = null, fecha_fin = null } = {}) {
    return await productoRepository.findTopSelling(limit, fecha_inicio, fecha_fin);
  }

  /**
   * Obtiene el historial de movimientos de un producto
   * @param {number} productoId - ID del producto
   * @param {number} limit - Cantidad de registros
   * @returns {Promise<Array>} Historial de movimientos
   */
  async getStockHistory(productoId, limit = 20) {
    const producto = await productoRepository.findById(productoId);
    if (!producto) {
      throw new AppError('Producto no encontrado', 404);
    }

    return await movimientoStockRepository.findByProducto(productoId, limit);
  }
}

module.exports = new ProductoService();
