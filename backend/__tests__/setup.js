/**
 * Test Setup
 * Configuración global para los tests
 */
require('dotenv').config();

// Silenciar logs durante los tests
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'info').mockImplementation(() => {});

// Restaurar console.error y console.warn para debug
// jest.spyOn(console, 'error').mockImplementation(() => {});
// jest.spyOn(console, 'warn').mockImplementation(() => {});

// Timeout global para tests
jest.setTimeout(30000);
