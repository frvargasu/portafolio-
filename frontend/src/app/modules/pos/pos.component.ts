import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProductoService } from '../../core/services/producto.service';
import { VentaService } from '../../core/services/venta.service';
import { CategoriaService } from '../../core/services/categoria.service';
import { Producto, ProductoCarrito, Categoria, CreateVentaRequest } from '../../core/models';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    CurrencyPipe
  ],
  template: `
    <div class="pos-container">
      <!-- Panel izquierdo - Productos -->
      <div class="productos-panel">
        <h1 class="page-title">Inventario</h1>
        
        <h2 class="section-title">Productos</h2>
        
        <!-- Búsqueda -->
        <div class="search-container">
          <input 
            type="text"
            class="search-input"
            [(ngModel)]="searchTerm"
            (keyup.enter)="buscarPorCodigo()"
            placeholder="Buscar por nombre o código...">
          <button class="search-btn" (click)="buscarPorCodigo()">
            <mat-icon>search</mat-icon>
          </button>
        </div>

        <!-- Grid de productos -->
        <div class="productos-grid">
          @if (loadingProductos()) {
            <div class="loading-container">
              <mat-spinner diameter="40"></mat-spinner>
            </div>
          } @else {
            @for (producto of productosFiltrados(); track producto.id) {
              <div 
                class="producto-card" 
                [class.selected]="isInCart(producto)"
                [class.sin-stock]="producto.stock <= 0"
                (click)="agregarAlCarrito(producto)">
                <div class="card-content">
                  <span class="producto-nombre">{{ producto.nombre }}</span>
                  <span class="producto-precio">{{ producto.precio_venta | currency:'$':'symbol':'1.0-0' }}</span>
                  <span class="producto-stock" [class.bajo]="producto.stock <= producto.stock_minimo">
                    Stock: {{ producto.stock }}
                  </span>
                </div>
                <button class="add-btn" (click)="agregarAlCarrito(producto); $event.stopPropagation()">
                  <mat-icon>add</mat-icon>
                </button>
              </div>
            }

            @if (productosFiltrados().length === 0) {
              <div class="no-productos">
                <mat-icon>search_off</mat-icon>
                <p>No se encontraron productos</p>
              </div>
            }
          }
        </div>
      </div>

      <!-- Panel derecho - Carrito -->
      <div class="carrito-panel">
        <div class="carrito-header">
          <h2>Venta Actual</h2>
          <button class="limpiar-btn" (click)="limpiarCarrito()" [disabled]="carrito().length === 0">
            Limpiar
          </button>
        </div>

        <div class="carrito-items">
          @if (carrito().length === 0) {
            <div class="carrito-vacio">
              <mat-icon>shopping_cart</mat-icon>
              <p>No hay productos</p>
            </div>
          } @else {
            @for (item of carrito(); track item.id) {
              <div class="carrito-item">
                <div class="item-info">
                  <span class="item-nombre">{{ item.nombre }}</span>
                  <span class="item-precio">{{ item.precio_venta | currency:'$':'symbol':'1.0-0' }} c/u</span>
                </div>
                <div class="item-controls">
                  <button class="qty-btn minus" (click)="decrementarCantidad(item)">
                    <mat-icon>remove</mat-icon>
                  </button>
                  <span class="qty-value">{{ item.cantidad }}</span>
                  <button class="qty-btn plus" (click)="incrementarCantidad(item)" [disabled]="item.cantidad >= item.stock">
                    <mat-icon>add</mat-icon>
                  </button>
                </div>
                <span class="item-subtotal">{{ item.subtotal | currency:'$':'symbol':'1.0-0' }}</span>
                <button class="delete-btn" (click)="eliminarDelCarrito(item)">
                  <mat-icon>delete_outline</mat-icon>
                </button>
              </div>
            }
          }
        </div>

        <div class="carrito-footer">
          <!-- Resumen -->
          <div class="resumen">
            <div class="resumen-row">
              <span>Subtotal:</span>
              <span>{{ subtotal() | currency:'$':'symbol':'1.0-0' }}</span>
            </div>
            <div class="resumen-row descuento-row">
              <span>Descuento:</span>
              <div class="descuento-input">
                <span>$</span>
                <input type="number" [(ngModel)]="descuento" min="0" [max]="subtotal()">
              </div>
            </div>
          </div>

          <!-- Total -->
          <div class="total-box">
            <div class="total-content">
              <mat-icon>receipt</mat-icon>
              <span class="total-label">TOTAL A PAGAR</span>
            </div>
            <span class="total-value">{{ total() | currency:'$':'symbol':'1.0-0' }}</span>
          </div>

          <!-- Método de pago -->
          <div class="metodo-pago">
            <span class="label">Método de pago:</span>
            <div class="metodo-buttons">
              <button 
                class="metodo-btn"
                [class.selected]="metodoPago === 'efectivo'"
                (click)="metodoPago = 'efectivo'">
                <mat-icon>payments</mat-icon>
                Efectivo
              </button>
              <button 
                class="metodo-btn"
                [class.selected]="metodoPago === 'tarjeta'"
                (click)="metodoPago = 'tarjeta'">
                <mat-icon>credit_card</mat-icon>
                Tarjeta
              </button>
              <button 
                class="metodo-btn"
                [class.selected]="metodoPago === 'transferencia'"
                (click)="metodoPago = 'transferencia'">
                <mat-icon>account_balance</mat-icon>
                Trans.
              </button>
            </div>
          </div>

          <!-- Botón completar -->
          <button 
            class="completar-btn"
            [disabled]="carrito().length === 0 || procesando()"
            (click)="procesarVenta()">
            @if (procesando()) {
              <mat-spinner diameter="24"></mat-spinner>
            } @else {
              Completar Venta - {{ total() | currency:'$':'symbol':'1.0-0' }}
            }
          </button>

          <a class="historial-link" routerLink="/ventas">
            ← Volver al historial
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pos-container {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 24px;
      height: calc(100vh - 48px);
      max-height: calc(100vh - 48px);
    }

    /* Panel Productos */
    .productos-panel {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .page-title {
      margin: 0 0 24px;
      font-size: 24px;
      font-weight: 600;
      color: #1e293b;
    }

    .section-title {
      margin: 0 0 16px;
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
    }

    .search-container {
      display: flex;
      margin-bottom: 20px;
    }

    .search-input {
      flex: 1;
      padding: 14px 18px;
      border: 1px solid #e2e8f0;
      border-right: none;
      border-radius: 10px 0 0 10px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;

      &:focus {
        border-color: #818cf8;
      }

      &::placeholder {
        color: #94a3b8;
      }
    }

    .search-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 0 20px;
      border-radius: 0 10px 10px 0;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.2s;

      &:hover {
        opacity: 0.9;
      }

      mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
      }
    }

    .productos-grid {
      flex: 1;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 16px;
      overflow-y: auto;
      padding: 4px;
      align-content: start;
    }

    .producto-card {
      background: white;
      border: 2px solid transparent;
      border-radius: 12px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      position: relative;
      display: flex;
      flex-direction: column;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      &.selected {
        border-color: #818cf8;
      }

      &.sin-stock {
        opacity: 0.5;
        pointer-events: none;
      }
    }

    .card-content {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
    }

    .producto-nombre {
      font-weight: 600;
      font-size: 14px;
      color: #1e293b;
      line-height: 1.3;
    }

    .producto-precio {
      font-weight: 700;
      font-size: 18px;
      color: #667eea;
    }

    .producto-stock {
      font-size: 13px;
      color: #64748b;

      &.bajo {
        color: #ef4444;
        font-weight: 500;
      }
    }

    .add-btn {
      position: absolute;
      bottom: 12px;
      right: 12px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: none;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s;

      &:hover {
        transform: scale(1.1);
      }

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .loading-container {
      grid-column: 1 / -1;
      display: flex;
      justify-content: center;
      padding: 60px;
    }

    .no-productos {
      grid-column: 1 / -1;
      text-align: center;
      padding: 60px;
      color: #94a3b8;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 12px;
      }
    }

    /* Panel Carrito */
    .carrito-panel {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .carrito-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #f1f5f9;

      h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #1e293b;
      }
    }

    .limpiar-btn {
      background: none;
      border: none;
      color: #ef4444;
      font-size: 14px;
      cursor: pointer;
      font-weight: 500;

      &:hover {
        text-decoration: underline;
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }

    .carrito-items {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }

    .carrito-vacio {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: #cbd5e1;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 12px;
      }

      p {
        margin: 0;
        font-size: 14px;
      }
    }

    .carrito-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid #f1f5f9;

      &:last-child {
        border-bottom: none;
      }
    }

    .item-info {
      flex: 1;
      min-width: 0;

      .item-nombre {
        display: block;
        font-weight: 500;
        font-size: 14px;
        color: #1e293b;
      }

      .item-precio {
        font-size: 12px;
        color: #94a3b8;
      }
    }

    .item-controls {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .qty-btn {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      &.minus {
        background: #fee2e2;
        color: #ef4444;

        &:hover {
          background: #fecaca;
        }
      }

      &.plus {
        background: #dcfce7;
        color: #22c55e;

        &:hover {
          background: #bbf7d0;
        }

        &:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      }
    }

    .qty-value {
      min-width: 24px;
      text-align: center;
      font-weight: 600;
      font-size: 14px;
    }

    .item-subtotal {
      font-weight: 600;
      font-size: 14px;
      color: #1e293b;
      min-width: 70px;
      text-align: right;
    }

    .delete-btn {
      background: none;
      border: none;
      color: #cbd5e1;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s;

      &:hover {
        color: #ef4444;
      }

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    /* Footer del carrito */
    .carrito-footer {
      padding: 20px;
      border-top: 1px solid #f1f5f9;
      background: #fafafa;
    }

    .resumen {
      margin-bottom: 16px;
    }

    .resumen-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      color: #64748b;
      font-size: 14px;
    }

    .descuento-input {
      display: flex;
      align-items: center;
      gap: 4px;

      span {
        color: #94a3b8;
      }

      input {
        width: 80px;
        padding: 6px 10px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        text-align: right;
        font-size: 14px;
        outline: none;

        &:focus {
          border-color: #818cf8;
        }
      }
    }

    .total-box {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .total-content {
      display: flex;
      align-items: center;
      gap: 10px;
      color: rgba(255, 255, 255, 0.9);

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .total-label {
        font-size: 13px;
        font-weight: 500;
      }
    }

    .total-value {
      font-size: 28px;
      font-weight: 700;
      color: white;
    }

    .metodo-pago {
      margin-bottom: 16px;

      .label {
        display: block;
        font-size: 13px;
        color: #64748b;
        margin-bottom: 10px;
      }
    }

    .metodo-buttons {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }

    .metodo-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      font-size: 13px;
      color: #64748b;
      transition: all 0.2s;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      &:hover {
        border-color: #818cf8;
        color: #818cf8;
      }

      &.selected {
        background: #eef2ff;
        border-color: #818cf8;
        color: #667eea;
      }
    }

    .completar-btn {
      width: 100%;
      padding: 16px;
      border: none;
      border-radius: 10px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;

      &:hover:not(:disabled) {
        opacity: 0.9;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .historial-link {
      display: block;
      text-align: center;
      color: #94a3b8;
      font-size: 14px;
      text-decoration: none;
      transition: color 0.2s;

      &:hover {
        color: #667eea;
      }
    }

    @media (max-width: 1024px) {
      .pos-container {
        grid-template-columns: 1fr;
        height: auto;
        max-height: none;
      }

      .productos-grid {
        max-height: 50vh;
      }
    }
  `]
})
export class PosComponent implements OnInit {
  // Productos
  productos = signal<Producto[]>([]);
  categorias = signal<Categoria[]>([]);
  loadingProductos = signal(true);
  searchTerm = '';
  categoriaFilter: number | null = null;

