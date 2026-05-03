const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Inventario y Ventas PYME',
      version: '1.0.0',
      description: 'API REST para gestión de inventario, ventas y reportes para pequeñas y medianas empresas.',
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Mensaje de error' },
          },
        },
        Usuario: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            nombre: { type: 'string', example: 'Juan Pérez' },
            email: { type: 'string', format: 'email', example: 'juan@ejemplo.com' },
            rol: { type: 'string', enum: ['admin', 'vendedor'], example: 'vendedor' },
            activo: { type: 'boolean', example: true },
          },
        },
        Producto: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            nombre: { type: 'string', example: 'Leche Entera 1L' },
            codigo_barras: { type: 'string', example: '7890000000001' },
            precio_compra: { type: 'number', format: 'float', example: 800 },
            precio_venta: { type: 'number', format: 'float', example: 1200 },
            stock: { type: 'integer', example: 50 },
            stock_minimo: { type: 'integer', example: 10 },
            categoria_id: { type: 'integer', example: 2 },
            activo: { type: 'boolean', example: true },
          },
        },
        Venta: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            usuario_id: { type: 'integer', example: 1 },
            total: { type: 'number', format: 'float', example: 5600 },
            descuento: { type: 'number', format: 'float', example: 0 },
            metodo_pago: { type: 'string', enum: ['efectivo', 'tarjeta', 'transferencia'], example: 'efectivo' },
            estado: { type: 'string', enum: ['completada', 'cancelada'], example: 'completada' },
            fecha: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js'],
};

module.exports = swaggerJsdoc(options);
