/**
 * Middleware de Rate Limiting
 * Protege contra ataques de fuerza bruta y DDoS
 */
const rateLimit = require('express-rate-limit');

/**
 * Rate limiter general para todas las rutas API
 * Permite 100 requests por IP cada 15 minutos
 */
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Demasiadas solicitudes desde esta IP. Intente nuevamente en 15 minutos.',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  }
});

/**
 * Rate limiter estricto para rutas de autenticación
 * Previene ataques de fuerza bruta en login/register
 * Permite solo 5 intentos por IP cada 15 minutos
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5,
  message: {
    success: false,
    message: 'Demasiados intentos de autenticación. Intente nuevamente en 15 minutos.',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Contar todos los requests, exitosos o no
  handler: (req, res, next, options) => {
    console.warn(`[RATE LIMIT] Auth bloqueado para IP: ${req.ip}`);
    res.status(429).json(options.message);
  }
});

/**
 * Rate limiter para creación de cuentas
 * Permite solo 3 registros por IP cada hora
 */
const createAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3,
  message: {
    success: false,
    message: 'Demasiados intentos de registro. Intente nuevamente en 1 hora.',
    retryAfter: '1 hora'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    console.warn(`[RATE LIMIT] Registro bloqueado para IP: ${req.ip}`);
    res.status(429).json(options.message);
  }
});

module.exports = {
  generalLimiter,
  authLimiter,
  createAccountLimiter
};
