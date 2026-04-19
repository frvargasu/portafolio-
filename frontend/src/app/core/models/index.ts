// Modelos de la aplicación

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'vendedor';
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nombre: string;
  email: string;
  password: string;
  rol?: 'admin' | 'vendedor';
}

export interface AuthResponse {
  token: string;
  user: Usuario;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  productos_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Producto {
  id: number;
  codigo_barras?: string;
  nombre: string;
  descripcion?: string;
  categoria_id: number;
  categoria_nombre?: string;
  precio_compra: number;
  precio_venta: number;
  stock: number;
  stock_minimo: number;
  imagen_url?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductoCarrito extends Producto {
  cantidad: number;
  subtotal: number;
}

export interface Venta {
  id: number;
  usuario_id: number;
  usuario_nombre?: string;
  subtotal: number;
  descuento: number;
  total: number;
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia';
  estado: 'completada' | 'cancelada';
  observaciones?: string;
  created_at: string;
  updated_at: string;
  detalles?: DetalleVenta[];
}

export interface DetalleVenta {
  id: number;
  venta_id: number;
  producto_id: number;
  producto_nombre?: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface CreateVentaRequest {
  productos: { producto_id: number; cantidad: number }[];
  descuento?: number;
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia';
  observaciones?: string;
}

export interface MovimientoStock {
  id: number;
  producto_id: number;
  producto_nombre?: string;
  tipo: 'entrada' | 'salida' | 'ajuste';
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  motivo?: string;
  usuario_id: number;
  usuario_nombre?: string;
  created_at: string;
}

export interface Dashboard {
  ventas_hoy: number;
  ventas_semana: number;
  ventas_mes: number;
  total_productos: number;
  productos_bajo_stock: number;
  productos_mas_vendidos: ProductoMasVendido[];
  ventas_por_dia: VentaPorDia[];
}

export interface ProductoMasVendido {
  producto_id: number;
  nombre: string;
  cantidad_vendida: number;
  total_ventas: number;
}

export interface VentaPorDia {
  fecha: string;
  total: number;
  cantidad_ventas: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
