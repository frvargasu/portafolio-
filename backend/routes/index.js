/**
 * Índice de Rutas
 * Configura todas las rutas de la API
 */
const express = require('express');
const router = express.Router();

// Importar rutas
const authRoutes = require('./authRoutes');
const usuarioRoutes = require('./usuarioRoutes');
const categoriaRoutes = require('./categoriaRoutes');
const productoRoutes = require('./productoRoutes');
const proveedorRoutes = require('./proveedorRoutes');
const ventaRoutes = require('./ventaRoutes');
const reporteRoutes = require('./reporteRoutes');

// Configurar rutas
router.use('/auth', authRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/categorias', categoriaRoutes);
router.use('/productos', productoRoutes);
router.use('/proveedores', proveedorRoutes);
router.use('/ventas', ventaRoutes);
router.use('/reportes', reporteRoutes);

// Ruta de estado de la API
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API de Inventario y Ventas PYME',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      usuarios: '/api/v1/usuarios',
      categorias: '/api/v1/categorias',
      productos: '/api/v1/productos',
      proveedores: '/api/v1/proveedores',
      ventas: '/api/v1/ventas',
      reportes: '/api/v1/reportes'
    }
  });
});

module.exports = router;
