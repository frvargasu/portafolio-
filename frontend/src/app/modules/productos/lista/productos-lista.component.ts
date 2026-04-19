import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ProductoService } from '../../../core/services/producto.service';
import { CategoriaService } from '../../../core/services/categoria.service';
import { Producto, Categoria } from '../../../core/models';

@Component({
  selector: 'app-productos-lista',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatMenuModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatCheckboxModule,
    CurrencyPipe
  ],
  template: `
    <div class="productos-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-info">
          <h1>Productos</h1>
          <p class="subtitle">Gestiona el inventario de productos</p>
        </div>
        <button mat-raised-button class="btn-nuevo" routerLink="/productos/nuevo">
          <mat-icon>add</mat-icon>
          Nuevo Producto
        </button>
      </div>

      <!-- Filtros -->
      <div class="filters-row">
        <div class="search-container">
          <input 
            type="text" 
            class="search-input"
            [(ngModel)]="searchTerm" 
            (keyup.enter)="loadProductos()" 
            placeholder="Buscar por nombre o código...">
          <button class="search-btn" (click)="loadProductos()">
            <mat-icon>search</mat-icon>
          </button>
        </div>

        <div class="filter-group">
          <select class="filter-select" [(ngModel)]="categoriaFilter" (change)="loadProductos()">
            <option [ngValue]="null">Todas las categorías</option>
            @for (cat of categorias(); track cat.id) {
              <option [ngValue]="cat.id">{{ cat.nombre }}</option>
            }
          </select>

          <label class="checkbox-filter">
            <input type="checkbox" [(ngModel)]="soloStockBajo" (change)="loadProductos()">
            <span>Solo stock bajo</span>
          </label>
        </div>
      </div>

      <!-- Tabla -->
      <div class="table-container">
        @if (loading()) {
          <div class="loading-container">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
        } @else {
          <table class="productos-table">
            <thead>
              <tr>
                <th>CÓDIGO</th>
                <th>PRODUCTO</th>
                <th>CATEGORÍA</th>
                <th>PRECIO</th>
                <th>STOCK</th>
                <th>ESTADO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              @for (producto of productos(); track producto.id) {
                <tr>
                  <td>
                    <div class="producto-codigo">
                      <div class="producto-img">
                        @if (producto.imagen_url) {
                          <img [src]="producto.imagen_url" [alt]="producto.nombre">
                        } @else {
                          <mat-icon>inventory_2</mat-icon>
                        }
                      </div>
                      <span class="codigo">{{ producto.codigo_barras || '-' }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="producto-info">
                      <strong>{{ producto.nombre }}</strong>
                      <span class="descripcion">{{ producto.descripcion || 'Sin descripción' }}</span>
                    </div>
                  </td>
                  <td>{{ producto.categoria_nombre || 'Sin categoría' }}</td>
                  <td class="precio">{{ producto.precio_venta | currency:'$':'symbol':'1.0-0' }}</td>
                  <td>
                    <div class="stock-cell">
                      <span class="stock-badge" [class]="getStockClass(producto)">
                        {{ producto.stock }}
                      </span>
                      @if (producto.stock <= producto.stock_minimo && producto.stock > 0) {
                        <span class="stock-warning">
                          <mat-icon>warning</mat-icon>
                          Stock bajo
                        </span>
                      }
                    </div>
                  </td>
                  <td>
                    <span class="estado-badge" [class]="producto.activo ? 'activo' : 'inactivo'">
                      {{ producto.activo ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td>
                    <div class="acciones">
                      <button class="action-btn stock" matTooltip="Ver stock" [routerLink]="['/productos', producto.id]">
                        <mat-icon>bar_chart</mat-icon>
                      </button>
                      <button class="action-btn edit" matTooltip="Editar" [routerLink]="['/productos', producto.id, 'editar']">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button class="action-btn delete" matTooltip="Eliminar" (click)="deleteProducto(producto)">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="no-data">
                    <mat-icon>inventory_2</mat-icon>
                    <p>No se encontraron productos</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>

          <!-- Paginación -->
          <div class="pagination">
            <button 
              class="page-btn" 
              [disabled]="currentPage === 1"
              (click)="goToPage(currentPage - 1)">
              ← Anterior
            </button>
            <span class="page-info">
              Página {{ currentPage }} de {{ totalPages() }} ({{ totalItems() }} productos)
            </span>
            <button 
              class="page-btn" 
              [disabled]="currentPage >= totalPages()"
              (click)="goToPage(currentPage + 1)">
              Siguiente →
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .productos-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .header-info h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: #1e293b;
    }

    .subtitle {
      margin: 4px 0 0;
      color: #64748b;
      font-size: 14px;
    }

    .btn-nuevo {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      color: white !important;
      border-radius: 8px;
      padding: 8px 20px;
      font-weight: 500;

      mat-icon {
        margin-right: 8px;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    /* Filtros */
    .filters-row {
      display: flex;
      gap: 16px;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .search-container {
      display: flex;
      flex: 1;
      max-width: 400px;
    }

    .search-input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid #e2e8f0;
      border-right: none;
      border-radius: 8px 0 0 8px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;

      &:focus {
        border-color: #667eea;
      }

      &::placeholder {
        color: #94a3b8;
      }
    }

    .search-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 0 16px;
      border-radius: 0 8px 8px 0;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .filter-group {
      display: flex;
      gap: 16px;
      align-items: center;
    }

    .filter-select {
      padding: 12px 16px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 14px;
      background: white;
      min-width: 180px;
      outline: none;
      cursor: pointer;

      &:focus {
        border-color: #667eea;
      }
    }

    .checkbox-filter {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      color: #475569;
      font-size: 14px;

      input {
        width: 18px;
        height: 18px;
        accent-color: #667eea;
      }
    }

    /* Tabla */
    .table-container {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 60px;
    }

    .productos-table {
      width: 100%;
      border-collapse: collapse;
    }

    .productos-table thead {
      background: #f8fafc;
    }

    .productos-table th {
      padding: 16px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #e2e8f0;
    }

    .productos-table td {
      padding: 16px;
      border-bottom: 1px solid #f1f5f9;
      color: #475569;
      font-size: 14px;
    }

    .productos-table tbody tr {
      transition: background 0.2s;

      &:hover {
        background: #f8fafc;
      }

      &:last-child td {
        border-bottom: none;
      }
    }

    .producto-codigo {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .producto-img {
      width: 44px;
      height: 44px;
      border-radius: 8px;
      overflow: hidden;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      mat-icon {
        color: #94a3b8;
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }

    .codigo {
      font-family: 'SF Mono', 'Consolas', monospace;
      font-size: 13px;
      color: #64748b;
    }

    .producto-info {
      display: flex;
      flex-direction: column;
      gap: 2px;

      strong {
        color: #1e293b;
        font-weight: 600;
      }

      .descripcion {
        font-size: 13px;
        color: #94a3b8;
      }
    }

    .precio {
      font-weight: 600;
      color: #1e293b;
    }

    .stock-cell {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }

    .stock-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 36px;
      padding: 6px 12px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;

      &.stock-normal {
        background: #dcfce7;
        color: #16a34a;
      }

      &.stock-low {
        background: #fef3c7;
        color: #d97706;
      }

      &.stock-critical {
        background: #fee2e2;
        color: #dc2626;
      }
    }

    .stock-warning {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: #f97316;

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    }

    .estado-badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;

      &.activo {
        background: #dcfce7;
        color: #16a34a;
      }

      &.inactivo {
        background: #fee2e2;
        color: #dc2626;
      }
    }

    .acciones {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      &.stock {
        background: #e0f2fe;
        color: #0284c7;

        &:hover {
          background: #0284c7;
          color: white;
        }
      }

      &.edit {
        background: #fef3c7;
        color: #d97706;

        &:hover {
          background: #d97706;
          color: white;
        }
      }

      &.delete {
        background: #fee2e2;
        color: #dc2626;

        &:hover {
          background: #dc2626;
          color: white;
        }
      }
    }

    .no-data {
      text-align: center;
      padding: 60px 20px;
      color: #94a3b8;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 16px;
        display: block;
        margin-left: auto;
        margin-right: auto;
      }

      p {
        margin: 0;
      }
    }

    /* Paginación */
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 24px;
      padding: 20px;
      border-top: 1px solid #f1f5f9;
    }

    .page-btn {
      background: none;
      border: none;
      color: #64748b;
      font-size: 14px;
      cursor: pointer;
      padding: 8px 16px;
      border-radius: 6px;
      transition: all 0.2s;

      &:hover:not(:disabled) {
        background: #f1f5f9;
        color: #1e293b;
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }

    .page-info {
      color: #64748b;
      font-size: 14px;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .filters-row {
        flex-direction: column;
        align-items: stretch;
      }

      .search-container {
        max-width: none;
      }

      .filter-group {
        flex-wrap: wrap;
      }
    }

    @media (max-width: 768px) {
      .productos-container {
        padding: 16px;
      }

      .page-header {
        flex-direction: column;
        gap: 16px;
      }

      .btn-nuevo {
        width: 100%;
        justify-content: center;
      }

      .productos-table {
        display: block;
        overflow-x: auto;
      }
    }
  `]
})
export class ProductosListaComponent implements OnInit {
  productos = signal<Producto[]>([]);
  categorias = signal<Categoria[]>([]);
  loading = signal(true);
  totalItems = signal(0);
  
