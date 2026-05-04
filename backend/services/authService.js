/**
 * Servicio de Autenticación
 * Maneja registro, login y generación de tokens JWT
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');
const { usuarioRepository, tokenBlacklistRepository } = require('../repositories');
const { Usuario } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { sendPasswordResetEmail } = require('./emailService');

class AuthService {
  /**
   * Registra un nuevo usuario
   * @param {Object} userData - Datos del usuario
   * @returns {Promise<Object>} Usuario creado y token
   */
  async register({ nombre, email, password }) {
    // Verificar si el email ya existe
    const existingUser = await usuarioRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError('El email ya está registrado', 409);
    }

    // Solo se permite registro público si aún no existe ningún administrador activo.
    // Después del primer admin, los usuarios se crean desde el panel de administración.
    const adminCount = await usuarioRepository.countAdmins();
    if (adminCount > 0) {
      throw new AppError('El registro público está cerrado. Contacte al administrador para crear su cuenta', 403);
    }
    const rol = 'admin';

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

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      throw new AppError('Contraseña actual incorrecta', 401);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await usuarioRepository.updatePassword(userId, hashedPassword);
  }

  async forgotPassword(email) {
    const user = await usuarioRepository.findByEmail(email);
    // Respuesta genérica siempre para no revelar si el email existe
    if (!user || !user.activo) return;

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await usuarioRepository.saveResetToken(user.id, token, expires);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const resetUrl = `${frontendUrl}/auth/reset-password/${token}`;

    await sendPasswordResetEmail(user.email, resetUrl);
  }

  /**
   * Invalida el token actual insertándolo en la blacklist.
   * El repositorio almacena el hash SHA-256, no el JWT en crudo.
   * @param {string} token  - JWT extraído del header Authorization
   * @param {number} userId - ID del usuario autenticado
   */
  async logout(token, userId) {
    const decoded = jwt.decode(token);
    const expiresAt = decoded?.exp
      ? new Date(decoded.exp * 1000)
      : new Date(Date.now() + 24 * 60 * 60 * 1000);
    await tokenBlacklistRepository.add(token, userId, expiresAt);
  }

  async resetPassword(token, newPassword) {
    const user = await usuarioRepository.findByResetToken(token);
    if (!user) {
      throw new AppError('El enlace de recuperación es inválido o ha expirado', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await usuarioRepository.updatePassword(user.id, hashedPassword);
    await usuarioRepository.clearResetToken(user.id);
  }
}

module.exports = new AuthService();
