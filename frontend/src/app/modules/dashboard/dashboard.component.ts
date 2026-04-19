import { Component, OnInit, signal, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { Chart, registerables } from 'chart.js';
import { ReporteService, VentaMetodoPago, VentaCategoria } from '../../core/services/reporte.service';
import { Dashboard, Producto } from '../../core/models';
import { forkJoin } from 'rxjs';

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
        <div>
          <h1>Dashboard</h1>
          <p class="subtitle">Resumen de tu negocio</p>
        </div>
        <button mat-raised-button color="primary" routerLink="/pos" class="new-sale-btn">
          <mat-icon>point_of_sale</mat-icon>
          Nueva Venta
        </button>
      </div>

      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="48"></mat-spinner>
          <p>Cargando datos...</p>
        </div>
      } @else {
        <!-- Tarjetas de métricas -->
        <div class="metrics-grid">
          <mat-card class="metric-card animate-in" style="--delay: 0">
            <div class="metric-icon blue">
              <mat-icon>payments</mat-icon>
            </div>
            <div class="metric-content">
              <span class="metric-label">Ventas Hoy</span>
              <span class="metric-value">{{ dashboard()?.ventas_hoy | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
            </div>
          </mat-card>

          <mat-card class="metric-card animate-in" style="--delay: 1">
            <div class="metric-icon green">
              <mat-icon>calendar_view_week</mat-icon>
            </div>
            <div class="metric-content">
              <span class="metric-label">Ventas Semana</span>
              <span class="metric-value">{{ dashboard()?.ventas_semana | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
            </div>
          </mat-card>

          <mat-card class="metric-card animate-in" style="--delay: 2">
            <div class="metric-icon purple">
              <mat-icon>calendar_month</mat-icon>
            </div>
            <div class="metric-content">
              <span class="metric-label">Ventas Mes</span>
              <span class="metric-value">{{ dashboard()?.ventas_mes | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
            </div>
          </mat-card>

          <mat-card class="metric-card animate-in" style="--delay: 3">
            <div class="metric-icon orange">
              <mat-icon>inventory_2</mat-icon>
            </div>
            <div class="metric-content">
              <span class="metric-label">Productos</span>
              <span class="metric-value">{{ dashboard()?.total_productos }}</span>
              @if (productosBajoStock().length > 0) {
                <span class="metric-badge warning">{{ productosBajoStock().length }} bajo stock</span>
              }
            </div>
          </mat-card>
        </div>

        <!-- Grid de gráficos -->
        <div class="charts-grid">
          <!-- Gráfico de barras - Ventas por día -->
          <mat-card class="chart-card animate-in" style="--delay: 4">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>bar_chart</mat-icon>
                Ventas Últimos 7 Días
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <canvas #salesChart></canvas>
            </mat-card-content>
          </mat-card>

          <!-- Gráfico de dona - Métodos de pago -->
          <mat-card class="chart-card doughnut-card animate-in" style="--delay: 5">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>pie_chart</mat-icon>
                Métodos de Pago
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="doughnut-container">
                <canvas #paymentChart></canvas>
                <div class="doughnut-center">
                  <span class="center-value">{{ ventasMetodo().length }}</span>
                  <span class="center-label">Métodos</span>
                </div>
              </div>
              <div class="chart-legend">
                @for (item of ventasMetodo(); track item.metodo_pago) {
                  <div class="legend-item">
                    <span class="legend-color" [style.background]="getPaymentColor(item.metodo_pago)"></span>
                    <span class="legend-label">{{ formatPaymentMethod(item.metodo_pago) }}</span>
                    <span class="legend-value">{{ item.total | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Gráfico de dona - Ventas por categoría -->
          <mat-card class="chart-card doughnut-card animate-in" style="--delay: 6">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>donut_large</mat-icon>
                Ventas por Categoría
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="doughnut-container">
                <canvas #categoryChart></canvas>
                <div class="doughnut-center">
                  <span class="center-value">{{ ventasCategoria().length }}</span>
                  <span class="center-label">Categorías</span>
                </div>
              </div>
              <div class="chart-legend">
                @for (item of ventasCategoria(); track item.categoria; let i = $index) {
                  <div class="legend-item">
                    <span class="legend-color" [style.background]="getCategoryColor(i)"></span>
                    <span class="legend-label">{{ item.categoria }}</span>
                    <span class="legend-value">{{ item.total | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Top productos -->
          <mat-card class="top-products-card animate-in" style="--delay: 7">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>emoji_events</mat-icon>
                Top 5 Productos
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              @if (dashboard()?.productos_mas_vendidos?.length) {
                <div class="product-list">
                  @for (producto of dashboard()?.productos_mas_vendidos; track producto.producto_id; let i = $index) {
                    <div class="product-item" [class]="'rank-' + (i + 1)">
                      <div class="product-rank">
                        @if (i === 0) {
                          <mat-icon class="trophy gold">emoji_events</mat-icon>
                        } @else if (i === 1) {
                          <mat-icon class="trophy silver">emoji_events</mat-icon>
                        } @else if (i === 2) {
                          <mat-icon class="trophy bronze">emoji_events</mat-icon>
                        } @else {
                          <span class="rank-number">{{ i + 1 }}</span>
                        }
                      </div>
                      <div class="product-info">
                        <span class="product-name">{{ producto.nombre }}</span>
                        <div class="product-stats">
                          <span class="product-sales">
                            <mat-icon>shopping_cart</mat-icon>
                            {{ producto.cantidad_vendida }} vendidos
                          </span>
                        </div>
                      </div>
                      <span class="product-total">{{ producto.total_ventas | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
                    </div>
                  }
                </div>
              } @else {
                <div class="no-data">
                  <mat-icon>inbox</mat-icon>
                  <p>No hay ventas registradas</p>
                </div>
              }
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Alertas de stock bajo -->
        @if (productosBajoStock().length > 0) {
          <mat-card class="alert-card animate-in" style="--delay: 8">
            <mat-card-header>
              <div class="alert-header">
                <mat-icon class="alert-icon pulse">warning</mat-icon>
                <mat-card-title>Productos con Stock Bajo</mat-card-title>
                <span class="alert-count">{{ productosBajoStock().length }}</span>
              </div>
            </mat-card-header>
            <mat-card-content>
              <div class="stock-grid">
                @for (p of productosBajoStock().slice(0, 6); track p.id) {
                  <div class="stock-item">
                    <div class="stock-info">
                      <span class="stock-name">{{ p.nombre }}</span>
                      <div class="stock-bar">
                        <div class="stock-fill" [style.width.%]="getStockPercentage(p)"></div>
                      </div>
                    </div>
                    <div class="stock-numbers">
                      <span class="current">{{ p.stock }}</span>
                      <span class="separator">/</span>
                      <span class="minimum">{{ p.stock_minimo }}</span>
                    </div>
                  </div>
                }
              </div>
              @if (productosBajoStock().length > 6) {
                <button mat-button color="primary" routerLink="/productos" class="view-all">
                  Ver todos ({{ productosBajoStock().length - 6 }} más)
                  <mat-icon>arrow_forward</mat-icon>
                </button>
              }
            </mat-card-content>
          </mat-card>
        }

        <!-- Accesos rápidos -->
        <div class="quick-actions animate-in" style="--delay: 9">
          <h2>Accesos Rápidos</h2>
          <div class="actions-grid">
            <button mat-raised-button color="primary" routerLink="/pos" class="action-btn">
              <mat-icon>point_of_sale</mat-icon>
              <span>Nueva Venta</span>
            </button>
            <button mat-raised-button routerLink="/productos/nuevo" class="action-btn">
              <mat-icon>add_box</mat-icon>
              <span>Nuevo Producto</span>
            </button>
            <button mat-raised-button routerLink="/categorias" class="action-btn">
              <mat-icon>category</mat-icon>
              <span>Categorías</span>
            </button>
            <button mat-raised-button routerLink="/ventas" class="action-btn">
              <mat-icon>receipt_long</mat-icon>
              <span>Historial</span>
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
      padding-bottom: 32px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 700;
        color: #1e293b;
      }

      .subtitle {
        margin: 4px 0 0;
        color: #64748b;
        font-size: 14px;
      }

      .new-sale-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 24px;
        font-size: 15px;
        border-radius: 12px;
      }
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 64px;
      gap: 16px;
      color: #64748b;
    }

    /* Animaciones */
    .animate-in {
      animation: slideIn 0.5s ease-out forwards;
      animation-delay: calc(var(--delay) * 0.1s);
      opacity: 0;
      transform: translateY(20px);
    }

    @keyframes slideIn {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Métricas */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }

    .metric-card {
      display: flex;
      align-items: center;
      padding: 24px;
      gap: 16px;
      border-radius: 16px;
      transition: transform 0.2s, box-shadow 0.2s;
      border: 1px solid #e2e8f0;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px rgba(0,0,0,0.1);
      }
    }

    .metric-icon {
      width: 60px;
      height: 60px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

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
      flex: 1;
    }

    .metric-label {
      font-size: 13px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .metric-value {
      font-size: 28px;
      font-weight: 700;
      color: #1e293b;
      line-height: 1.2;
    }

    .metric-badge {
      margin-top: 4px;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 600;
      width: fit-content;

      &.warning {
        background: #fef3c7;
        color: #d97706;
      }
    }

    /* Grid de gráficos */
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 24px;
    }

    .chart-card {
      border-radius: 16px;
      border: 1px solid #e2e8f0;

      mat-card-header {
        padding: 20px 20px 0;
      }

      mat-card-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 600;
        color: #1e293b;

        mat-icon {
          color: #64748b;
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }

      mat-card-content {
        padding: 20px;
        height: 280px;
      }
    }

    .doughnut-card {
      mat-card-content {
        display: flex;
        flex-direction: column;
        height: auto;
        min-height: 320px;
      }
    }

    .doughnut-container {
      position: relative;
      height: 180px;
      display: flex;
      align-items: center;
      justify-content: center;

      canvas {
        max-height: 180px;
      }
    }

    .doughnut-center {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      pointer-events: none;

      .center-value {
        font-size: 28px;
        font-weight: 700;
        color: #1e293b;
      }

      .center-label {
        font-size: 11px;
        color: #64748b;
      }
    }

    .chart-legend {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 3px;
      flex-shrink: 0;
    }

    .legend-label {
      flex: 1;
      font-size: 13px;
      color: #475569;
    }

    .legend-value {
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
    }

    /* Top productos */
    .top-products-card {
      grid-column: span 2;
      border-radius: 16px;
      border: 1px solid #e2e8f0;

      mat-card-header {
        padding: 20px 20px 0;
      }

      mat-card-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 600;

        mat-icon {
          color: #f59e0b;
        }
      }

      mat-card-content {
        padding: 8px 0;
      }
    }

    .product-list {
      display: flex;
      flex-direction: column;
    }

    .product-item {
      display: flex;
      align-items: center;
      padding: 16px 20px;
      gap: 16px;
      border-bottom: 1px solid #f1f5f9;
      transition: background 0.2s;

      &:hover {
        background: #f8fafc;
      }

      &:last-child {
        border-bottom: none;
      }
    }

    .product-rank {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .trophy {
      font-size: 28px;
      width: 28px;
      height: 28px;

      &.gold { color: #fbbf24; }
      &.silver { color: #94a3b8; }
      &.bronze { color: #d97706; }
    }

    .rank-number {
      width: 28px;
      height: 28px;
      background: #e2e8f0;
      color: #64748b;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
    }

    .product-info {
      flex: 1;
      min-width: 0;
    }

    .product-name {
      font-weight: 600;
      color: #1e293b;
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .product-stats {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 4px;
    }

    .product-sales {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #64748b;

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    }

    .product-total {
      font-weight: 700;
      font-size: 16px;
      color: #22c55e;
    }

    .no-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px;
      color: #94a3b8;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 8px;
      }
    }

    /* Alertas stock */
    .alert-card {
      margin-bottom: 24px;
      border-radius: 16px;
      border: 1px solid #fed7aa;
      background: linear-gradient(135deg, #fffbeb, #fff7ed);

      mat-card-header {
        padding: 20px 20px 0;
      }

      mat-card-content {
        padding: 20px;
      }
    }

    .alert-header {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
    }

    .alert-icon {
      color: #f97316;
      font-size: 24px;
    }

    .pulse {
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .alert-count {
      margin-left: auto;
      background: #f97316;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
    }

    .stock-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }

    .stock-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 16px;
      background: white;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }

    .stock-info {
      flex: 1;
      min-width: 0;
    }

    .stock-name {
      font-weight: 500;
      color: #1e293b;
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 8px;
    }

    .stock-bar {
      height: 6px;
      background: #e2e8f0;
      border-radius: 3px;
      overflow: hidden;
    }

    .stock-fill {
      height: 100%;
      background: linear-gradient(90deg, #ef4444, #f97316);
      border-radius: 3px;
      transition: width 0.5s ease;
    }

    .stock-numbers {
      display: flex;
      align-items: baseline;
      gap: 2px;
      font-size: 14px;

      .current {
        font-weight: 700;
        color: #ef4444;
        font-size: 18px;
      }

      .separator {
        color: #cbd5e1;
      }

      .minimum {
        color: #64748b;
      }
    }

    .view-all {
      margin-top: 16px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* Accesos rápidos */
    .quick-actions {
      h2 {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 16px;
        color: #1e293b;
      }
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
    }

    .action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 20px 16px;
      border-radius: 12px;
      font-size: 13px;

      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .charts-grid {
        grid-template-columns: 1fr;
      }

      .top-products-card {
        grid-column: span 1;
      }
    }

    @media (max-width: 600px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;

        .new-sale-btn {
          width: 100%;
          justify-content: center;
        }
      }
    }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('salesChart') salesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('paymentChart') paymentChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryChart') categoryChartRef!: ElementRef<HTMLCanvasElement>;
  
  loading = signal(true);
  dashboard = signal<Dashboard | null>(null);
  productosBajoStock = signal<Producto[]>([]);
  ventasMetodo = signal<VentaMetodoPago[]>([]);
  ventasCategoria = signal<VentaCategoria[]>([]);
  stockColumns = ['nombre', 'stock', 'stock_minimo', 'acciones'];
  
  private salesChart: Chart | null = null;
  private paymentChart: Chart | null = null;
  private categoryChart: Chart | null = null;

  private paymentColors: Record<string, string> = {
    'efectivo': '#22c55e',
    'tarjeta': '#3b82f6',
    'transferencia': '#8b5cf6',
    'debito': '#f59e0b',
    'credito': '#ec4899'
  };

  private categoryColors = [
    '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'
  ];

  constructor(private reporteService: ReporteService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngAfterViewInit(): void {}

  loadDashboard(): void {
    this.loading.set(true);

    forkJoin({
      dashboard: this.reporteService.getDashboard(),
      bajoStock: this.reporteService.getProductosBajoStock(),
      ventasMetodo: this.reporteService.getVentasPorMetodoPago(),
      ventasCategoria: this.reporteService.getVentasPorCategoria()
    }).subscribe({
      next: ({ dashboard, bajoStock, ventasMetodo, ventasCategoria }) => {
        if (dashboard.success && dashboard.data) {
          this.dashboard.set(dashboard.data);
        }
        if (bajoStock.success && bajoStock.data) {
          this.productosBajoStock.set(bajoStock.data);
        }
        if (ventasMetodo.success && ventasMetodo.data) {
          this.ventasMetodo.set(ventasMetodo.data);
        }
        if (ventasCategoria.success && ventasCategoria.data) {
          this.ventasCategoria.set(ventasCategoria.data);
        }

        setTimeout(() => this.initCharts(), 100);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private initCharts(): void {
    this.initSalesChart();
    this.initPaymentChart();
    this.initCategoryChart();
  }

  private initSalesChart(): void {
    if (!this.salesChartRef?.nativeElement) return;

    const ventasPorDia = this.dashboard()?.ventas_por_dia || [];
    
    if (this.salesChart) {
      this.salesChart.destroy();
    }

    this.salesChart = new Chart(this.salesChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: ventasPorDia.map(v => this.formatDate(v.fecha)),
        datasets: [{
          label: 'Ventas',
          data: ventasPorDia.map(v => v.total),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 0,
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#f1f5f9' },
            ticks: {
              callback: (value) => '$' + Number(value).toLocaleString()
            }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }

  private initPaymentChart(): void {
    if (!this.paymentChartRef?.nativeElement) return;

    const data = this.ventasMetodo();
    
    if (this.paymentChart) {
      this.paymentChart.destroy();
    }

    this.paymentChart = new Chart(this.paymentChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: data.map(d => this.formatPaymentMethod(d.metodo_pago)),
        datasets: [{
          data: data.map(d => d.total),
          backgroundColor: data.map(d => this.getPaymentColor(d.metodo_pago)),
          borderWidth: 0,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  private initCategoryChart(): void {
    if (!this.categoryChartRef?.nativeElement) return;

    const data = this.ventasCategoria();
    
    if (this.categoryChart) {
      this.categoryChart.destroy();
    }

    this.categoryChart = new Chart(this.categoryChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.categoria),
        datasets: [{
          data: data.map(d => d.total),
          backgroundColor: data.map((_, i) => this.getCategoryColor(i)),
          borderWidth: 0,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  getPaymentColor(method: string): string {
    return this.paymentColors[method.toLowerCase()] || '#94a3b8';
  }

  getCategoryColor(index: number): string {
    return this.categoryColors[index % this.categoryColors.length];
  }

  formatPaymentMethod(method: string): string {
    const names: Record<string, string> = {
      'efectivo': 'Efectivo',
      'tarjeta': 'Tarjeta',
      'transferencia': 'Transferencia',
      'debito': 'Débito',
      'credito': 'Crédito'
    };
    return names[method.toLowerCase()] || method;
  }

  getStockPercentage(p: Producto): number {
    if (!p.stock_minimo || p.stock_minimo === 0) return 0;
    return Math.min((p.stock / p.stock_minimo) * 100, 100);
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric' });
  }
}
