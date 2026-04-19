# API Reference

Base URL: `http://localhost:3000/api`

## Autenticación

La API usa **JWT (JSON Web Tokens)**. Incluir el token en el header:

```
Authorization: Bearer <token>
```

---

## Formato de Respuesta

### Éxito
```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": { ... }
}
```

### Error
```json
{
  "success": false,
  "message": "Descripción del error",
  "errors": [ ... ]
}
```

### Paginación
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

---

## Endpoints

### Auth

#### POST /api/auth/register
Registra un nuevo usuario.

**Request:**
```json
{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "password": "SecurePass123!"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "user": {
      "id": 1,
      "nombre": "Juan Pérez",
      "email": "juan@example.com",
      "rol": "vendedor"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Rate Limit:** 3 registros por hora por IP

---

#### POST /api/auth/login
Inicia sesión y obtiene token JWT.

**Request:**
```json
{
  "email": "juan@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "data": {
    "user": {
      "id": 1,
      "nombre": "Juan Pérez",
      "email": "juan@example.com",
      "rol": "vendedor"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Rate Limit:** 5 intentos por 15 minutos por IP

---

#### GET /api/auth/profile
Obtiene perfil del usuario autenticado.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "rol": "vendedor",
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

---

### Productos

#### GET /api/productos
Lista productos con filtros y paginación.

**Query Parameters:**
| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `page` | number | 1 | Página actual |
| `limit` | number | 10 | Items por página |
| `search` | string | - | Búsqueda por nombre |
| `categoria_id` | number | - | Filtrar por categoría |
| `includeInactive` | boolean | false | Incluir productos inactivos |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "codigo_barras": "7801234567890",
      "nombre": "Coca-Cola 500ml",
      "descripcion": "Bebida gaseosa",
      "precio_compra": 450,
      "precio_venta": 800,
      "stock": 150,
      "stock_minimo": 20,
      "categoria_nombre": "Bebidas",
      "imagen_url": "/uploads/coca-cola.jpg"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

---

#### GET /api/productos/:id
Obtiene un producto por ID.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "codigo_barras": "7801234567890",
    "nombre": "Coca-Cola 500ml",
    "precio_venta": 800,
    "stock": 150,
    "categoria": {
      "id": 2,
      "nombre": "Bebidas"
    }
  }
}
```

---

#### GET /api/productos/barcode/:codigo
Busca producto por código de barras (para scanner).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombre": "Coca-Cola 500ml",
    "precio_venta": 800,
    "stock": 150
  }
}
```

---

#### POST /api/productos
Crea un nuevo producto. **Requiere rol admin.**

**Request:**
```json
{
  "codigo_barras": "7801234567890",
  "nombre": "Coca-Cola 500ml",
  "descripcion": "Bebida gaseosa",
  "categoria_id": 2,
  "precio_compra": 450,
  "precio_venta": 800,
  "stock": 100,
  "stock_minimo": 20
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Producto creado exitosamente",
  "data": {
    "id": 1,
    "nombre": "Coca-Cola 500ml",
    ...
  }
}
```

---

#### PUT /api/productos/:id
Actualiza un producto. **Requiere rol admin.**

**Request:**
```json
{
  "precio_venta": 850,
  "stock_minimo": 25
}
```

---

#### DELETE /api/productos/:id
Elimina un producto (soft delete). **Requiere rol admin.**

**Response (200):**
```json
{
  "success": true,
  "message": "Producto eliminado exitosamente"
}
```

---

#### PUT /api/productos/:id/stock
Actualiza stock manualmente (entrada, salida, ajuste).

**Request:**
```json
{
  "tipo": "entrada",
  "cantidad": 50,
  "motivo": "Reposición de proveedor"
}
```

**Tipos válidos:** `entrada`, `salida`, `ajuste`

---

#### GET /api/productos/:id/stock-history
Obtiene historial de movimientos de stock.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "tipo": "venta",
      "cantidad": 2,
      "stock_anterior": 150,
      "stock_nuevo": 148,
      "motivo": "Venta #123",
      "created_at": "2025-01-15T14:30:00Z"
    }
  ]
}
```

---

#### GET /api/productos/low-stock
Obtiene productos con stock bajo el mínimo.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "nombre": "Pan de molde",
      "stock": 8,
      "stock_minimo": 15
    }
  ],
  "total": 3
}
```

