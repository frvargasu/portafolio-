/**
 * Índice de Servicios
 * Exporta todos los servicios del sistema
 */
module.exports = {
  authService: require('./authService'),
  usuarioService: require('./usuarioService'),
  categoriaService: require('./categoriaService'),
  productoService: require('./productoService'),
  proveedorService: require('./proveedorService'),
  ventaService: require('./ventaService'),
  reporteService: require('./reporteService')
};
