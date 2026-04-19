import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProductoService } from '../../../core/services/producto.service';
import { Producto, MovimientoStock } from '../../../core/models';
import { StockDialogComponent } from './stock-dialog.component';

@Component({
  selector: 'app-producto-detalle',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatTableModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    CurrencyPipe,
    DatePipe
  ],
  template: `
    <div class="detalle-container">
      @if (loading()) {
        <div class="loading-container">
          <mat-spinner></mat-spinner>
        </div>
      } @else if (producto()) {
        <div class="page-header">
          <button mat-icon-button routerLink="/productos">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1>{{ producto()?.nombre }}</h1>
          <div class="header-actions">
            <button mat-stroked-button (click)="openStockDialog()">
              <mat-icon>inventory</mat-icon>
              Ajustar Stock
            </button>
            <button mat-raised-button color="primary" [routerLink]="['/productos', producto()?.id, 'editar']">
              <mat-icon>edit</mat-icon>
              Editar
            </button>
          </div>
        </div>

        <div class="content-grid">
          <!-- Info principal -->
          <mat-card class="info-card">
            <div class="product-header">
              <div class="product-image">
                @if (producto()?.imagen_url) {
                  <img [src]="producto()?.imagen_url" [alt]="producto()?.nombre">
                } @else {
                  <mat-icon>inventory_2</mat-icon>
                }
              </div>
              <div class="product-meta">
                <mat-chip [class]="producto()?.activo ? 'chip-active' : 'chip-inactive'">
                  {{ producto()?.activo ? 'Activo' : 'Inactivo' }}
                </mat-chip>
                @if (producto()?.codigo_barras) {
                  <span class="codigo">{{ producto()?.codigo_barras }}</span>
                }
              </div>
            </div>

            <div class="info-grid">
              <div class="info-item">
                <span class="label">Categoría</span>
                <span class="value">{{ producto()?.categoria_nombre }}</span>
              </div>
              <div class="info-item">
                <span class="label">Precio de Compra</span>
                <span class="value">{{ producto()?.precio_compra | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
              </div>
              <div class="info-item">
                <span class="label">Precio de Venta</span>
                <span class="value precio-venta">{{ producto()?.precio_venta | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
              </div>
              <div class="info-item">
                <span class="label">Margen</span>
                <span class="value margen">{{ getMargin() | currency:'CLP':'symbol-narrow':'1.0-0' }} ({{ getMarginPercent() | number:'1.1-1' }}%)</span>
              </div>
            </div>

            @if (producto()?.descripcion) {
              <div class="descripcion">
                <span class="label">Descripción</span>
                <p>{{ producto()?.descripcion }}</p>
              </div>
            }
          </mat-card>

          <!-- Stock -->
          <mat-card class="stock-card">
            <mat-card-header>
              <mat-card-title>Stock</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="stock-display" [class]="getStockClass()">
                <span class="stock-value">{{ producto()?.stock }}</span>
                <span class="stock-label">unidades</span>
              </div>
              <div class="stock-minimo">
                Stock mínimo: {{ producto()?.stock_minimo }}
              </div>
              @if (producto()!.stock <= producto()!.stock_minimo) {
                <div class="stock-alert">
                  <mat-icon>warning</mat-icon>
                  Stock bajo el mínimo establecido
                </div>
              }
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Historial de movimientos -->
        <mat-card class="history-card">
          <mat-card-header>
            <mat-card-title>Historial de Movimientos</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (movimientos().length > 0) {
              <table mat-table [dataSource]="movimientos()">
                <ng-container matColumnDef="fecha">
                  <th mat-header-cell *matHeaderCellDef>Fecha</th>
                  <td mat-cell *matCellDef="let m">{{ m.created_at | date:'dd/MM/yyyy HH:mm' }}</td>
                </ng-container>
                <ng-container matColumnDef="tipo">
                  <th mat-header-cell *matHeaderCellDef>Tipo</th>
                  <td mat-cell *matCellDef="let m">
                    <mat-chip [class]="'chip-' + m.tipo">{{ m.tipo | titlecase }}</mat-chip>
                  </td>
                </ng-container>
                <ng-container matColumnDef="cantidad">
                  <th mat-header-cell *matHeaderCellDef>Cantidad</th>
                  <td mat-cell *matCellDef="let m">
                    <span [class]="m.tipo === 'salida' ? 'text-red' : 'text-green'">
                      {{ m.tipo === 'salida' ? '-' : '+' }}{{ m.cantidad }}
                    </span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="stock">
                  <th mat-header-cell *matHeaderCellDef>Stock</th>
                  <td mat-cell *matCellDef="let m">{{ m.stock_anterior }} → {{ m.stock_nuevo }}</td>
                </ng-container>
                <ng-container matColumnDef="motivo">
                  <th mat-header-cell *matHeaderCellDef>Motivo</th>
                  <td mat-cell *matCellDef="let m">{{ m.motivo || '-' }}</td>
                </ng-container>
                <ng-container matColumnDef="usuario">
                  <th mat-header-cell *matHeaderCellDef>Usuario</th>
                  <td mat-cell *matCellDef="let m">{{ m.usuario_nombre }}</td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="movimientosColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: movimientosColumns;"></tr>
              </table>
            } @else {
              <p class="no-data">No hay movimientos registrados</p>
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .detalle-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    .page-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;

      h1 {
        flex: 1;
        margin: 0;
      }
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }

    .info-card {
      padding: 24px;
    }

    .product-header {
      display: flex;
      gap: 24px;
      margin-bottom: 24px;
    }

    .product-image {
      width: 120px;
      height: 120px;
      border-radius: 12px;
      overflow: hidden;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #94a3b8;
      }
    }

    .product-meta {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .codigo {
      font-family: monospace;
      color: #64748b;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .label {
        font-size: 12px;
        color: #64748b;
        text-transform: uppercase;
      }

      .value {
        font-size: 18px;
        font-weight: 500;
      }

      .precio-venta {
        color: #22c55e;
      }

      .margen {
        color: #3b82f6;
      }
    }

    .descripcion {
      margin-top: 24px;

      .label {
        font-size: 12px;
        color: #64748b;
        text-transform: uppercase;
        display: block;
        margin-bottom: 8px;
      }

      p {
        color: #475569;
      }
    }

    .stock-card {
      text-align: center;

      mat-card-content {
        padding: 24px;
      }
    }

    .stock-display {
      margin-bottom: 16px;

      &.stock-normal .stock-value { color: #22c55e; }
      &.stock-low .stock-value { color: #f97316; }
      &.stock-critical .stock-value { color: #dc2626; }
    }

    .stock-value {
      font-size: 48px;
      font-weight: 700;
      display: block;
    }

    .stock-label {
      color: #64748b;
    }

    .stock-minimo {
      color: #64748b;
      margin-bottom: 16px;
    }

    .stock-alert {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      background: #fef3c7;
      color: #d97706;
      border-radius: 8px;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .history-card {
      mat-card-content {
        padding: 0;
      }
    }

    table {
      width: 100%;
    }

    .chip-active { background-color: #dcfce7 !important; color: #16a34a !important; }
    .chip-inactive { background-color: #fee2e2 !important; color: #dc2626 !important; }
    .chip-entrada { background-color: #dcfce7 !important; color: #16a34a !important; }
    .chip-salida { background-color: #fee2e2 !important; color: #dc2626 !important; }
    .chip-ajuste { background-color: #dbeafe !important; color: #2563eb !important; }

    .text-red { color: #dc2626; }
    .text-green { color: #22c55e; }

    .no-data {
      padding: 24px;
      text-align: center;
      color: #64748b;
    }

    @media (max-width: 768px) {
      .content-grid {
        grid-template-columns: 1fr;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProductoDetalleComponent implements OnInit {
  producto = signal<Producto | null>(null);
  movimientos = signal<MovimientoStock[]>([]);
  loading = signal(true);
  movimientosColumns = ['fecha', 'tipo', 'cantidad', 'stock', 'motivo', 'usuario'];

  constructor(
    private productoService: ProductoService,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadProducto(parseInt(id));
    }
  }

  loadProducto(id: number): void {
    this.loading.set(true);
    
    this.productoService.getById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.producto.set(response.data);
          this.loadMovimientos(id);
        }
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Error al cargar el producto', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/productos']);
      }
    });
  }

  loadMovimientos(id: number): void {
    this.productoService.getStockHistory(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.movimientos.set(response.data);
        }
      }
    });
  }

  getMargin(): number {
    const p = this.producto();
    if (!p) return 0;
    return p.precio_venta - p.precio_compra;
  }

  getMarginPercent(): number {
    const p = this.producto();
    if (!p || p.precio_compra === 0) return 0;
    return ((p.precio_venta - p.precio_compra) / p.precio_compra) * 100;
  }

  getStockClass(): string {
    const p = this.producto();
    if (!p) return '';
    if (p.stock <= 0) return 'stock-critical';
    if (p.stock <= p.stock_minimo) return 'stock-low';
    return 'stock-normal';
  }

  openStockDialog(): void {
    const dialogRef = this.dialog.open(StockDialogComponent, {
      width: '400px',
      data: { producto: this.producto() }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.productoService.updateStock(this.producto()!.id, result).subscribe({
          next: () => {
            this.snackBar.open('Stock actualizado', 'Cerrar', { duration: 3000 });
            this.loadProducto(this.producto()!.id);
          },
          error: (err) => {
            this.snackBar.open(err.message || 'Error al actualizar stock', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }
}
