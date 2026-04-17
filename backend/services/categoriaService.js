/**
 * Servicio de Categorías
 * Lógica de negocio para gestión de categorías
 */
const { categoriaRepository } = require('../repositories');
const { AppError } = require('../middleware/errorHandler');

class CategoriaService {
  /**
   * Obtiene todas las categorías paginadas
   * @param {Object} options - Opciones de paginación
   * @returns {Promise<Object>} Categorías y metadata de paginación
   */
  async getAll(options = {}) {
    const categorias = await categoriaRepository.findAll(options);
    const total = await categoriaRepository.count(options.includeInactive);
    
    return {
      data: categorias,
      pagination: {
        page: options.page || 1,
        limit: options.limit || 10,
        total,
        totalPages: Math.ceil(total / (options.limit || 10))
      }
    };
  }

  /**
   * Obtiene todas las categorías activas sin paginación
   * @returns {Promise<Array>} Lista de categorías
   */
  async getAllActive() {
    return await categoriaRepository.findAllActive();
  }

  /**
   * Obtiene una categoría por ID
   * @param {number} id - ID de la categoría
   * @returns {Promise<Object>} Categoría encontrada
   */
  async getById(id) {
    const categoria = await categoriaRepository.findById(id);
    if (!categoria) {
      throw new AppError('Categoría no encontrada', 404);
    }
    return categoria;
  }

  /**
   * Crea una nueva categoría
   * @param {Object} data - Datos de la categoría
   * @returns {Promise<Object>} Categoría creada
   */
  async create(data) {
    // Verificar si el nombre ya existe
    const existing = await categoriaRepository.findByName(data.nombre);
    if (existing) {
      throw new AppError('Ya existe una categoría con ese nombre', 409);
    }

    return await categoriaRepository.create(data);
  }

  /**
   * Actualiza una categoría
   * @param {number} id - ID de la categoría
   * @param {Object} data - Datos a actualizar
   * @returns {Promise<Object>} Categoría actualizada
   */
  async update(id, data) {
    const categoria = await categoriaRepository.findById(id);
    if (!categoria) {
      throw new AppError('Categoría no encontrada', 404);
    }

    // Si se intenta cambiar el nombre, verificar que no exista
    if (data.nombre && data.nombre !== categoria.nombre) {
      const existing = await categoriaRepository.findByName(data.nombre);
      if (existing) {
        throw new AppError('Ya existe una categoría con ese nombre', 409);
      }
    }

    return await categoriaRepository.update(id, data);
  }

  /**
   * Elimina una categoría (soft delete)
   * @param {number} id - ID de la categoría
   */
  async delete(id) {
    const categoria = await categoriaRepository.findById(id);
    if (!categoria) {
      throw new AppError('Categoría no encontrada', 404);
    }

    // Verificar si tiene productos asociados
    const productCount = await categoriaRepository.countProducts(id);
    if (productCount > 0) {
      throw new AppError(
        `No se puede eliminar la categoría. Tiene ${productCount} producto(s) asociado(s)`, 
        400
      );
    }

    await categoriaRepository.delete(id);
  }
}

module.exports = new CategoriaService();
