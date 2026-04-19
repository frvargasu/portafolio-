import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { VentaService } from '../../../core/services/venta.service';
import { Venta } from '../../../core/models';

@Component({
  selector: 'app-venta-detalle',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTableModule,
    MatDividerModule,
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
      } @else if (venta()) {
        <div class="page-header">
          <button mat-icon-button routerLink="/ventas">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1>Venta #{{ venta()?.id }}</h1>
          <div class="header-actions">
            @if (venta()?.estado === 'completada') {
              <button mat-stroked-button color="warn" (click)="cancelar()">
                <mat-icon>cancel</mat-icon>
                Cancelar Venta
              </button>
            }
          </div>
        </div>

        <div class="content-grid">
          <!-- Info de la venta -->
          <mat-card class="info-card">
            <mat-card-header>
              <mat-card-title>Información de la Venta</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">Fecha</span>
                  <span class="value">{{ venta()?.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Vendedor</span>
                  <span class="value">{{ venta()?.usuario_nombre }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Método de Pago</span>
                  <span class="value">
                    <mat-icon>{{ getMetodoPagoIcon() }}</mat-icon>
                    {{ venta()?.metodo_pago | titlecase }}
                  </span>
                </div>
                <div class="info-item">
                  <span class="label">Estado</span>
                  <mat-chip [class]="'chip-' + venta()?.estado">
                    {{ venta()?.estado | titlecase }}
                  </mat-chip>
                </div>
              </div>

              @if (venta()?.observaciones) {
                <div class="observaciones">
                  <span class="label">Observaciones</span>
                  <p>{{ venta()?.observaciones }}</p>
                </div>
              }
            </mat-card-content>
          </mat-card>

          <!-- Resumen -->
          <mat-card class="resumen-card">
            <mat-card-header>
              <mat-card-title>Resumen</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="resumen-row">
                <span>Subtotal</span>
                <span>{{ venta()?.subtotal | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
              </div>
              @if (venta()?.descuento && venta()!.descuento > 0) {
                <div class="resumen-row descuento">
                  <span>Descuento</span>
                  <span>-{{ venta()?.descuento | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
                </div>
              }
              <mat-divider></mat-divider>
              <div class="resumen-row total">
                <span>Total</span>
                <span>{{ venta()?.total | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Detalle de productos -->
        <mat-card class="productos-card">
          <mat-card-header>
            <mat-card-title>Productos</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="venta()?.detalles || []">
              <ng-container matColumnDef="producto">
                <th mat-header-cell *matHeaderCellDef>Producto</th>
                <td mat-cell *matCellDef="let d">{{ d.producto_nombre }}</td>
              </ng-container>

              <ng-container matColumnDef="precio">
                <th mat-header-cell *matHeaderCellDef>Precio Unit.</th>
                <td mat-cell *matCellDef="let d">{{ d.precio_unitario | currency:'CLP':'symbol-narrow':'1.0-0' }}</td>
              </ng-container>

              <ng-container matColumnDef="cantidad">
                <th mat-header-cell *matHeaderCellDef>Cantidad</th>
                <td mat-cell *matCellDef="let d">{{ d.cantidad }}</td>
              </ng-container>

              <ng-container matColumnDef="subtotal">
                <th mat-header-cell *matHeaderCellDef>Subtotal</th>
                <td mat-cell *matCellDef="let d">
                  <strong>{{ d.subtotal | currency:'CLP':'symbol-narrow':'1.0-0' }}</strong>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="detalleColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: detalleColumns;"></tr>
            </table>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .detalle-container {
      max-width: 1000px;
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

    .content-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }

    .info-card mat-card-content {
      padding: 24px;
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
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          color: #64748b;
        }
      }
    }

    .observaciones {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;

      .label {
        font-size: 12px;
        color: #64748b;
        text-transform: uppercase;
        display: block;
        margin-bottom: 8px;
      }

      p {
        color: #475569;
        margin: 0;
      }
    }

    .resumen-card mat-card-content {
      padding: 24px;
    }

    .resumen-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      color: #64748b;

      &.descuento {
        color: #dc2626;
      }

      &.total {
        font-size: 20px;
        font-weight: 700;
        color: #1e293b;
        padding-top: 16px;
      }
    }

    mat-divider {
      margin: 8px 0;
    }

    .productos-card {
      mat-card-content {
        padding: 0;
      }
    }

    table {
      width: 100%;
    }

    .chip-completada {
      background-color: #dcfce7 !important;
      color: #16a34a !important;
    }

    .chip-cancelada {
      background-color: #fee2e2 !important;
      color: #dc2626 !important;
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
export class VentaDetalleComponent implements OnInit {
  venta = signal<Venta | null>(null);
  loading = signal(true);
  detalleColumns = ['producto', 'precio', 'cantidad', 'subtotal'];

  constructor(
    private ventaService: VentaService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadVenta(parseInt(id));
    }
  }

  loadVenta(id: number): void {
    this.loading.set(true);
    
    this.ventaService.getById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.venta.set(response.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Error al cargar la venta', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/ventas']);
      }
    });
  }

  getMetodoPagoIcon(): string {
    const metodo = this.venta()?.metodo_pago;
    const icons: Record<string, string> = {
      efectivo: 'payments',
      tarjeta: 'credit_card',
      transferencia: 'account_balance'
    };
    return icons[metodo || ''] || 'payment';
  }

  cancelar(): void {
    const motivo = prompt('Motivo de la cancelación:');
    if (motivo !== null) {
      this.ventaService.cancel(this.venta()!.id, motivo).subscribe({
        next: () => {
          this.snackBar.open('Venta cancelada', 'Cerrar', { duration: 3000 });
          this.loadVenta(this.venta()!.id);
        },
        error: (err) => {
          this.snackBar.open(err.message || 'Error al cancelar', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }
}
