# Modelo de Base de Datos

## Diagrama Entidad-Relación

📊 Ver [diagrama interactivo](./diagrams/database.md) (Mermaid)

---

## Tablas

### usuarios
Almacena información de usuarios del sistema con autenticación y roles.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INT PK | Identificador único |
| `nombre` | VARCHAR(100) | Nombre completo |
| `email` | VARCHAR(150) UNIQUE | Email (usado para login) |
| `password` | VARCHAR(255) | Hash bcrypt de la contraseña |
| `rol` | ENUM('admin', 'vendedor') | Rol del usuario |
| `activo` | BOOLEAN | Soft delete flag |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Última actualización |

**Índices:**
- `idx_usuarios_email` en `email` para búsqueda rápida en login

---

### categorias
Categorías para organizar productos.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INT PK | Identificador único |
| `nombre` | VARCHAR(100) UNIQUE | Nombre de la categoría |
| `descripcion` | TEXT | Descripción opcional |
| `activo` | BOOLEAN | Soft delete flag |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Última actualización |

---

### productos
Catálogo de productos del inventario.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INT PK | Identificador único |
| `codigo_barras` | VARCHAR(50) UNIQUE | Código de barras (opcional) |
| `nombre` | VARCHAR(200) | Nombre del producto |
| `descripcion` | TEXT | Descripción detallada |
| `imagen_url` | VARCHAR(500) | URL de imagen del producto |
| `categoria_id` | INT FK | Referencia a categorias |
| `precio_compra` | DECIMAL(10,2) | Precio de costo |
| `precio_venta` | DECIMAL(10,2) | Precio de venta al público |
| `stock` | INT | Cantidad actual en inventario |
| `stock_minimo` | INT | Umbral para alertas de stock bajo |
| `activo` | BOOLEAN | Soft delete flag |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Última actualización |

**Índices:**
- `idx_productos_codigo` en `codigo_barras` para búsqueda por scanner
- `idx_productos_nombre` en `nombre` para búsqueda por texto
- `idx_productos_categoria` en `categoria_id` para filtrado

**Relaciones:**
- `categoria_id` → `categorias.id` (ON DELETE SET NULL)

---

### ventas
Registro de ventas realizadas.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INT PK | Identificador único |
| `usuario_id` | INT FK | Usuario que registró la venta |
| `fecha` | TIMESTAMP | Fecha y hora de la venta |
| `subtotal` | DECIMAL(10,2) | Suma de productos sin descuento |
| `descuento` | DECIMAL(10,2) | Descuento aplicado |
| `impuesto` | DECIMAL(10,2) | Impuesto (IVA) |
| `total` | DECIMAL(10,2) | Total final |
| `metodo_pago` | ENUM | 'efectivo', 'tarjeta', 'transferencia' |
| `estado` | ENUM | 'pendiente', 'completada', 'cancelada' |
| `observaciones` | TEXT | Notas adicionales |
| `created_at` | TIMESTAMP | Fecha de creación |

**Índices:**
- `idx_ventas_fecha` para filtrado por rango de fechas
- `idx_ventas_usuario` para ventas por vendedor
- `idx_ventas_estado` para filtrado por estado

---

### detalle_ventas
Detalle de productos por cada venta (líneas de la factura).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INT PK | Identificador único |
| `venta_id` | INT FK | Referencia a la venta |
| `producto_id` | INT FK | Referencia al producto |
| `cantidad` | INT | Cantidad vendida |
| `precio_unitario` | DECIMAL(10,2) | Precio al momento de la venta |
| `subtotal` | DECIMAL(10,2) | cantidad × precio_unitario |
| `created_at` | TIMESTAMP | Fecha de creación |

**Relaciones:**
- `venta_id` → `ventas.id` (ON DELETE CASCADE)
- `producto_id` → `productos.id`

---

### movimientos_stock
Historial de movimientos de inventario para trazabilidad completa.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INT PK | Identificador único |
| `producto_id` | INT FK | Producto afectado |
| `tipo` | ENUM | 'entrada', 'salida', 'ajuste', 'venta', 'devolucion' |
| `cantidad` | INT | Cantidad del movimiento |
| `stock_anterior` | INT | Stock antes del movimiento |
| `stock_nuevo` | INT | Stock después del movimiento |
| `motivo` | TEXT | Razón del movimiento |
| `referencia_id` | INT | ID de venta/compra relacionada |
| `referencia_tipo` | VARCHAR(50) | Tipo de referencia ('venta', 'ajuste', etc.) |
| `usuario_id` | INT FK | Usuario que realizó el movimiento |
| `created_at` | TIMESTAMP | Fecha del movimiento |

**Uso:** Permite auditoría completa de cambios de stock con trazabilidad a la operación origen.

---

## Triggers

### trg_producto_insert_stock
**Evento:** AFTER INSERT en `productos`

**Función:** Registra automáticamente el stock inicial como movimiento de entrada.

```sql
IF NEW.stock > 0 THEN
    INSERT INTO movimientos_stock (
        producto_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo
    ) VALUES (
        NEW.id, 'entrada', NEW.stock, 0, NEW.stock, 'Stock inicial del producto'
    );
END IF;
```

---

### trg_validar_stock_venta
**Evento:** BEFORE INSERT en `detalle_ventas`

**Función:** Valida que haya stock suficiente antes de registrar una línea de venta.

```sql
IF stock_actual < NEW.cantidad THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Stock insuficiente para realizar la venta';
END IF;
```

**Nota:** Esta es una validación de seguridad adicional. La validación principal ocurre en el backend con `SELECT ... FOR UPDATE` para evitar race conditions.

---

### trg_proteger_producto_ventas
**Evento:** BEFORE DELETE en `productos`

**Función:** Impide eliminar productos que tienen ventas registradas.

```sql
IF ventas_count > 0 THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'No se puede eliminar un producto con ventas';
END IF;
```

---

## Lógica de Negocio

### Control de Stock con Transacciones

El sistema usa transacciones con bloqueo pesimista para evitar race conditions:

```javascript
// ventaRepository.js
await db.transaction(async (connection) => {
  // 1. Bloquear productos con FOR UPDATE
  const producto = await connection.query(
    'SELECT * FROM productos WHERE id = ? FOR UPDATE',
    [producto_id]
  );
  
  // 2. Validar stock
  if (producto.stock < cantidad) {
    throw new Error('Stock insuficiente');
  }
  
  // 3. Actualizar stock
  await connection.query(
    'UPDATE productos SET stock = stock - ? WHERE id = ?',
    [cantidad, producto_id]
  );
  
  // 4. Registrar movimiento
  await connection.query(
    'INSERT INTO movimientos_stock ...',
    [...]
  );
});
```

### Soft Delete

Los registros no se eliminan físicamente. Se usa el campo `activo = false`:
- **Productos:** Permite mantener historial de ventas
- **Usuarios:** Permite auditoría de operaciones
- **Categorías:** Evita productos huérfanos

---

## Ver También

- [Arquitectura](./arquitectura.md) - Arquitectura del sistema
- [API Reference](./api.md) - Endpoints de la API
- [Decisiones Técnicas](./decisions.md) - Por qué estas elecciones
