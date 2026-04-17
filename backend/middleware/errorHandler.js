/**
 * Middleware de manejo de errores
 * Centraliza el manejo de errores HTTP
 */

/**
 * Clase personalizada para errores de aplicación
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Errores comunes predefinidos
 */
const errors = {
  notFound: (resource = 'Recurso') => new AppError(`${resource} no encontrado`, 404),
  badRequest: (message = 'Solicitud inválida') => new AppError(message, 400),
  unauthorized: (message = 'No autorizado') => new AppError(message, 401),
  forbidden: (message = 'Acceso denegado') => new AppError(message, 403),
  conflict: (message = 'Conflicto con el recurso') => new AppError(message, 409),
  internal: (message = 'Error interno del servidor') => new AppError(message, 500)
};

/**
 * Middleware para manejar rutas no encontradas
 */
const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Ruta ${req.originalUrl} no encontrada`, 404);
  next(error);
};

/**
 * Middleware global de manejo de errores
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // En desarrollo, mostrar más detalles
  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err
    });
  }

  // En producción, ocultar detalles de errores internos
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  // Error no controlado
  console.error('ERROR 💥:', err);
  return res.status(500).json({
    success: false,
    message: 'Algo salió mal. Por favor intente más tarde.'
  });
};

/**
 * Wrapper para manejar errores en funciones async
 * @param {Function} fn - Función async del controlador
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  errors,
  notFoundHandler,
  errorHandler,
  asyncHandler
};
