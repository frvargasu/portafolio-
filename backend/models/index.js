/**
 * Índice de modelos
 * Exporta todos los modelos del sistema
 */

module.exports = {
  Usuario: require('./Usuario'),
  Categoria: require('./Categoria'),
  Producto: require('./Producto'),
  Proveedor: require('./Proveedor'),
  Venta: require('./Venta'),
  DetalleVenta: require('./DetalleVenta'),
  MovimientoStock: require('./MovimientoStock')
};
