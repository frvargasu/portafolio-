/**
 * Servicio de Reportes
 * Genera reportes y estadísticas del sistema
 */
const { ventaRepository, productoRepository, movimientoStockRepository } = require('../repositories');
const config = require('../config');

class ReporteService {
  /**
   * Obtiene el resumen de ventas por día
   * @param {string} fechaInicio - Fecha de inicio
   * @param {string} fechaFin - Fecha de fin
   * @returns {Promise<Object>} Reporte de ventas diarias
   */
  async getVentasPorDia(fechaInicio, fechaFin) {
    // Si no se especifican fechas, usar últimos 30 días
    if (!fechaInicio) {
      const date = new Date();
      date.setDate(date.getDate() - 30);
      fechaInicio = date.toISOString().split('T')[0];
    }
    
    if (!fechaFin) {
      fechaFin = new Date().toISOString().split('T')[0];
    }

    const ventasDiarias = await ventaRepository.getDailySales(fechaInicio, fechaFin);
    const estadisticas = await ventaRepository.getStats(fechaInicio, fechaFin);

    return {
      periodo: {
        inicio: fechaInicio,
        fin: fechaFin
      },
      resumen: {
        total_ventas: estadisticas.total_ventas || 0,
        total_ingresos: estadisticas.total_ingresos || 0,
        promedio_venta: estadisticas.promedio_venta || 0,
        venta_maxima: estadisticas.venta_maxima || 0,
        venta_minima: estadisticas.venta_minima || 0
      },
      detalle_diario: ventasDiarias
    };
  }

  /**
   * Obtiene los productos más vendidos
   * @param {Object} options - Opciones de filtrado
   * @returns {Promise<Object>} Reporte de productos más vendidos
   */
  async getProductosMasVendidos({ limit = 10, fecha_inicio = null, fecha_fin = null } = {}) {
    const productos = await productoRepository.findTopSelling(limit, fecha_inicio, fecha_fin);

    // Calcular totales
    const totales = productos.reduce((acc, p) => {
      acc.total_unidades += p.total_vendido || 0;
      acc.total_ingresos += p.total_ingresos || 0;
      return acc;
    }, { total_unidades: 0, total_ingresos: 0 });

    return {
      periodo: {
        inicio: fecha_inicio || 'Todo el historial',
        fin: fecha_fin || 'Actual'
      },
      resumen: totales,
      productos
    };
  }

  /**
   * Obtiene productos con stock bajo
   * @param {number} threshold - Umbral de alerta (opcional)
   * @returns {Promise<Object>} Reporte de productos con bajo stock
   */
  async getProductosBajoStock(threshold = null) {
    const umbral = threshold || config.stock.lowStockThreshold;
    const productos = await productoRepository.findLowStock(umbral);

    // Clasificar por urgencia
    const criticos = productos.filter(p => p.stock === 0);
    const bajos = productos.filter(p => p.stock > 0 && p.stock <= p.stock_minimo / 2);
    const alertas = productos.filter(p => p.stock > p.stock_minimo / 2);

    return {
      umbral_configurado: umbral,
      resumen: {
        total_productos: productos.length,
        sin_stock: criticos.length,
        stock_critico: bajos.length,
        stock_bajo: alertas.length
      },
      productos: {
        sin_stock: criticos,
        criticos: bajos,
        alertas
      }
    };
  }

  /**
   * Obtiene resumen de movimientos de inventario
   * @param {string} fechaInicio - Fecha de inicio
   * @param {string} fechaFin - Fecha de fin
   * @returns {Promise<Object>} Reporte de movimientos
   */
  async getMovimientosStock(fechaInicio = null, fechaFin = null) {
    const resumenPorTipo = await movimientoStockRepository.getSummaryByType(fechaInicio, fechaFin);
    
    // Calcular totales
    let totalEntradas = 0;
    let totalSalidas = 0;

    resumenPorTipo.forEach(item => {
      if (['entrada', 'devolucion'].includes(item.tipo)) {
        totalEntradas += item.total_unidades || 0;
      } else if (['salida', 'venta'].includes(item.tipo)) {
        totalSalidas += item.total_unidades || 0;
      }
    });

    return {
      periodo: {
        inicio: fechaInicio || 'Todo el historial',
        fin: fechaFin || 'Actual'
      },
      resumen: {
        total_entradas: totalEntradas,
        total_salidas: totalSalidas,
        balance: totalEntradas - totalSalidas
      },
      detalle_por_tipo: resumenPorTipo
    };
  }

  /**
   * Genera un dashboard con métricas principales
   * @returns {Promise<Object>} Dashboard con métricas
   */
  async getDashboard() {
    const hoy = new Date().toISOString().split('T')[0];
    
    // Calcular fecha de hace 7 días
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    const fechaInicio7Dias = hace7Dias.toISOString().split('T')[0];

    // Calcular fecha de hace 30 días
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    const fechaInicio30Dias = hace30Dias.toISOString().split('T')[0];

    // Ventas de hoy
    const ventasHoy = await ventaRepository.getStats(hoy, hoy);

    // Ventas últimos 7 días
    const ventasSemana = await ventaRepository.getStats(fechaInicio7Dias, hoy);

    // Ventas últimos 30 días
    const ventasMes = await ventaRepository.getStats(fechaInicio30Dias, hoy);

    // Productos con bajo stock
    const productosLowStock = await productoRepository.findLowStock();

    // Top 5 productos más vendidos (últimos 30 días)
    const topProductos = await productoRepository.findTopSelling(5, fechaInicio30Dias, hoy);

    return {
      fecha_generacion: new Date().toISOString(),
      ventas: {
        hoy: {
          cantidad: ventasHoy.total_ventas || 0,
          total: ventasHoy.total_ingresos || 0
        },
        semana: {
          cantidad: ventasSemana.total_ventas || 0,
          total: ventasSemana.total_ingresos || 0,
          promedio: ventasSemana.promedio_venta || 0
        },
        mes: {
          cantidad: ventasMes.total_ventas || 0,
          total: ventasMes.total_ingresos || 0,
          promedio: ventasMes.promedio_venta || 0
        }
      },
      inventario: {
        productos_bajo_stock: productosLowStock.length,
        productos_sin_stock: productosLowStock.filter(p => p.stock === 0).length,
        alertas: productosLowStock.slice(0, 5)
      },
      top_productos: topProductos
    };
  }
}

module.exports = new ReporteService();
