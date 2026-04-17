/**
 * Modelo de Movimiento de Stock
 * Define la estructura del historial de inventario
 */

const TIPOS = {
  ENTRADA: 'entrada',
  SALIDA: 'salida',
  AJUSTE: 'ajuste',
  VENTA: 'venta',
  DEVOLUCION: 'devolucion'
};

const TIPOS_LIST = Object.values(TIPOS);

/**
 * Campos permitidos para crear un movimiento
 */
const createFields = [
  'producto_id',
  'tipo',
  'cantidad',
  'motivo',
  'referencia_id',
  'referencia_tipo',
  'usuario_id'
];

/**
 * Campos que se retornan en las consultas
 */
const publicFields = [
  'id',
  'producto_id',
  'tipo',
  'cantidad',
  'stock_anterior',
  'stock_nuevo',
  'motivo',
  'referencia_id',
  'referencia_tipo',
  'usuario_id',
  'created_at'
];

module.exports = {
  TIPOS,
  TIPOS_LIST,
  createFields,
  publicFields
};
