/**
 * Modelo de Detalle de Venta
 * Define la estructura de los items de una venta
 */

/**
 * Campos permitidos para crear un detalle
 */
const createFields = ['producto_id', 'cantidad'];

/**
 * Campos que se retornan en las consultas
 */
const publicFields = [
  'id',
  'venta_id',
  'producto_id',
  'cantidad',
  'precio_unitario',
  'subtotal',
  'created_at'
];

module.exports = {
  createFields,
  publicFields
};
