/**
 * =====================================================
 * API REST - Sistema de Inventario y Ventas PYME
 * =====================================================
 * 
 * Punto de entrada principal de la aplicación
 * 
 * @author Tu Nombre
 * @version 1.0.0
 */

// Cargar variables de entorno
require('dotenv').config();

// Dependencias
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const config = require('./config');
const routes = require('./routes');
const { notFoundHandler, errorHandler, generalLimiter } = require('./middleware');
const db = require('./database');

// Crear aplicación Express
const app = express();

// =====================================================
// MIDDLEWARES GLOBALES
// =====================================================

// Cabeceras de seguridad HTTP
app.use(helmet());

// En producción debe definirse CORS_ORIGIN con el dominio real del frontend
app.use(cors({
  origin: true, // Permitir cualquier origen en desarrollo
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Rate limiting general para todas las rutas API
app.use('/api/v1', generalLimiter);

// Parsear JSON en el body de las peticiones
app.use(express.json());

// Parsear datos de formularios
app.use(express.urlencoded({ extended: true }));

// Logger HTTP
app.use(morgan(config.server.env === 'production' ? 'combined' : 'dev'));

// =====================================================
// RUTAS
// =====================================================

// Documentación interactiva de la API
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Ruta de health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: config.server.env
  });
});

// Rutas de la API
app.use('/api/v1', routes);

// =====================================================
// MANEJO DE ERRORES
// =====================================================

// Manejar rutas no encontradas
app.use(notFoundHandler);

// Manejar errores globales
app.use(errorHandler);

// =====================================================
// INICIAR SERVIDOR
// =====================================================

const PORT = config.server.port;

// Iniciar servidor con base de datos asíncrona
async function startServer() {
  try {
    // Inicializar base de datos
    await db.initDatabase();
    
    app.listen(PORT, () => {
      console.log('\n=====================================================');
      console.log('   API REST - Sistema de Inventario y Ventas PYME');
      console.log('=====================================================');
      console.log(`🚀 Servidor iniciado en: http://localhost:${PORT}`);
      console.log(`📍 API disponible en: http://localhost:${PORT}/api`);
      console.log(`🔧 Ambiente: ${config.server.env}`);
      console.log('=====================================================\n');
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error.message);
    console.log('\n💡 Ejecuta "npm run init-db" para inicializar la base de datos');
    process.exit(1);
  }
}

startServer();

// Manejar cierre graceful
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando servidor...');
  db.closeConnection();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Cerrando servidor...');
  db.closeConnection();
  process.exit(0);
});

module.exports = app;
