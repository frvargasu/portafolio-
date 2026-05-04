/**
 * Servicio de Usuarios
 * Lógica de negocio para gestión de usuarios
 */
const bcrypt = require('bcryptjs');
const { usuarioRepository, tokenBlacklistRepository } = require('../repositories');
const { Usuario } = require('../models');
const { AppError } = require('../middleware/errorHandler');

// Duración máxima de un JWT: coincide con config.jwt.expiresIn (24 h por defecto)
const JWT_MAX_MS = 24 * 60 * 60 * 1000;

class UsuarioService {
  /**
   * Obtiene todos los usuarios paginados
   * @param {Object} options - Opciones de paginación
   * @returns {Promise<Object>} Usuarios y metadata de paginación
   */
  async getAll(options = {}) {
    const usuarios = await usuarioRepository.findAll(options);
    const total = await usuarioRepository.count(options.includeInactive);
    
    return {
      data: usuarios.map(u => Usuario.sanitize(u)),
      pagination: {
        page: options.page || 1,
        limit: options.limit || 10,
        total,
        totalPages: Math.ceil(total / (options.limit || 10))
      }
    };
  }

  /**
   * Obtiene un usuario por ID
   * @param {number} id - ID del usuario
   * @returns {Promise<Object>} Usuario encontrado
   */
  async getById(id) {
    const usuario = await usuarioRepository.findById(id);
    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404);
    }
    return Usuario.sanitize(usuario);
  }

  /**
   * Crea un nuevo usuario (para admins)
   * @param {Object} userData - Datos del usuario
   * @returns {Promise<Object>} Usuario creado
   */
  async create(userData) {
    // Verificar si el email ya existe
    const existing = await usuarioRepository.findByEmail(userData.email);
    if (existing) {
      throw new AppError('El email ya está registrado', 409);
    }

    // Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const usuario = await usuarioRepository.create({
      ...userData,
      password: hashedPassword
    });

    return Usuario.sanitize(usuario);
  }

  /**
   * Actualiza un usuario
   * @param {number} id - ID del usuario
   * @param {Object} userData - Datos a actualizar
   * @returns {Promise<Object>} Usuario actualizado
   */
  async update(id, userData) {
    const usuario = await usuarioRepository.findById(id);
    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // Si se intenta cambiar el email, verificar que no exista
    if (userData.email && userData.email !== usuario.email) {
      const existing = await usuarioRepository.findByEmail(userData.email);
      if (existing) {
        throw new AppError('El email ya está en uso', 409);
      }
    }

    // No permitir desactivar o degradar al último administrador activo
    if (usuario.rol === 'admin' && usuario.activo) {
      const isBeingDeactivated = userData.activo === false || userData.activo === 0;
      const isBeingDemoted = userData.rol && userData.rol !== 'admin';
      if (isBeingDeactivated || isBeingDemoted) {
        const adminCount = await usuarioRepository.countAdmins();
        if (adminCount <= 1) {
          throw new AppError('No se puede modificar al único administrador activo', 403);
        }
      }
    }

    const updated = await usuarioRepository.update(id, userData);

    // Si el usuario fue desactivado, invalida sus tokens activos
    const isBeingDeactivatedNow =
      (userData.activo === false || userData.activo === 0) && usuario.activo;
    if (isBeingDeactivatedNow) {
      const expiresAt = new Date(Date.now() + JWT_MAX_MS);
      await tokenBlacklistRepository.add('BLOCKED', id, expiresAt);
    }

    return Usuario.sanitize(updated);
  }

  /**
   * Desactiva un usuario (soft delete)
   * @param {number} id - ID del usuario
   */
  async delete(id) {
    const usuario = await usuarioRepository.findById(id);
    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // No permitir desactivar al último administrador activo
    if (usuario.rol === 'admin' && usuario.activo) {
      const adminCount = await usuarioRepository.countAdmins();
      if (adminCount <= 1) {
        throw new AppError('No se puede desactivar al único administrador activo', 403);
      }
    }

    await usuarioRepository.delete(id);

    // Invalida todos los tokens activos del usuario desactivado
    const expiresAt = new Date(Date.now() + JWT_MAX_MS);
    await tokenBlacklistRepository.add('BLOCKED', id, expiresAt);
  }

  /**
   * Obtiene el perfil del usuario actual
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} Perfil del usuario
   */
  async getProfile(userId) {
    return await this.getById(userId);
  }

  /**
   * Actualiza el perfil del usuario actual
   * @param {number} userId - ID del usuario
   * @param {Object} profileData - Datos del perfil
   * @returns {Promise<Object>} Perfil actualizado
   */
  async updateProfile(userId, profileData) {
    // Solo permitir actualizar nombre
    const allowedFields = { nombre: profileData.nombre };
    return await this.update(userId, allowedFields);
  }
}

module.exports = new UsuarioService();
