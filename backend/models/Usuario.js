/**
 * Modelo de Usuario
 * Define la estructura y validaciones del usuario
 */

const ROLES = {
  ADMIN: 'admin',
  VENDEDOR: 'vendedor'
};

const ROLES_LIST = Object.values(ROLES);

/**
 * Campos permitidos para crear un usuario
 */
const createFields = ['nombre', 'email', 'password', 'rol'];

/**
 * Campos permitidos para actualizar un usuario
 */
const updateFields = ['nombre', 'email', 'rol', 'activo'];

/**
 * Campos que se retornan en las consultas (excluye password)
 */
const publicFields = ['id', 'nombre', 'email', 'rol', 'activo', 'created_at', 'updated_at'];

/**
 * Sanitiza los datos del usuario para respuestas
 * @param {Object} user - Usuario de la base de datos
 * @returns {Object} Usuario sin campos sensibles
 */
const sanitize = (user) => {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
};

module.exports = {
  ROLES,
  ROLES_LIST,
  createFields,
  updateFields,
  publicFields,
  sanitize
};
