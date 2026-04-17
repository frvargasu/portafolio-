/**
 * Modelo de Categoría
 * Define la estructura de las categorías de productos
 */

/**
 * Campos permitidos para crear una categoría
 */
const createFields = ['nombre', 'descripcion'];

/**
 * Campos permitidos para actualizar una categoría
 */
const updateFields = ['nombre', 'descripcion', 'activo'];

/**
 * Campos que se retornan en las consultas
 */
const publicFields = ['id', 'nombre', 'descripcion', 'activo', 'created_at', 'updated_at'];

module.exports = {
  createFields,
  updateFields,
  publicFields
};
