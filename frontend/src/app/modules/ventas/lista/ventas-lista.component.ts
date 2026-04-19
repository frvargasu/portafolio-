import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { VentaService } from '../../../core/services/venta.service';
import { Venta } from '../../../core/models';

@Component({
  selector: 'app-ventas-lista',
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatMenuModule,
    MatSnackBarModule,
    CurrencyPipe,
    DatePipe
  ],
  template: `
    <div class="ventas-container">
      <div class="page-header">
        <h1>Historial de Ventas</h1>
        <button mat-raised-button color="primary" routerLink="/pos">
          <mat-icon>add</mat-icon>
          Nueva Venta
        </button>
      </div>

      <!-- Filtros -->
      <mat-card class="filters-card">
        <div class="filters">
          <mat-form-field appearance="outline">
            <mat-label>Estado</mat-label>
            <mat-select [(ngModel)]="estadoFilter" (selectionChange)="loadVentas()">
              <mat-option [value]="null">Todos</mat-option>
              <mat-option value="completada">Completadas</mat-option>
              <mat-option value="cancelada">Canceladas</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Fecha Inicio</mat-label>
            <input matInput [matDatepicker]="pickerInicio" [(ngModel)]="fechaInicio" (dateChange)="loadVentas()">
            <mat-datepicker-toggle matIconSuffix [for]="pickerInicio"></mat-datepicker-toggle>
            <mat-datepicker #pickerInicio></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Fecha Fin</mat-label>
            <input matInput [matDatepicker]="pickerFin" [(ngModel)]="fechaFin" (dateChange)="loadVentas()">
            <mat-datepicker-toggle matIconSuffix [for]="pickerFin"></mat-datepicker-toggle>
            <mat-datepicker #pickerFin></mat-datepicker>
          </mat-form-field>

          <button mat-stroked-button (click)="clearFilters()">
            <mat-icon>clear</mat-icon>
            Limpiar
          </button>
        </div>
      </mat-card>

      <!-- Tabla -->
      <mat-card>
        @if (loading()) {
          <div class="loading-container">
            <mat-spinner></mat-spinner>
          </div>
        } @else {
          <div class="table-container">
            <table mat-table [dataSource]="ventas()">
              <ng-container matColumnDef="id">
                <th mat-header-cell *matHeaderCellDef>N° Venta</th>
                <td mat-cell *matCellDef="let v">#{{ v.id }}</td>
              </ng-container>

              <ng-container matColumnDef="fecha">
                <th mat-header-cell *matHeaderCellDef>Fecha</th>
                <td mat-cell *matCellDef="let v">
                  <div class="fecha-info">
                    <span>{{ v.created_at | date:'dd/MM/yyyy' }}</span>
                    <small>{{ v.created_at | date:'HH:mm' }}</small>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="usuario">
                <th mat-header-cell *matHeaderCellDef>Vendedor</th>
                <td mat-cell *matCellDef="let v">{{ v.usuario_nombre }}</td>
              </ng-container>

              <ng-container matColumnDef="metodo_pago">
                <th mat-header-cell *matHeaderCellDef>Método Pago</th>
                <td mat-cell *matCellDef="let v">
                  <div class="metodo-pago">
                    <mat-icon>{{ getMetodoPagoIcon(v.metodo_pago) }}</mat-icon>
                    <span>{{ v.metodo_pago | titlecase }}</span>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="total">
                <th mat-header-cell *matHeaderCellDef>Total</th>
                <td mat-cell *matCellDef="let v">
                  <strong>{{ v.total | currency:'CLP':'symbol-narrow':'1.0-0' }}</strong>
                </td>
              </ng-container>

              <ng-container matColumnDef="estado">
                <th mat-header-cell *matHeaderCellDef>Estado</th>
                <td mat-cell *matCellDef="let v">
                  <mat-chip [class]="'chip-' + v.estado">
                    {{ v.estado | titlecase }}
                  </mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="acciones">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let v">
                  <button mat-icon-button [matMenuTriggerFor]="menu">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #menu="matMenu">
                    <button mat-menu-item [routerLink]="['/ventas', v.id]">
                      <mat-icon>visibility</mat-icon>
                      <span>Ver detalle</span>
                    </button>
                    @if (v.estado === 'completada') {
                      <button mat-menu-item (click)="cancelarVenta(v)">
                        <mat-icon color="warn">cancel</mat-icon>
                        <span>Cancelar venta</span>
                      </button>
                    }
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            @if (ventas().length === 0) {
              <div class="no-data">
                <mat-icon>receipt_long</mat-icon>
                <p>No se encontraron ventas</p>
              </div>
            }
          </div>

          <mat-paginator
            [length]="totalItems()"
            [pageSize]="pageSize"
            [pageSizeOptions]="[10, 25, 50]"
            (page)="onPageChange($event)">
          </mat-paginator>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .ventas-container {
      max-width: 1400px;
      margin: 0 auto;
    }

    .filters-card {
      margin-bottom: 24px;
      padding: 16px;
    }

    .filters {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;

      mat-form-field {
        min-width: 150px;
      }
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    .table-container {
      overflow-x: auto;
    }

    table {
      width: 100%;
    }

    .fecha-info {
      display: flex;
      flex-direction: column;

      small {
        color: #64748b;
      }
    }

    .metodo-pago {
      display: flex;
      align-items: center;
      gap: 8px;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #64748b;
      }
    }

    .chip-completada {
      background-color: #dcfce7 !important;
      color: #16a34a !important;
    }

    .chip-cancelada {
      background-color: #fee2e2 !important;
      color: #dc2626 !important;
    }

    .no-data {
      padding: 48px;
      text-align: center;
      color: #64748b;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 16px;
      }
    }
  `]
})
export class VentasListaComponent implements OnInit {
  ventas = signal<Venta[]>([]);
  loading = signal(true);
  totalItems = signal(0);
  
  displayedColumns = ['id', 'fecha', 'usuario', 'metodo_pago', 'total', 'estado', 'acciones'];
  pageSize = 10;
  currentPage = 1;
  estadoFilter: 'completada' | 'cancelada' | null = null;
  fechaInicio: Date | null = null;
  fechaFin: Date | null = null;

  constructor(
    private ventaService: VentaService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadVentas();
  }

  loadVentas(): void {
    this.loading.set(true);

    this.ventaService.getAll({
      page: this.currentPage,
      limit: this.pageSize,
      estado: this.estadoFilter || undefined,
      fecha_inicio: this.fechaInicio ? this.formatDate(this.fechaInicio) : undefined,
      fecha_fin: this.fechaFin ? this.formatDate(this.fechaFin) : undefined
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.ventas.set(response.data);
          this.totalItems.set(response.pagination.total);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadVentas();
  }

  clearFilters(): void {
    this.estadoFilter = null;
    this.fechaInicio = null;
    this.fechaFin = null;
    this.currentPage = 1;
    this.loadVentas();
  }

  getMetodoPagoIcon(metodo: string): string {
    const icons: Record<string, string> = {
      efectivo: 'payments',
      tarjeta: 'credit_card',
      transferencia: 'account_balance'
    };
    return icons[metodo] || 'payment';
  }

  cancelarVenta(venta: Venta): void {
    const motivo = prompt('Motivo de la cancelación:');
    if (motivo !== null) {
      this.ventaService.cancel(venta.id, motivo).subscribe({
        next: () => {
          this.snackBar.open('Venta cancelada', 'Cerrar', { duration: 3000 });
          this.loadVentas();
        },
        error: (err) => {
          this.snackBar.open(err.message || 'Error al cancelar', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
