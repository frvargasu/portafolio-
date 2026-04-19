/**
 * Índice de Middlewares
 * Exporta todos los middlewares del sistema
 */
const auth = require('./auth');
const errorHandler = require('./errorHandler');
const validator = require('./validator');
const rateLimiter = require('./rateLimiter');

module.exports = {
  ...auth,
  ...errorHandler,
  ...validator,
  ...rateLimiter
};
