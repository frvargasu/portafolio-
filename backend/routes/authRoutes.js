/**
 * Rutas de Autenticación
 * Endpoints: /api/auth
 */
const express = require('express');
const router = express.Router();
const { authController } = require('../controllers');
const { authenticate, userValidation, authLimiter, createAccountLimiter } = require('../middleware');

/**
 * @route   POST /api/auth/register
 * @desc    Registrar un nuevo usuario
 * @access  Public
 * @rateLimit 3 requests per hour per IP
 */
router.post('/register', createAccountLimiter, userValidation.register, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión
 * @access  Public
 * @rateLimit 5 requests per 15 minutes per IP
 */
router.post('/login', authLimiter, userValidation.login, authController.login);

/**
 * @route   GET /api/auth/profile
 * @desc    Obtener perfil del usuario autenticado
 * @access  Private
 */
router.get('/profile', authenticate, authController.getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Actualizar perfil del usuario autenticado
 * @access  Private
 */
router.put('/profile', authenticate, authController.updateProfile);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Cambiar contraseña
 * @access  Private
 */
router.put('/change-password', authenticate, authController.changePassword);

module.exports = router;
