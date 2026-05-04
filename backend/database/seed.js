/**
 * Aplica el schema SQL a la base de datos existente.
 * Ejecutado en Railway antes de iniciar el servidor (npm run seed).
 * Usa CREATE TABLE IF NOT EXISTS — es seguro correrlo en cada deploy.
 */
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const config = require('../config');

const schemaPath = path.resolve(__dirname, 'schema.sql');

async function runSchema() {
  console.log('🔄 Aplicando schema a la base de datos...');

  const sslOptions = config.database.ssl ? { rejectUnauthorized: false } : false;

  const connection = await mysql.createConnection({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database,
    multipleStatements: true,
    ...(sslOptions && { ssl: sslOptions })
  });

  const schema = fs.readFileSync(schemaPath, 'utf8');

  // Solo ejecutar la parte de CREATE TABLE (antes del bloque DELIMITER // de triggers)
  // Eliminar CREATE DATABASE y USE para compatibilidad con Railway (la BD ya existe)
  const tablesPart = schema
    .split('DELIMITER')[0]
    .replace(/^CREATE DATABASE.*?;\n/im, '')
    .replace(/^USE.*?;\n/im, '');

  await connection.query(tablesPart);
  await connection.end();

  console.log('✅ Schema aplicado correctamente');
}

runSchema().catch(err => {
  console.error('❌ Error aplicando schema:', err.message);
  process.exit(1);
});
