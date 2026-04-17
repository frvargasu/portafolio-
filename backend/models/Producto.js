/**
 * Modelo de Producto
 * Define la estructura y validaciones de productos
 */

/**
 * Campos permitidos para crear un producto
 */
const createFields = [
  'codigo_barras',
  'nombre',
  'descripcion',
  'imagen_url',
  'categoria_id',
  'precio_compra',
  'precio_venta',
  'stock',
  'stock_minimo'
];

/**
 * Campos permitidos para actualizar un producto
 */
const updateFields = [
  'codigo_barras',
  'nombre',
  'descripcion',
  'imagen_url',
  'categoria_id',
  'precio_compra',
  'precio_venta',
  'stock',
  'stock_minimo',
  'activo'
];

/**
 * Campos que se retornan en las consultas
 */
const publicFields = [
  'id',
  'codigo_barras',
  'nombre',
  'descripcion',
  'imagen_url',
  'categoria_id',
  'precio_compra',
  'precio_venta',
  'stock',
  'stock_minimo',
  'activo',
  'created_at',
  'updated_at'
];

module.exports = {
  createFields,
  updateFields,
  publicFields
};
