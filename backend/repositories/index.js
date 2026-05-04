/**
 * Índice de Repositorios
 * Exporta todos los repositorios del sistema
 */
module.exports = {
  usuarioRepository: require('./usuarioRepository'),
  categoriaRepository: require('./categoriaRepository'),
  productoRepository: require('./productoRepository'),
  proveedorRepository: require('./proveedorRepository'),
  ventaRepository: require('./ventaRepository'),
  movimientoStockRepository: require('./movimientoStockRepository'),
  tokenBlacklistRepository: require('./tokenBlacklistRepository')
};
