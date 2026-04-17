/**
 * Servicio de Autenticación
 * Maneja registro, login y generación de tokens JWT
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { usuarioRepository } = require('../repositories');
const { Usuario } = require('../models');
const { AppError } = require('../middleware/errorHandler');

class AuthService {
  /**
   * Registra un nuevo usuario
   * @param {Object} userData - Datos del usuario
   * @returns {Promise<Object>} Usuario creado y token
   */
  async register({ nombre, email, password, rol = 'vendedor' }) {
    // Verificar si el email ya existe
    const existingUser = await usuarioRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError('El email ya está registrado', 409);
    }

    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear el usuario
    const user = await usuarioRepository.create({
      nombre,
      email,
      password: hashedPassword,
      rol
    });

    // Generar token
    const token = this.generateToken(user);

    return {
      user: Usuario.sanitize(user),
      token
    };
  }

  /**
   * Inicia sesión de un usuario
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise<Object>} Usuario y token
   */
  async login(email, password) {
    // Buscar usuario por email
    const user = await usuarioRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Credenciales inválidas', 401);
    }

    // Verificar si el usuario está activo
    if (!user.activo) {
      throw new AppError('Usuario desactivado. Contacte al administrador', 401);
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new AppError('Credenciales inválidas', 401);
    }

    // Generar token
    const token = this.generateToken(user);

    return {
      user: Usuario.sanitize(user),
      token
    };
  }

  /**
   * Genera un token JWT
   * @param {Object} user - Usuario
   * @returns {string} Token JWT
   */
  generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      rol: user.rol
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });
  }

  /**
   * Verifica un token JWT
   * @param {string} token - Token a verificar
   * @returns {Object} Payload decodificado
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      throw new AppError('Token inválido o expirado', 401);
    }
  }

  /**
   * Cambia la contraseña de un usuario
   * @param {number} userId - ID del usuario
   * @param {string} currentPassword - Contraseña actual
   * @param {string} newPassword - Nueva contraseña
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await usuarioRepository.findById(userId);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // Verificar contraseña actual
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      throw new AppError('Contraseña actual incorrecta', 401);
    }

    // Hashear nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Actualizar contraseña
    await usuarioRepository.updatePassword(userId, hashedPassword);
  }
}

module.exports = new AuthService();
