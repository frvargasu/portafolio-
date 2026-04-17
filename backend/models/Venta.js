/**
 * Modelo de Venta
 * Define la estructura de las ventas
 */

const ESTADOS = {
  PENDIENTE: 'pendiente',
  COMPLETADA: 'completada',
  CANCELADA: 'cancelada'
};

const ESTADOS_LIST = Object.values(ESTADOS);

const METODOS_PAGO = {
  EFECTIVO: 'efectivo',
  TARJETA: 'tarjeta',
  TRANSFERENCIA: 'transferencia'
};

const METODOS_PAGO_LIST = Object.values(METODOS_PAGO);

/**
 * Campos permitidos para crear una venta
 */
const createFields = ['usuario_id', 'descuento', 'metodo_pago', 'observaciones'];

/**
 * Campos permitidos para actualizar una venta
 */
const updateFields = ['estado', 'observaciones'];

/**
 * Campos que se retornan en las consultas
 */
const publicFields = [
  'id',
  'usuario_id',
  'fecha',
  'subtotal',
  'descuento',
  'impuesto',
  'total',
  'metodo_pago',
  'estado',
  'observaciones',
  'created_at'
];

module.exports = {
  ESTADOS,
  ESTADOS_LIST,
  METODOS_PAGO,
  METODOS_PAGO_LIST,
  createFields,
  updateFields,
  publicFields
};
