const { proveedorRepository } = require('../repositories');
const { AppError } = require('../middleware/errorHandler');

class ProveedorService {
  async getAll(options = {}) {
    const proveedores = await proveedorRepository.findAll(options);
    const total = await proveedorRepository.count(options.includeInactive);

    return {
      data: proveedores,
      pagination: {
        page: options.page || 1,
        limit: options.limit || 10,
        total,
        totalPages: Math.ceil(total / (options.limit || 10))
      }
    };
  }

  async getById(id) {
    const proveedor = await proveedorRepository.findById(id);
    if (!proveedor) {
      throw new AppError('Proveedor no encontrado', 404);
    }
    return proveedor;
  }

  async create(data) {
    const existing = await proveedorRepository.findByName(data.nombre);
    if (existing) {
      throw new AppError('Ya existe un proveedor con ese nombre', 409);
    }
    return await proveedorRepository.create(data);
  }

  async update(id, data) {
    const proveedor = await proveedorRepository.findById(id);
    if (!proveedor) {
      throw new AppError('Proveedor no encontrado', 404);
    }

    if (data.nombre && data.nombre !== proveedor.nombre) {
      const existing = await proveedorRepository.findByName(data.nombre);
      if (existing) {
        throw new AppError('Ya existe un proveedor con ese nombre', 409);
      }
    }

    return await proveedorRepository.update(id, data);
  }

  async delete(id) {
    const proveedor = await proveedorRepository.findById(id);
    if (!proveedor) {
      throw new AppError('Proveedor no encontrado', 404);
    }
    await proveedorRepository.delete(id);
  }
}

module.exports = new ProveedorService();
