/**
 * Middleware de Autenticación JWT
 * Verifica tokens y protege rutas
 */
const jwt = require('jsonwebtoken');
const config = require('../config');
const { Usuario } = require('../models');
const { usuarioRepository, tokenBlacklistRepository } = require('../repositories');

/**
 * Verifica que el usuario esté autenticado y que su token no esté revocado.
 * Combina verificación JWT + consulta a token_blacklist en un solo paso.
 */
const authenticate = async (req, res, next) => {
  try {
    // Obtener el token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticación no proporcionado'
      });
    }

    // Verificar formato "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: 'Formato de token inválido. Use: Bearer <token>'
      });
    }

    const token = parts[1];

    // Verificar y decodificar el token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Verificar que el token (o el usuario) no esté en la blacklist
    const blacklisted = await tokenBlacklistRepository.isBlacklisted(token, decoded.id);
    if (blacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Sesión invalidada. Por favor inicie sesión nuevamente'
      });
    }

    // Agregar información del usuario al request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      rol: decoded.rol
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado. Por favor inicie sesión nuevamente'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error al verificar autenticación'
    });
  }
};

/**
 * Verifica que el usuario tenga rol de administrador
 */
const isAdmin = (req, res, next) => {
  if (req.user.rol !== Usuario.ROLES.ADMIN) {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requiere rol de administrador'
    });
  }
  next();
};

/**
 * Verifica que el usuario tenga uno de los roles especificados
 * @param {Array} roles - Array de roles permitidos
 */
const hasRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado. Roles permitidos: ${roles.join(', ')}`
      });
    }
    next();
  };
};

/**
 * Middleware opcional de autenticación
 * No falla si no hay token, pero si hay, lo verifica
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return next();
  }

  // Si hay header, intentar autenticar
  authenticate(req, res, next);
};

module.exports = {
  authenticate,
  isAdmin,
  hasRole,
  optionalAuth,

  /**
   * Rechaza requests cuyo token (o usuario) está en la blacklist.
   * Debe colocarse DESPUÉS de `authenticate` en la cadena de middlewares.
   */
  checkTokenBlacklist: async (req, res, next) => {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const blacklisted = await tokenBlacklistRepository.isBlacklisted(token, req.user.id);
      if (blacklisted) {
        return res.status(401).json({
          success: false,
          message: 'Sesión invalidada. Por favor inicie sesión nuevamente'
        });
      }
      next();
    } catch {
      next();
    }
  },

  /**
   * Bloquea el endpoint POST /register una vez que ya existe
   * al menos un administrador activo en el sistema.
   * Aplica sólo a ese endpoint; los usuarios posteriores los
   * crea el administrador desde el panel.
   */
  checkRegistroHabilitado: async (req, res, next) => {
    try {
      const adminCount = await usuarioRepository.countAdmins();
      if (adminCount > 0) {
        return res.status(403).json({
          success: false,
          message: 'El registro público está deshabilitado'
        });
      }
      next();
    } catch {
      return res.status(503).json({
        success: false,
        message: 'Servicio no disponible, intente más tarde'
      });
    }
  }
};
