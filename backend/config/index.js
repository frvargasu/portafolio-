require('dotenv').config();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET no está definido en las variables de entorno. Añádelo al archivo .env');
}

module.exports = {
  // Configuración del servidor
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  },

  // Configuración de JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },

  // Configuración de MySQL
  // Soporta variables propias (DB_*) y las del plugin MySQL de Railway (MYSQL_*)
  database: {
    host: process.env.DB_HOST || process.env.MYSQL_HOST || process.env.MYSQLHOST || 'localhost',
    port: process.env.DB_PORT || process.env.MYSQL_PORT || process.env.MYSQLPORT || 3306,
    user: process.env.DB_USER || process.env.MYSQL_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD ?? process.env.MYSQL_PASSWORD ?? process.env.MYSQLPASSWORD ?? '',
    database: process.env.DB_NAME || process.env.MYSQL_DATABASE || process.env.MYSQLDATABASE || 'inventory_db',
    ssl: process.env.DB_SSL === 'true'
  },

  // Configuración de paginación por defecto
  pagination: {
    defaultLimit: 10,
    maxLimit: 100
  },

  // Configuración de stock
  stock: {
    lowStockThreshold: 10
  }
};
