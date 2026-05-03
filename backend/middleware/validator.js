/**
 * Middleware de validación
 * Utiliza express-validator para validar datos de entrada
 */
const { body, param, query, validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');

/**
 * Procesa los errores de validación
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));

    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: errorMessages
    });
  }
  
  next();
};

/**
 * Reglas de validación para usuarios
 */
const userValidation = {
  register: [
    body('nombre')
      .trim()
      .notEmpty().withMessage('El nombre es obligatorio')
      .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    body('email')
      .trim()
      .notEmpty().withMessage('El email es obligatorio')
      .isEmail().withMessage('Formato de email inválido')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('La contraseña es obligatoria')
      .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    validate
  ],
  forgotPassword: [
    body('email')
      .trim()
      .notEmpty().withMessage('El email es obligatorio')
      .isEmail().withMessage('Formato de email inválido')
      .normalizeEmail(),
    validate
  ],
  resetPassword: [
    body('password')
      .notEmpty().withMessage('La contraseña es obligatoria')
      .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    validate
  ],
  login: [
    body('email')
      .trim()
      .notEmpty().withMessage('El email es obligatorio')
      .isEmail().withMessage('Formato de email inválido'),
    body('password')
      .notEmpty().withMessage('La contraseña es obligatoria'),
    validate
  ],
  update: [
    param('id').isInt().withMessage('ID inválido'),
    body('nombre')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    body('email')
      .optional()
      .trim()
      .isEmail().withMessage('Formato de email inválido'),
    body('rol')
      .optional()
      .isIn(['admin', 'vendedor']).withMessage('Rol inválido'),
    body('activo')
      .optional()
      .isBoolean().withMessage('El campo activo debe ser booleano'),
    validate
  ]
};

/**
 * Reglas de validación para categorías
 */
const categoryValidation = {
  create: [
    body('nombre')
      .trim()
      .notEmpty().withMessage('El nombre es obligatorio')
      .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    body('descripcion')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres'),
    validate
  ],
  update: [
    param('id').isInt().withMessage('ID inválido'),
    body('nombre')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    body('descripcion')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres'),
    body('activo')
      .optional()
      .isBoolean().withMessage('El campo activo debe ser booleano'),
    validate
  ]
};

/**
 * Reglas de validación para productos
 */
const productValidation = {
  create: [
    body('nombre')
      .trim()
      .notEmpty().withMessage('El nombre es obligatorio')
      .isLength({ min: 2, max: 200 }).withMessage('El nombre debe tener entre 2 y 200 caracteres'),
    body('codigo_barras')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('El código de barras no puede exceder 50 caracteres'),
    body('descripcion')
      .optional()
      .trim(),
    body('categoria_id')
      .optional({ nullable: true })
      .isInt({ min: 1 }).withMessage('ID de categoría inválido'),
    body('precio_compra')
      .optional({ nullable: true })
      .isFloat({ min: 0 }).withMessage('El precio de compra debe ser un número positivo'),
    body('precio_venta')
      .notEmpty().withMessage('El precio de venta es obligatorio')
      .isFloat({ min: 0 }).withMessage('El precio de venta debe ser un número positivo'),
    body('stock')
      .optional({ nullable: true })
      .isInt({ min: 0 }).withMessage('El stock debe ser un número entero positivo'),
    body('stock_minimo')
      .optional({ nullable: true })
      .isInt({ min: 0 }).withMessage('El stock mínimo debe ser un número entero positivo'),
    validate
  ],
  update: [
    param('id').isInt().withMessage('ID inválido'),
    body('nombre')
      .optional()
      .trim()
      .isLength({ min: 2, max: 200 }).withMessage('El nombre debe tener entre 2 y 200 caracteres'),
    body('codigo_barras')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('El código de barras no puede exceder 50 caracteres'),
    body('categoria_id')
      .optional({ nullable: true })
      .isInt({ min: 1 }).withMessage('ID de categoría inválido'),
    body('precio_compra')
      .optional({ nullable: true })
      .isFloat({ min: 0 }).withMessage('El precio de compra debe ser un número positivo'),
    body('precio_venta')
      .optional({ nullable: true })
      .isFloat({ min: 0 }).withMessage('El precio de venta debe ser un número positivo'),
    body('stock_minimo')
      .optional()
      .isInt({ min: 0 }).withMessage('El stock mínimo debe ser un número entero positivo'),
    body('activo')
      .optional()
      .isBoolean().withMessage('El campo activo debe ser booleano'),
    validate
  ],
  updateStock: [
    param('id').isInt().withMessage('ID inválido'),
    body('cantidad')
      .notEmpty().withMessage('La cantidad es obligatoria')
      .isInt().withMessage('La cantidad debe ser un número entero'),
    body('tipo')
      .notEmpty().withMessage('El tipo de movimiento es obligatorio')
      .isIn(['entrada', 'salida', 'ajuste']).withMessage('Tipo inválido. Use: entrada, salida o ajuste'),
    body('motivo')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('El motivo no puede exceder 500 caracteres'),
    validate
  ]
};

/**
 * Reglas de validación para ventas
 */
const saleValidation = {
  create: [
    body('productos')
      .isArray({ min: 1 }).withMessage('Debe incluir al menos un producto'),
    body('productos.*.producto_id')
      .isInt({ min: 1 }).withMessage('ID de producto inválido'),
    body('productos.*.cantidad')
      .isInt({ min: 1 }).withMessage('La cantidad debe ser al menos 1'),
    body('descuento')
      .optional()
      .isFloat({ min: 0 }).withMessage('El descuento debe ser un número positivo'),
    body('metodo_pago')
      .optional()
      .isIn(['efectivo', 'tarjeta', 'transferencia']).withMessage('Método de pago inválido'),
    body('observaciones')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Las observaciones no pueden exceder 500 caracteres'),
    validate
  ],
  updateStatus: [
    param('id').isInt().withMessage('ID inválido'),
    body('estado')
      .notEmpty().withMessage('El estado es obligatorio')
      .isIn(['pendiente', 'completada', 'cancelada']).withMessage('Estado inválido'),
    validate
  ]
};

/**
 * Reglas de validación para proveedores
 */
const proveedorValidation = {
  create: [
    body('nombre')
      .trim()
      .notEmpty().withMessage('El nombre es obligatorio')
      .isLength({ min: 2, max: 150 }).withMessage('El nombre debe tener entre 2 y 150 caracteres'),
    body('contacto')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('El contacto no puede exceder 100 caracteres'),
    body('email')
      .optional()
      .trim()
      .isEmail().withMessage('Formato de email inválido')
      .normalizeEmail(),
    body('telefono')
      .optional()
      .trim()
      .isLength({ max: 30 }).withMessage('El teléfono no puede exceder 30 caracteres'),
    body('direccion')
      .optional()
      .trim()
      .isLength({ max: 255 }).withMessage('La dirección no puede exceder 255 caracteres'),
    body('notas')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Las notas no pueden exceder 1000 caracteres'),
    validate
  ],
  update: [
    param('id').isInt().withMessage('ID inválido'),
    body('nombre')
      .optional()
      .trim()
      .isLength({ min: 2, max: 150 }).withMessage('El nombre debe tener entre 2 y 150 caracteres'),
    body('contacto')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('El contacto no puede exceder 100 caracteres'),
    body('email')
      .optional()
      .trim()
      .isEmail().withMessage('Formato de email inválido')
      .normalizeEmail(),
    body('telefono')
      .optional()
      .trim()
      .isLength({ max: 30 }).withMessage('El teléfono no puede exceder 30 caracteres'),
    body('direccion')
      .optional()
      .trim()
      .isLength({ max: 255 }).withMessage('La dirección no puede exceder 255 caracteres'),
    body('notas')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Las notas no pueden exceder 1000 caracteres'),
    body('activo')
      .optional()
      .isBoolean().withMessage('El campo activo debe ser booleano'),
    validate
  ]
};

/**
 * Validación de parámetros comunes
 */
const commonValidation = {
  id: [
    param('id').isInt({ min: 1 }).withMessage('ID inválido'),
    validate
  ],
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Número de página inválido'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('Límite inválido (1-100)'),
    validate
  ]
};

module.exports = {
  validate,
  userValidation,
  categoryValidation,
  productValidation,
  saleValidation,
  proveedorValidation,
  commonValidation
};