  pageSize = 10;
  currentPage = 1;
  searchTerm = '';
  categoriaFilter: number | null = null;
  soloStockBajo = false;

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCategorias();
    this.loadProductos();
  }

  totalPages(): number {
    return Math.ceil(this.totalItems() / this.pageSize) || 1;
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
    this.loading.set(true);

    this.productoService.getAll({
      page: this.currentPage,
      limit: this.pageSize,
      search: this.searchTerm || undefined,
      categoria_id: this.categoriaFilter || undefined
    }).subscribe({
      next: (response) => {
        if (response.success) {
          let data = response.data;
          // Filtrar por stock bajo si está activado
          if (this.soloStockBajo) {
            data = data.filter(p => p.stock <= p.stock_minimo);
          }
          this.productos.set(data);
          this.totalItems.set(this.soloStockBajo ? data.length : response.pagination.total);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage = page;
      this.loadProductos();
    }
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadProductos();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.categoriaFilter = null;
    this.soloStockBajo = false;
    this.currentPage = 1;
    this.loadProductos();
  }

  getStockClass(producto: Producto): string {
    if (producto.stock <= 0) return 'stock-critical';
    if (producto.stock <= producto.stock_minimo) return 'stock-low';
    return 'stock-normal';
  }

  deleteProducto(producto: Producto): void {
    if (confirm(`¿Eliminar el producto "${producto.nombre}"?`)) {
      this.productoService.delete(producto.id).subscribe({
        next: () => {
          this.snackBar.open('Producto eliminado', 'Cerrar', { duration: 3000 });
          this.loadProductos();
        },
        error: (err) => {
          this.snackBar.open(err.message || 'Error al eliminar', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }
}
