# Arquitectura del Sistema

## Visión General

El sistema sigue una arquitectura de **3 capas** con separación clara de responsabilidades, diseñado para ser mantenible, escalable y testeable.

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
│                     Angular 20 + SPA                             │
│    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│    │Components│  │ Services │  │  Guards  │  │Interceptors│      │
│    └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP/REST
┌───────────────────────────▼─────────────────────────────────────┐
│                        BACKEND                                   │
│                    Node.js + Express                             │
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   Routes    │───▶│ Controllers │───▶│  Services   │         │
│  │  (Routing)  │    │  (HTTP)     │    │  (Business) │         │
│  └─────────────┘    └─────────────┘    └──────┬──────┘         │
│                                               │                  │
│  ┌─────────────┐    ┌─────────────┐    ┌──────▼──────┐         │
│  │ Middleware  │    │   Models    │◀───│Repositories │         │
│  │(Auth,Valid) │    │  (Entities) │    │   (Data)    │         │
│  └─────────────┘    └─────────────┘    └──────┬──────┘         │
└───────────────────────────────────────────────┼─────────────────┘
                                                │ SQL
┌───────────────────────────────────────────────▼─────────────────┐
│                        DATABASE                                  │
│                      MySQL 8.0                                   │
│         ┌─────────────────────────────────────┐                 │
│         │  Tables + Indexes + Triggers        │                 │
│         └─────────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Capas del Backend

### 1. Routes (Enrutamiento)
**Ubicación:** `backend/routes/`

Responsabilidad: Definir endpoints HTTP y aplicar middleware de autenticación/validación.

```javascript
// Ejemplo: routes/productoRoutes.js
router.get('/', authenticate, productoController.getAll);
router.post('/', authenticate, isAdmin, productoValidation.create, productoController.create);
```

**Middleware aplicado:**
- `authenticate` → Verifica JWT válido
- `isAdmin` → Verifica rol de administrador
- `*Validation` → Valida body/params con express-validator

---

### 2. Controllers (Controladores HTTP)
**Ubicación:** `backend/controllers/`

Responsabilidad: Manejar request/response HTTP. No contienen lógica de negocio.

```javascript
// Ejemplo: controllers/productoController.js
const getAll = asyncHandler(async (req, res) => {
  const { page, limit, search } = req.query;
  const result = await productoService.getAll({ page, limit, search });
  res.json({ success: true, ...result });
});
```

**Características:**
- Usa `asyncHandler` para manejo centralizado de errores
- Extrae parámetros del request
- Delega a services
- Formatea respuesta JSON consistente

---

### 3. Services (Lógica de Negocio)
**Ubicación:** `backend/services/`

Responsabilidad: Implementar reglas de negocio, validaciones complejas y orquestación.

```javascript
// Ejemplo: services/ventaService.js
async create(ventaData, productos, userId) {
  // Validar productos existen y están activos
  // Calcular subtotales y totales
  // Crear venta con transacción
  // Actualizar stock
  // Registrar movimientos
}
```

**Características:**
- Valida reglas de negocio (stock suficiente, productos activos)
- Maneja transacciones cuando se requiere consistencia
- Lanza `AppError` con códigos HTTP apropiados

---

### 4. Repositories (Acceso a Datos)
**Ubicación:** `backend/repositories/`

Responsabilidad: Encapsular queries SQL. Único punto de acceso a la base de datos.

```javascript
// Ejemplo: repositories/productoRepository.js
async findAll(options) {
  const sql = `SELECT p.*, c.nombre as categoria_nombre 
               FROM productos p 
               LEFT JOIN categorias c ON p.categoria_id = c.id
               WHERE p.activo = true
               LIMIT ? OFFSET ?`;
  return db.query(sql, [options.limit, options.offset]);
}
```

**Características:**
- Queries parametrizadas (previene SQL injection)
- Maneja paginación y filtros
- Soporta transacciones con `FOR UPDATE`

---

### 5. Models (Entidades)
**Ubicación:** `backend/models/`

Responsabilidad: Definir estructura de datos y transformaciones.

```javascript
// Ejemplo: models/Producto.js
class Producto {
  static fromDB(row) {
    return {
      id: row.id,
      nombre: row.nombre,
      precioVenta: parseFloat(row.precio_venta),
      stock: row.stock,
      categoria: row.categoria_nombre
    };
  }
}
```

---

### 6. Middleware
**Ubicación:** `backend/middleware/`

| Middleware | Función |
|------------|---------|
| `auth.js` | Verifica JWT, extrae usuario, valida roles |
| `validator.js` | Validaciones con express-validator |
| `errorHandler.js` | Manejo centralizado de errores |
| `rateLimiter.js` | Protección contra brute force |

---

## Arquitectura del Frontend

### Estructura Modular

```
frontend/src/app/
├── core/                 # Servicios singleton, guards, interceptors
│   ├── guards/           # AuthGuard, AdminGuard, GuestGuard
│   ├── interceptors/     # AuthInterceptor, ErrorInterceptor
│   └── services/         # AuthService, ProductoService, etc.
├── modules/              # Feature modules (lazy loaded)
│   ├── auth/             # Login, Register
│   ├── dashboard/        # Panel principal
│   ├── productos/        # CRUD productos
│   ├── ventas/           # Historial ventas
│   ├── categorias/       # Gestión categorías
│   └── pos/              # Punto de venta
└── shared/               # Componentes compartidos
    └── layout/           # Sidebar, header
```

### Lazy Loading

Cada módulo se carga bajo demanda para optimizar el bundle inicial:

```typescript
// app.routes.ts
{
  path: 'productos',
  loadChildren: () => import('./modules/productos/productos.routes')
    .then(m => m.PRODUCTOS_ROUTES)
}
```

### Interceptors

| Interceptor | Función |
|-------------|---------|
| `AuthInterceptor` | Agrega header `Authorization: Bearer {token}` |
| `ErrorInterceptor` | Maneja errores HTTP globalmente, redirect a login en 401 |

### Guards

| Guard | Función |
|-------|---------|
| `authGuard` | Protege rutas que requieren autenticación |
| `adminGuard` | Protege rutas solo para administradores |
| `guestGuard` | Redirige usuarios autenticados (para login/register) |

---

## Flujo de una Petición

```
Usuario → Angular Component
              ↓
         Angular Service (HTTP call)
              ↓
         AuthInterceptor (agrega JWT)
              ↓
         Express Router
              ↓
         Middleware (auth, validation)
              ↓
         Controller
              ↓
         Service (business logic)
              ↓
         Repository (SQL query)
              ↓
         MySQL Database
              ↓
         Response bubbles up...
              ↓
         ErrorInterceptor (maneja errores)
              ↓
         Component (actualiza UI)
```

---

## Diagrama de Arquitectura

📊 Ver [diagrama interactivo](./diagrams/arquitectura.md) (Mermaid)

---

## Ver También

- [Base de Datos](./database.md) - Modelo de datos
- [API Reference](./api.md) - Documentación de endpoints
- [Decisiones Técnicas](./decisions.md) - Justificación de elecciones
