# Frontend - Sistema de Inventario y Ventas PYME

Frontend desarrollado con Angular 20 para el sistema de gestión de inventario y punto de venta.

## Requisitos

- Node.js 18+
- npm

## Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start
```

La aplicación estará disponible en `http://localhost:4200`

## Estructura del Proyecto

```
src/
├── app/
│   ├── core/                 # Servicios, guards, interceptors
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── models/
│   │   └── services/
│   ├── modules/              # Módulos funcionales
│   │   ├── auth/             # Login, registro
│   │   ├── categorias/       # Gestión de categorías
│   │   ├── dashboard/        # Panel principal
│   │   ├── pos/              # Punto de venta
│   │   ├── productos/        # Gestión de productos
│   │   └── ventas/           # Historial de ventas
│   └── shared/               # Componentes compartidos
│       └── layout/           # Layout principal
├── environments/             # Configuración por ambiente
└── styles.scss               # Estilos globales
```

## Características

- **Dashboard**: Resumen de ventas, gráficos, alertas de stock
- **Punto de Venta (POS)**: Interfaz intuitiva para registro rápido de ventas
- **Gestión de Productos**: CRUD completo con control de stock
- **Categorías**: Organización de productos
- **Historial de Ventas**: Consulta y cancelación de ventas

## Tecnologías

- Angular 20
- Angular Material
- Chart.js
- RxJS
- TypeScript

## Scripts Disponibles

- `npm start` - Inicia servidor de desarrollo
- `npm run build` - Compila para producción
- `npm run build:prod` - Compila con optimizaciones de producción
- `npm test` - Ejecuta tests unitarios

## Configuración

El archivo `src/environments/environment.ts` contiene la URL de la API:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

Para producción, ajustar `environment.prod.ts` según corresponda.
