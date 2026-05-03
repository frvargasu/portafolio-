-- =====================================================
-- SCRIPT SQL - SISTEMA DE INVENTARIO Y VENTAS PYME
-- Base de datos: MySQL
-- =====================================================

-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS inventory_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE inventory_db;

-- =====================================================
-- TABLA: usuarios
-- Almacena información de usuarios del sistema
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'vendedor') NOT NULL DEFAULT 'vendedor',
    activo BOOLEAN DEFAULT TRUE,
    reset_token VARCHAR(255) NULL,
    reset_token_expires DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_usuarios_email (email)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: categorias
-- Categorías de productos
-- =====================================================
CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: proveedores
-- Proveedores de productos
-- =====================================================
CREATE TABLE IF NOT EXISTS proveedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL UNIQUE,
    contacto VARCHAR(100),
    email VARCHAR(150),
    telefono VARCHAR(30),
    direccion VARCHAR(255),
    notas TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_proveedores_nombre (nombre)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: productos
-- Catálogo de productos del inventario
-- =====================================================
CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_barras VARCHAR(50) UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    imagen_url VARCHAR(500),
    categoria_id INT,
    precio_compra DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    precio_venta DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    stock_minimo INT DEFAULT 10,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
    INDEX idx_productos_codigo (codigo_barras),
    INDEX idx_productos_nombre (nombre),
    INDEX idx_productos_categoria (categoria_id)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: ventas
-- Registro de ventas realizadas
-- =====================================================
CREATE TABLE IF NOT EXISTS ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    descuento DECIMAL(10, 2) DEFAULT 0.00,
    impuesto DECIMAL(10, 2) DEFAULT 0.00,
    total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    metodo_pago ENUM('efectivo', 'tarjeta', 'transferencia') DEFAULT 'efectivo',
    estado ENUM('pendiente', 'completada', 'cancelada') DEFAULT 'completada',
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    INDEX idx_ventas_fecha (fecha),
    INDEX idx_ventas_usuario (usuario_id),
    INDEX idx_ventas_estado (estado)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: detalle_ventas
-- Detalle de productos por cada venta
-- =====================================================
CREATE TABLE IF NOT EXISTS detalle_ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venta_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id),
    INDEX idx_detalle_venta (venta_id),
    INDEX idx_detalle_producto (producto_id)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: movimientos_stock
-- Historial de movimientos de inventario
-- =====================================================
CREATE TABLE IF NOT EXISTS movimientos_stock (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    tipo ENUM('entrada', 'salida', 'ajuste', 'venta', 'devolucion') NOT NULL,
    cantidad INT NOT NULL,
    stock_anterior INT NOT NULL,
    stock_nuevo INT NOT NULL,
    motivo TEXT,
    referencia_id INT,
    referencia_tipo VARCHAR(50),
    usuario_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    INDEX idx_movimientos_producto (producto_id),
    INDEX idx_movimientos_fecha (created_at),
    INDEX idx_movimientos_tipo (tipo)
) ENGINE=InnoDB;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Cambiar delimitador para crear triggers
DELIMITER //

-- =====================================================
-- TRIGGER: Registrar movimiento de stock al insertar producto
-- =====================================================
CREATE TRIGGER trg_producto_insert_stock
AFTER INSERT ON productos
FOR EACH ROW
BEGIN
    IF NEW.stock > 0 THEN
        INSERT INTO movimientos_stock (
            producto_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo
        ) VALUES (
            NEW.id, 'entrada', NEW.stock, 0, NEW.stock, 'Stock inicial del producto'
        );
    END IF;
END//

-- TRIGGER trg_producto_update_stock eliminado.
-- Motivo: causaba duplicación en movimientos_stock al encadenarse con
-- trg_actualizar_stock_venta. La lógica de registro de movimientos
-- se maneja en el backend dentro de transacciones explícitas.

-- =====================================================
-- TRIGGER: Validar stock antes de insertar detalle de venta
-- =====================================================
CREATE TRIGGER trg_validar_stock_venta
BEFORE INSERT ON detalle_ventas
FOR EACH ROW
BEGIN
    DECLARE stock_actual INT;
    
    SELECT stock INTO stock_actual 
    FROM productos 
    WHERE id = NEW.producto_id;
    
    IF stock_actual < NEW.cantidad THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Stock insuficiente para realizar la venta';
    END IF;
END//

-- TRIGGER trg_actualizar_stock_venta eliminado.
-- Motivo: al encadenarse con trg_producto_update_stock generaba 2-3 filas
-- duplicadas en movimientos_stock por cada línea de venta.
-- El backend actualiza el stock y registra movimientos dentro de la misma
-- transacción con SELECT ... FOR UPDATE para evitar race conditions.

-- TRIGGER trg_restaurar_stock_cancelacion eliminado.
-- Motivo: el cursor iterable sin bloqueo exponía race conditions.
-- La restauración del stock al cancelar una venta se maneja en el backend
-- con FOR UPDATE y transacción explícita (ventaRepository.cancel).

-- =====================================================
-- TRIGGER: Validar que no se eliminen productos con ventas
-- =====================================================
CREATE TRIGGER trg_proteger_producto_ventas
BEFORE DELETE ON productos
FOR EACH ROW
BEGIN
    DECLARE ventas_count INT;
    
    SELECT COUNT(*) INTO ventas_count 
    FROM detalle_ventas 
    WHERE producto_id = OLD.id;
    
    IF ventas_count > 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'No se puede eliminar un producto que tiene ventas registradas';
    END IF;
END//

-- =====================================================
-- TRIGGER: Calcular subtotal automático en detalle_ventas
-- =====================================================
CREATE TRIGGER trg_calcular_subtotal_detalle
BEFORE INSERT ON detalle_ventas
FOR EACH ROW
BEGIN
    SET NEW.subtotal = NEW.cantidad * NEW.precio_unitario;
END//

-- TRIGGER trg_alerta_stock_bajo eliminado.
-- Motivo: insertaba movimientos con cantidad = 0, corrompiendo reportes de
-- inventario. La detección de stock bajo se verifica en el backend y se
-- puede notificar por logging o una tabla dedicada de alertas.

-- Restaurar delimitador
DELIMITER ;

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Usuario administrador por defecto (password: admin123)
-- La contraseña está hasheada con bcrypt
INSERT IGNORE INTO usuarios (id, nombre, email, password, rol) 
VALUES (1, 'Administrador', 'admin@sistema.com', '$2a$10$UKlkY473tLaQSr8CnL2ngezN6GG.n3bBlzJyUx.0sX0fzUkDhdH/a', 'admin');

-- Categorías de ejemplo
INSERT IGNORE INTO categorias (id, nombre, descripcion) VALUES 
(1, 'Electrónica', 'Productos electrónicos y tecnología'),
(2, 'Alimentos', 'Productos alimenticios'),
(3, 'Hogar', 'Artículos para el hogar'),
(4, 'Ropa', 'Vestimenta y accesorios'),
(5, 'Otros', 'Productos varios');
