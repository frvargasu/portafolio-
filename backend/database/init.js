/**
 * Script de inicialización de la base de datos MySQL
 * Ejecuta el schema SQL para crear las tablas y triggers
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Cargar configuración
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const config = require('../config');

const schemaPath = path.resolve(__dirname, 'schema.sql');

console.log('🚀 Iniciando configuración de la base de datos MySQL...\n');

async function initializeDatabase() {
  let connection;
  
  try {
    // Conectar sin especificar base de datos (para poder crearla)
    connection = await mysql.createConnection({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      multipleStatements: true
    });

    console.log('✅ Conectado a MySQL');

    // Leer el archivo SQL
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Separar tablas y triggers
    const delimiterIndex = schema.indexOf('DELIMITER //');
    
    if (delimiterIndex > -1) {
      // Ejecutar primero las tablas (parte antes de DELIMITER)
      const tablesPart = schema.substring(0, delimiterIndex);
      console.log('📝 Creando tablas...');
      await connection.query(tablesPart);
      console.log('✅ Tablas creadas');
      
      // Extraer y ejecutar triggers
      console.log('⚡ Creando triggers...');
      const triggersPart = schema.substring(delimiterIndex);
      
      // Extraer cada trigger individual usando regex
      const triggerRegex = /CREATE TRIGGER\s+(\w+)[\s\S]*?END\/\//g;
      let match;
      
      while ((match = triggerRegex.exec(triggersPart)) !== null) {
        const triggerName = match[1];
        // Obtener el trigger completo y limpiar
        let triggerCode = match[0]
          .replace(/\/\/$/, '')  // Quitar // del final
          .trim();
        
        try {
          // Eliminar trigger si existe
          await connection.query(`DROP TRIGGER IF EXISTS ${triggerName}`);
          await connection.query(triggerCode);
          console.log(`   ✅ Trigger ${triggerName} creado`);
        } catch (triggerErr) {
          console.log(`   ⚠️  Trigger ${triggerName}: ${triggerErr.message}`);
        }
      }
      
      // Ejecutar datos iniciales si existen después de DELIMITER ;
      const delimiterEndIndex = schema.indexOf('DELIMITER ;');
      if (delimiterEndIndex > -1) {
        const insertsPart = schema.substring(delimiterEndIndex + 'DELIMITER ;'.length);
        if (insertsPart.trim()) {
          console.log('📝 Insertando datos iniciales...');
          await connection.query(insertsPart);
        }
      }
    } else {
      // No hay triggers, ejecutar todo
      console.log('📝 Ejecutando schema SQL...');
      await connection.query(schema);
    }
    
    console.log('✅ Base de datos configurada exitosamente');
    
    // Verificar las tablas creadas
    await connection.query(`USE ${config.database.database}`);
    const [tables] = await connection.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ?
      ORDER BY table_name
    `, [config.database.database]);
    
    console.log('\n📋 Tablas en la base de datos:');
    tables.forEach(row => {
      console.log(`   - ${row.TABLE_NAME || row.table_name}`);
    });

    // Verificar triggers
    const [triggers] = await connection.query(`
      SELECT trigger_name 
      FROM information_schema.triggers 
      WHERE trigger_schema = ?
      ORDER BY trigger_name
    `, [config.database.database]);
    
    console.log('\n⚡ Triggers creados:');
    if (triggers.length === 0) {
      console.log('   (ninguno)');
    } else {
      triggers.forEach(row => {
        console.log(`   - ${row.TRIGGER_NAME || row.trigger_name}`);
      });
    }
    
    // Cerrar conexión
    await connection.end();
    
    console.log('\n✅ Base de datos inicializada correctamente');
    console.log(`📍 Base de datos: ${config.database.database}`);
    console.log(`📍 Host: ${config.database.host}:${config.database.port}`);
    console.log('\n👤 Usuario admin por defecto:');
    console.log('   Email: admin@sistema.com');
    console.log('   Password: admin123');
    
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error.message);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

initializeDatabase();
