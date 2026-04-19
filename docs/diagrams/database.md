# Diagrama de Base de Datos

```mermaid
erDiagram
    usuarios ||--o{ ventas : "registra"
    usuarios ||--o{ movimientos_stock : "realiza"
    categorias ||--o{ productos : "contiene"
    productos ||--o{ detalle_ventas : "incluido_en"
    productos ||--o{ movimientos_stock : "tiene"
    ventas ||--|{ detalle_ventas : "tiene"

    usuarios {
        int id PK
        varchar nombre
        varchar email UK
        varchar password
        enum rol
        boolean activo
        timestamp created_at
    }

    categorias {
        int id PK
        varchar nombre UK
        text descripcion
        boolean activo
    }

    productos {
        int id PK
        varchar codigo_barras UK
        varchar nombre
        text descripcion
        varchar imagen_url
        int categoria_id FK
        decimal precio_compra
        decimal precio_venta
        int stock
        int stock_minimo
        boolean activo
    }

    ventas {
        int id PK
        int usuario_id FK
        timestamp fecha
        decimal subtotal
        decimal descuento
        decimal impuesto
        decimal total
        enum metodo_pago
        enum estado
        text observaciones
    }

    detalle_ventas {
        int id PK
        int venta_id FK
        int producto_id FK
        int cantidad
        decimal precio_unitario
        decimal subtotal
    }

    movimientos_stock {
        int id PK
        int producto_id FK
        enum tipo
        int cantidad
        int stock_anterior
        int stock_nuevo
        text motivo
        int usuario_id FK
        timestamp created_at
    }
```

## Relaciones

| Tabla Origen | Relación | Tabla Destino | Descripción |
|--------------|----------|---------------|-------------|
| usuarios | 1:N | ventas | Un usuario registra muchas ventas |
| categorias | 1:N | productos | Una categoría tiene muchos productos |
| productos | 1:N | detalle_ventas | Un producto aparece en muchas ventas |
| ventas | 1:N | detalle_ventas | Una venta tiene muchos productos |
| productos | 1:N | movimientos_stock | Un producto tiene historial de movimientos |
