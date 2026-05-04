/**
 * Conexión a la base de datos MySQL
 * Utiliza mysql2 con soporte para Promises
 */
const mysql = require('mysql2/promise');
const config = require('../config');

let pool = null;

/**
 * Inicializa el pool de conexiones MySQL
 */
const initDatabase = async () => {
  if (pool) return pool;

  try {
    pool = mysql.createPool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ...(config.database.ssl && { ssl: { rejectUnauthorized: false } })
    });

    // Verificar conexión
    const connection = await pool.getConnection();
    console.log('✅ Conectado a MySQL');
    connection.release();

    return pool;
  } catch (error) {
    console.error('❌ Error al conectar con MySQL:', error.message);
    throw error;
  }
};

/**
 * Obtiene el pool de conexiones
 */
const getConnection = () => {
  if (!pool) {
    throw new Error('Base de datos no inicializada. Ejecuta initDatabase() primero.');
  }
  return pool;
};

/**
 * Cierra el pool de conexiones
 */
const closeConnection = async () => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('🔌 Conexión a MySQL cerrada');
  }
};

/**
 * Ejecuta una consulta SELECT y retorna múltiples filas
 * @param {string} sql - Consulta SQL
 * @param {Array} params - Parámetros de la consulta
 * @returns {Promise<Array>} Resultados de la consulta
 */
const query = async (sql, params = []) => {
  const connection = getConnection();
  const [rows] = await connection.query(sql, params);
  return rows;
};

/**
 * Ejecuta una consulta SELECT y retorna una sola fila
 * @param {string} sql - Consulta SQL
 * @param {Array} params - Parámetros de la consulta
 * @returns {Promise<Object|null>} Resultado de la consulta
 */
const queryOne = async (sql, params = []) => {
  const results = await query(sql, params);
  return results[0] || null;
};

/**
 * Ejecuta una consulta INSERT, UPDATE o DELETE
 * @param {string} sql - Consulta SQL
 * @param {Array} params - Parámetros de la consulta
 * @returns {Promise<Object>} Información sobre la ejecución
 */
const run = async (sql, params = []) => {
  const connection = getConnection();
  const [result] = await connection.query(sql, params);
  return {
    changes: result.affectedRows,
    lastInsertRowid: result.insertId
  };
};

/**
 * Ejecuta múltiples operaciones en una transacción
 * @param {Function} callback - Función async que contiene las operaciones
 * @returns {Promise<*>} Resultado del callback
 */
const transaction = async (callback) => {
  const connection = await getConnection().getConnection();
  
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    connection.release();
    return result;
  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
  }
};

/**
 * Ejecuta una consulta usando una conexión específica (para transacciones)
 * @param {Object} connection - Conexión MySQL
 * @param {string} sql - Consulta SQL
 * @param {Array} params - Parámetros de la consulta
 * @returns {Promise<Array>} Resultados de la consulta
 */
const queryWithConnection = async (connection, sql, params = []) => {
  const [rows] = await connection.query(sql, params);
  return rows;
};

/**
 * Ejecuta INSERT/UPDATE/DELETE usando una conexión específica
 * @param {Object} connection - Conexión MySQL
 * @param {string} sql - Consulta SQL
 * @param {Array} params - Parámetros de la consulta
 * @returns {Promise<Object>} Información sobre la ejecución
 */
const runWithConnection = async (connection, sql, params = []) => {
  const [result] = await connection.query(sql, params);
  return {
    changes: result.affectedRows,
    lastInsertRowid: result.insertId
  };
};

module.exports = {
  initDatabase,
  getConnection,
  closeConnection,
  query,
  queryOne,
  run,
  transaction,
  queryWithConnection,
  runWithConnection
};
