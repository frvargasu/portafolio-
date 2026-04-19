import { Component, OnInit, signal, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { Chart, registerables } from 'chart.js';
import { ReporteService } from '../../core/services/reporte.service';
import { Dashboard, ProductoMasVendido, Producto } from '../../core/models';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTableModule,
    CurrencyPipe
  ],
  template: `
    <div class="dashboard">
      <div class="page-header">
        <h1>Dashboard</h1>
        <button mat-raised-button color="primary" routerLink="/pos">
          <mat-icon>add</mat-icon>
          Nueva Venta
        </button>
      </div>

      @if (loading()) {
        <div class="loading-container">
          <mat-spinner></mat-spinner>
        </div>
      } @else {
        <!-- Tarjetas de métricas -->
        <div class="metrics-grid">
          <mat-card class="metric-card">
            <div class="metric-icon blue">
              <mat-icon>today</mat-icon>
            </div>
            <div class="metric-content">
              <span class="metric-label">Ventas Hoy</span>
              <span class="metric-value">{{ dashboard()?.ventas_hoy | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
            </div>
          </mat-card>

          <mat-card class="metric-card">
            <div class="metric-icon green">
              <mat-icon>date_range</mat-icon>
            </div>
            <div class="metric-content">
              <span class="metric-label">Ventas Semana</span>
              <span class="metric-value">{{ dashboard()?.ventas_semana | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
            </div>
          </mat-card>

          <mat-card class="metric-card">
            <div class="metric-icon purple">
              <mat-icon>calendar_month</mat-icon>
            </div>
            <div class="metric-content">
              <span class="metric-label">Ventas Mes</span>
              <span class="metric-value">{{ dashboard()?.ventas_mes | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
            </div>
          </mat-card>

          <mat-card class="metric-card">
            <div class="metric-icon orange">
              <mat-icon>inventory_2</mat-icon>
            </div>
            <div class="metric-content">
              <span class="metric-label">Total Productos</span>
              <span class="metric-value">{{ dashboard()?.total_productos }}</span>
            </div>
          </mat-card>
        </div>

        <!-- Contenido principal -->
        <div class="content-grid">
          <!-- Gráfico de ventas -->
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>Ventas por Día</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <canvas #salesChart></canvas>
            </mat-card-content>
          </mat-card>

          <!-- Productos más vendidos -->
          <mat-card class="top-products-card">
            <mat-card-header>
              <mat-card-title>Top 5 Productos</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              @if (dashboard()?.productos_mas_vendidos?.length) {
                <div class="product-list">
                  @for (producto of dashboard()?.productos_mas_vendidos; track producto.producto_id; let i = $index) {
                    <div class="product-item">
                      <span class="product-rank">{{ i + 1 }}</span>
                      <div class="product-info">
                        <span class="product-name">{{ producto.nombre }}</span>
                        <span class="product-sales">{{ producto.cantidad_vendida }} vendidos</span>
                      </div>
                      <span class="product-total">{{ producto.total_ventas | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
                    </div>
                  }
                </div>
              } @else {
                <p class="no-data">No hay ventas registradas</p>
              }
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Alertas de stock bajo -->
        @if (productosBajoStock().length > 0) {
          <mat-card class="alert-card">
            <mat-card-header>
              <mat-icon class="alert-icon">warning</mat-icon>
              <mat-card-title>Productos con Stock Bajo ({{ productosBajoStock().length }})</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <table mat-table [dataSource]="productosBajoStock()" class="stock-table">
                <ng-container matColumnDef="nombre">
                  <th mat-header-cell *matHeaderCellDef>Producto</th>
                  <td mat-cell *matCellDef="let p">{{ p.nombre }}</td>
                </ng-container>
                <ng-container matColumnDef="stock">
                  <th mat-header-cell *matHeaderCellDef>Stock Actual</th>
                  <td mat-cell *matCellDef="let p">
                    <span class="stock-badge low">{{ p.stock }}</span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="stock_minimo">
                  <th mat-header-cell *matHeaderCellDef>Stock Mínimo</th>
                  <td mat-cell *matCellDef="let p">{{ p.stock_minimo }}</td>
                </ng-container>
                <ng-container matColumnDef="acciones">
                  <th mat-header-cell *matHeaderCellDef>Acciones</th>
                  <td mat-cell *matCellDef="let p">
                    <button mat-button color="primary" [routerLink]="['/productos', p.id]">
                      Ver Producto
                    </button>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="stockColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: stockColumns;"></tr>
              </table>
            </mat-card-content>
          </mat-card>
        }

        <!-- Accesos rápidos -->
        <div class="quick-actions">
          <h2>Accesos Rápidos</h2>
          <div class="actions-grid">
            <button mat-raised-button color="primary" routerLink="/pos">
              <mat-icon>point_of_sale</mat-icon>
              Nueva Venta
            </button>
            <button mat-raised-button routerLink="/productos/nuevo">
              <mat-icon>add_box</mat-icon>
              Nuevo Producto
            </button>
            <button mat-raised-button routerLink="/categorias">
              <mat-icon>category</mat-icon>
              Categorías
            </button>
            <button mat-raised-button routerLink="/ventas">
              <mat-icon>receipt_long</mat-icon>
              Historial
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard {
      max-width: 1400px;
      margin: 0 auto;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 24px;
      margin-bottom: 24px;
    }

    .metric-card {
      display: flex;
      align-items: center;
      padding: 24px;
      gap: 16px;
    }

    .metric-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        color: white;
        font-size: 28px;
        width: 28px;
        height: 28px;
      }

      &.blue { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
      &.green { background: linear-gradient(135deg, #22c55e, #16a34a); }
      &.purple { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
      &.orange { background: linear-gradient(135deg, #f97316, #ea580c); }
    }

    .metric-content {
      display: flex;
      flex-direction: column;
    }

    .metric-label {
      font-size: 14px;
      color: #64748b;
    }

    .metric-value {
      font-size: 28px;
      font-weight: 700;
      color: #1e293b;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }

    .chart-card {
      mat-card-content {
        padding: 16px;
        height: 300px;
      }
    }

    .top-products-card {
      mat-card-content {
        padding: 0;
      }
    }

    .product-list {
      display: flex;
      flex-direction: column;
    }

    .product-item {
      display: flex;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid #e2e8f0;
      gap: 12px;

      &:last-child {
        border-bottom: none;
      }
    }

    .product-rank {
      width: 28px;
      height: 28px;
      background: #3b82f6;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
    }

    .product-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .product-name {
      font-weight: 500;
      color: #1e293b;
    }

    .product-sales {
      font-size: 12px;
      color: #64748b;
    }

    .product-total {
      font-weight: 600;
      color: #22c55e;
    }

    .no-data {
      padding: 24px;
      text-align: center;
      color: #64748b;
    }

    .alert-card {
      margin-bottom: 24px;
      border-left: 4px solid #f97316;

      mat-card-header {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .alert-icon {
        color: #f97316;
      }
    }

    .stock-table {
      width: 100%;
    }

    .stock-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-weight: 500;

      &.low {
        background: #fef2f2;
        color: #dc2626;
      }
    }

    .quick-actions {
      h2 {
        font-size: 18px;
        margin-bottom: 16px;
        color: #1e293b;
      }
    }

    .actions-grid {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;

      button {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }

    @media (max-width: 1024px) {
      .content-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('salesChart') salesChartRef!: ElementRef<HTMLCanvasElement>;
  
  loading = signal(true);
  dashboard = signal<Dashboard | null>(null);
  productosBajoStock = signal<Producto[]>([]);
  stockColumns = ['nombre', 'stock', 'stock_minimo', 'acciones'];
  
  private chart: Chart | null = null;

  constructor(private reporteService: ReporteService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngAfterViewInit(): void {
    // Chart se inicializa después de cargar datos
  }

  loadDashboard(): void {
    this.loading.set(true);

    this.reporteService.getDashboard().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.dashboard.set(response.data);
          setTimeout(() => this.initChart(), 100);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });

    this.reporteService.getProductosBajoStock().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.productosBajoStock.set(response.data);
        }
      }
    });
  }

  private initChart(): void {
    if (!this.salesChartRef?.nativeElement) return;

    const ventasPorDia = this.dashboard()?.ventas_por_dia || [];
    
    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(this.salesChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: ventasPorDia.map(v => this.formatDate(v.fecha)),
        datasets: [{
          label: 'Ventas ($)',
          data: ventasPorDia.map(v => v.total),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => '$' + value.toLocaleString()
            }
          }
        }
      }
    });
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric' });
  }
}