  // Carrito
  carrito = signal<ProductoCarrito[]>([]);
  descuento = 0;
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia' = 'efectivo';
  procesando = signal(false);

  // Computed
  productosFiltrados = computed(() => {
    const search = this.searchTerm.toLowerCase();
    return this.productos().filter(p => 
      p.nombre.toLowerCase().includes(search) ||
      (p.codigo_barras && p.codigo_barras.toLowerCase().includes(search))
    );
  });

  totalItems = computed(() => 
    this.carrito().reduce((acc, item) => acc + item.cantidad, 0)
  );

  subtotal = computed(() => 
    this.carrito().reduce((acc, item) => acc + Number(item.subtotal), 0)
  );

  total = computed(() => Math.max(0, this.subtotal() - this.descuento));

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private ventaService: VentaService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategorias();
    this.loadProductos();
  }

  loadCategorias(): void {
    this.categoriaService.getAllActive().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.categorias.set(response.data);
        }
      }
    });
  }

  loadProductos(): void {
    this.loadingProductos.set(true);

    this.productoService.getAll({
      limit: 100,
      categoria_id: this.categoriaFilter || undefined
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.productos.set(response.data.filter(p => p.activo));
        }
        this.loadingProductos.set(false);
      },
      error: () => {
        this.loadingProductos.set(false);
      }
    });
  }

  buscarPorCodigo(): void {
    if (!this.searchTerm) return;

    this.productoService.getByBarcode(this.searchTerm).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.agregarAlCarrito(response.data);
          this.searchTerm = '';
        }
      },
      error: () => {
        // Si no encuentra por código, el filtro mostrará resultados
      }
    });
  }

  isInCart(producto: Producto): boolean {
    return this.carrito().some(item => item.id === producto.id);
  }

  agregarAlCarrito(producto: Producto): void {
    if (producto.stock <= 0) {
      this.snackBar.open('Producto sin stock', 'Cerrar', { duration: 2000 });
      return;
    }

    const carritoActual = this.carrito();
    const itemExistente = carritoActual.find(item => item.id === producto.id);

    if (itemExistente) {
      if (itemExistente.cantidad >= producto.stock) {
        this.snackBar.open('Stock insuficiente', 'Cerrar', { duration: 2000 });
        return;
      }
      this.carrito.set(
        carritoActual.map(item =>
          item.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1, subtotal: (item.cantidad + 1) * Number(item.precio_venta) }
            : item
        )
      );
    } else {
      const nuevoItem: ProductoCarrito = {
        ...producto,
        cantidad: 1,
        subtotal: Number(producto.precio_venta)
      };
      this.carrito.set([...carritoActual, nuevoItem]);
    }
  }

  incrementarCantidad(item: ProductoCarrito): void {
    if (item.cantidad >= item.stock) return;

    this.carrito.set(
      this.carrito().map(i =>
        i.id === item.id
          ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.cantidad + 1) * Number(i.precio_venta) }
          : i
      )
    );
  }

  decrementarCantidad(item: ProductoCarrito): void {
    if (item.cantidad <= 1) {
      this.eliminarDelCarrito(item);
      return;
    }

    this.carrito.set(
      this.carrito().map(i =>
        i.id === item.id
          ? { ...i, cantidad: i.cantidad - 1, subtotal: (i.cantidad - 1) * Number(i.precio_venta) }
          : i
      )
    );
  }

  eliminarDelCarrito(item: ProductoCarrito): void {
    this.carrito.set(this.carrito().filter(i => i.id !== item.id));
  }

  limpiarCarrito(): void {
    this.carrito.set([]);
    this.descuento = 0;
  }

  procesarVenta(): void {
    if (this.carrito().length === 0) return;

    this.procesando.set(true);

    const ventaData: CreateVentaRequest = {
      metodo_pago: this.metodoPago,
      descuento: this.descuento,
      productos: this.carrito().map(item => ({
        producto_id: item.id,
        cantidad: item.cantidad
      }))
    };

    this.ventaService.create(ventaData).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('¡Venta registrada con éxito!', 'Cerrar', { 
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.limpiarCarrito();
          this.loadProductos();
        }
        this.procesando.set(false);
      },
      error: (err) => {
        this.snackBar.open(err.message || 'Error al procesar la venta', 'Cerrar', { 
          duration: 3000 
        });
        this.procesando.set(false);
      }
    });
  }
}
