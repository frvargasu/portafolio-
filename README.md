 # Sistema de Inventario y Ventas PYME

Sistema web completo para gestión de inventario y punto de venta, diseñado para pequeñas y medianas empresas chilenas.

![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=nodedotjs&logoColor=white)
![Angular](https://img.shields.io/badge/Angular-v20-DD0031?logo=angular&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## Screenshots

### Dashboard
Panel principal con resumen de ventas, gráficos de inversión vs ingresos, productos más vendidos y accesos rápidos.

![Dashboard](doc/screenshots/Dashboard.portafolio.png)

### Punto de Venta
Interfaz intuitiva para registrar ventas rápidamente con carrito de compras, búsqueda de productos y múltiples métodos de pago.

![Nueva Venta](doc/screenshots/nuevaVenta.portafolio.png)

### Gestión de Productos
Catálogo completo con imágenes, códigos de barras, precios, stock y alertas de inventario bajo.

![Productos](doc/screenshots/Productos.portafolio.png)

### Historial de Ventas
Registro detallado de todas las transacciones con filtros por fecha, estado y método de pago.

![Ventas](doc/screenshots/RegistroVenta.portafolio.png)

### Categorías
Organización de productos por categorías para facilitar la gestión del inventario.

![Categorías](doc/screenshots/Categoria.portafolio.png)

### Autenticación
Sistema seguro de login y registro con validación de formularios.

<p align="center">
  <img src="doc/screenshots/login.portafolio.png" alt="Login" width="45%">
  <img src="doc/screenshots/crearCuenta.portafolio.png" alt="Registro" width="45%">
</p>

---

## Características

### Gestión de Inventario
- ✅ Catálogo de productos con imágenes y códigos de barras
- ✅ Control de stock con alertas de inventario bajo
- ✅ Historial de movimientos (entradas, salidas, ajustes)
- ✅ Categorización de productos

### Punto de Venta
- ✅ Registro rápido de ventas con carrito
- ✅ Múltiples métodos de pago (efectivo, tarjeta, transferencia)
- ✅ Aplicación de descuentos
- ✅ Historial de transacciones con filtros

### Dashboard y Reportes
- ✅ Resumen de ventas (hoy, semana, mes)
- ✅ Gráficos de inversión vs ingresos
- ✅ Top 5 productos más vendidos
- ✅ Alertas de stock bajo

### Seguridad
- ✅ Autenticación JWT
- ✅ Roles de usuario (admin/vendedor)
- ✅ Protección de rutas
- ✅ Validación de datos

---

## Tecnologías

| Backend | Frontend |
|---------|----------|
| Node.js + Express | Angular 20 |
| MySQL | Angular Material |
| JWT + bcrypt | Chart.js |
| Helmet, CORS | Lucide Icons |

---

## Requisitos

- Node.js 18+
- MySQL 8.0+
- npm o yarn

---

## Instalación

### 1. Clonar repositorio

```bash
git clone https://github.com/frvargasu/portafolio-duoc.git
cd portafolio-duoc
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env  # Configurar variables de entorno
npm run init-db       # Crear base de datos y tablas
npm run dev           # Iniciar servidor en modo desarrollo
```

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

### 4. Acceder

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:4200 |
| API | http://localhost:3000 |

---

##  Usuario por Defecto

| Email | Contraseña | Rol |
|-------|------------|-----|
| admin@sistema.com | admin123 | Administrador |

---

## Estructura del Proyecto

```
├── backend/
│   ├── config/          # Configuración de la app
│   ├── controllers/     # Controladores de rutas
│   ├── database/        # Conexión y schema SQL
│   ├── middleware/      # Auth, validación, errores
│   ├── models/          # Modelos de datos
│   ├── repositories/    # Acceso a base de datos
│   ├── routes/          # Definición de endpoints
│   ├── services/        # Lógica de negocio
│   └── app.js           # Punto de entrada
│
└── frontend/
    └── src/app/
        ├── core/        # Guards, interceptores, servicios
        ├── layout/      # Sidebar, header
        ├── modules/     # Módulos funcionales
        │   ├── auth/
        │   ├── dashboard/
        │   ├── productos/
        │   ├── categorias/
        │   └── ventas/
        └── shared/      # Componentes reutilizables
```

---

## API Endpoints

### Autenticación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/register` | Registrar usuario |
| GET | `/api/auth/profile` | Obtener perfil |

### Productos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/productos` | Listar productos |
| GET | `/api/productos/:id` | Obtener producto |
| POST | `/api/productos` | Crear producto |
| PUT | `/api/productos/:id` | Actualizar producto |
| DELETE | `/api/productos/:id` | Eliminar producto |

### Ventas
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/ventas` | Listar ventas |
| GET | `/api/ventas/:id` | Obtener detalle |
| POST | `/api/ventas` | Registrar venta |
| PUT | `/api/ventas/:id/cancelar` | Cancelar venta |

### Categorías
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/categorias` | Listar categorías |
| POST | `/api/categorias` | Crear categoría |
| PUT | `/api/categorias/:id` | Actualizar |
| DELETE | `/api/categorias/:id` | Eliminar |

### Reportes
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/reportes/dashboard` | Datos del dashboard |
| GET | `/api/reportes/ventas` | Reporte de ventas |
| GET | `/api/reportes/inventario` | Reporte de inventario |

---

##  Base de Datos

### Diagrama de Tablas

```
usuarios ──────┐
               │
categorias ────┼──> productos ──> detalle_ventas ──> ventas
               │         │
               │         └──> movimientos_stock
               │
               └────────────────────────────────────────┘
```

### Tablas Principales
- **usuarios**: Administradores y vendedores
- **productos**: Catálogo con stock y precios
- **categorias**: Clasificación de productos
- **ventas**: Registro de transacciones
- **detalle_ventas**: Productos por venta
- **movimientos_stock**: Historial de inventario

---

##  Contexto del Proyecto

### Visión y Pilares
![Visión y Pilares](doc/screenshots/Vision%20y%20pilares.png)

### Problema
Las PYMES enfrentan dificultades en el control manual de inventario y ventas, lo que genera:
- Falta de stock por desconocimiento de existencias
- Errores en el registro de ventas
- Mala gestión financiera
- Pérdidas económicas

![Mapa Mental](doc/screenshots/Mapa%20mental.png)

### Solución
Sistema web que automatiza:
- Control de inventario en tiempo real
- Registro de ventas con múltiples métodos de pago
- Reportes y estadísticas para toma de decisiones
- Alertas de stock bajo

### Stakeholders
![Mapa de Actores](doc/screenshots/Mapa%20de%20actores.png)

- **Principal**: Dueño PYME, Administrador
- **Secundario**: Vendedor, Empleados
- **Informado**: Clientes

---

## Licencia

MIT License

---

## Autor

**Francisco Vargas** - [GitHub](https://github.com/