---

### Ventas

#### GET /api/ventas
Lista ventas con filtros y paginación.

**Query Parameters:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| `page` | number | Página actual |
| `limit` | number | Items por página |
| `usuario_id` | number | Filtrar por vendedor |
| `estado` | string | 'pendiente', 'completada', 'cancelada' |
| `fecha_inicio` | date | Fecha desde (YYYY-MM-DD) |
| `fecha_fin` | date | Fecha hasta (YYYY-MM-DD) |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "fecha": "2025-01-15T14:30:00Z",
      "total": 15600,
      "metodo_pago": "efectivo",
      "estado": "completada",
      "vendedor_nombre": "Juan Pérez",
      "items_count": 3
    }
  ],
  "pagination": { ... }
}
```

---

#### GET /api/ventas/today
Obtiene resumen de ventas del día.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total_ventas": 12,
    "monto_total": 156000,
    "ventas": [ ... ]
  }
}
```

---

#### GET /api/ventas/:id
Obtiene detalle completo de una venta.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "fecha": "2025-01-15T14:30:00Z",
    "subtotal": 15000,
    "descuento": 0,
    "impuesto": 600,
    "total": 15600,
    "metodo_pago": "efectivo",
    "estado": "completada",
    "vendedor": {
      "id": 1,
      "nombre": "Juan Pérez"
    },
    "detalles": [
      {
        "producto_id": 1,
        "producto_nombre": "Coca-Cola 500ml",
        "cantidad": 2,
        "precio_unitario": 800,
        "subtotal": 1600
      }
    ]
  }
}
```

---

#### POST /api/ventas
Registra una nueva venta.

**Request:**
```json
{
  "productos": [
    { "producto_id": 1, "cantidad": 2 },
    { "producto_id": 5, "cantidad": 1 }
  ],
  "metodo_pago": "efectivo",
  "descuento": 500,
  "observaciones": "Cliente frecuente"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Venta registrada exitosamente",
  "data": {
    "id": 124,
    "total": 15100,
    "estado": "completada"
  }
}
```

**Validaciones:**
- Stock suficiente para cada producto
- Productos activos
- Cantidades positivas

---

#### PUT /api/ventas/:id/cancel
Cancela una venta y restaura el stock.

**Request:**
```json
{
  "motivo": "Cliente solicitó devolución"
}
```

---

#### GET /api/ventas/stats
Obtiene estadísticas de ventas.

**Query Parameters:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| `fecha_inicio` | date | Fecha desde |
| `fecha_fin` | date | Fecha hasta |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total_ventas": 156,
    "monto_total": 4560000,
    "promedio_venta": 29230,
    "ventas_por_metodo": {
      "efectivo": 89,
      "tarjeta": 52,
      "transferencia": 15
    }
  }
}
```

---

### Categorías

#### GET /api/categorias
Lista todas las categorías.

#### POST /api/categorias
Crea una categoría. **Requiere rol admin.**

#### PUT /api/categorias/:id
Actualiza una categoría. **Requiere rol admin.**

#### DELETE /api/categorias/:id
Elimina una categoría (soft delete). **Requiere rol admin.**

---

### Reportes

#### GET /api/reportes/dashboard
Obtiene datos para el dashboard.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "ventas_hoy": 12,
    "monto_hoy": 156000,
    "ventas_semana": 78,
    "monto_semana": 980000,
    "productos_stock_bajo": 5,
    "top_productos": [
      { "nombre": "Coca-Cola 500ml", "cantidad_vendida": 234 }
    ],
    "ventas_por_dia": [
      { "fecha": "2025-01-15", "total": 156000 }
    ]
  }
}
```

---

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - Token inválido o expirado |
| 403 | Forbidden - Sin permisos para esta acción |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Recurso ya existe (email duplicado, etc.) |
| 429 | Too Many Requests - Rate limit excedido |
| 500 | Internal Server Error |

---

## Ver También

- [Arquitectura](./arquitectura.md) - Arquitectura del sistema
- [Base de Datos](./database.md) - Modelo de datos
- [Decisiones Técnicas](./decisions.md) - Justificación de elecciones
