import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ProveedorService } from '../../core/services/proveedor.service';
import { Proveedor } from '../../core/models';
import { ProveedorDialogComponent } from './proveedor-dialog.component';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  template: `
    <div class="proveedores-container">
      <div class="page-header">
        <h1>Proveedores</h1>
        <button mat-raised-button color="primary" (click)="openDialog()">
          <mat-icon>add</mat-icon>
          Nuevo Proveedor
        </button>
      </div>

      <mat-card>
        @if (loading()) {
          <div class="loading-container">
            <mat-spinner></mat-spinner>
          </div>
        } @else {
          <div class="table-container">
            <table mat-table [dataSource]="proveedores()">

              <ng-container matColumnDef="nombre">
                <th mat-header-cell *matHeaderCellDef>Proveedor</th>
                <td mat-cell *matCellDef="let p">
                  <div class="proveedor-info">
                    <div class="proveedor-icon">
                      <mat-icon>local_shipping</mat-icon>
                    </div>
                    <div>
                      <strong>{{ p.nombre }}</strong>
                      @if (p.contacto) {
                        <br><small class="text-muted">{{ p.contacto }}</small>
                      }
                    </div>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="contacto">
                <th mat-header-cell *matHeaderCellDef>Contacto</th>
                <td mat-cell *matCellDef="let p">
                  <div class="contact-info">
                    @if (p.email) {
                      <div><mat-icon class="inline-icon">email</mat-icon> {{ p.email }}</div>
                    }
                    @if (p.telefono) {
                      <div><mat-icon class="inline-icon">phone</mat-icon> {{ p.telefono }}</div>
                    }
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="direccion">
                <th mat-header-cell *matHeaderCellDef>Dirección</th>
                <td mat-cell *matCellDef="let p">
                  <span class="text-muted">{{ p.direccion || '—' }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="estado">
                <th mat-header-cell *matHeaderCellDef>Estado</th>
                <td mat-cell *matCellDef="let p">
                  <mat-chip [class]="p.activo ? 'chip-active' : 'chip-inactive'">
                    {{ p.activo ? 'Activo' : 'Inactivo' }}
                  </mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="acciones">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let p">
                  <button mat-icon-button color="primary" (click)="openDialog(p)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteProveedor(p)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            @if (proveedores().length === 0) {
              <div class="no-data">
                <mat-icon>local_shipping</mat-icon>
                <p>No hay proveedores registrados</p>
                <button mat-stroked-button color="primary" (click)="openDialog()">
                  Agregar primer proveedor
                </button>
              </div>
            }
          </div>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .proveedores-container {
      max-width: 1100px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
        color: #1e293b;
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

    .proveedor-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .proveedor-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background: linear-gradient(135deg, #8b5cf6, #6d28d9);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon {
        color: white;
      }
    }

    .contact-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 13px;

      div {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }

    .inline-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: #64748b;
    }

    .text-muted {
      color: #64748b;
      font-size: 13px;
    }

    .chip-active {
      background-color: #dcfce7 !important;
      color: #16a34a !important;
    }

    .chip-inactive {
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

      p {
        margin-bottom: 16px;
      }
    }
  `]
})
export class ProveedoresComponent implements OnInit {
  proveedores = signal<Proveedor[]>([]);
  loading = signal(true);
  displayedColumns = ['nombre', 'contacto', 'direccion', 'estado', 'acciones'];

  constructor(
    private proveedorService: ProveedorService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadProveedores();
  }

  loadProveedores(): void {
    this.loading.set(true);

    this.proveedorService.getAll({ includeInactive: true }).subscribe({
      next: (response) => {
        if (response.success) {
          this.proveedores.set(response.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  openDialog(proveedor?: Proveedor): void {
    const dialogRef = this.dialog.open(ProveedorDialogComponent, {
      width: '500px',
      data: { proveedor }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (proveedor) {
          this.updateProveedor(proveedor.id, result);
        } else {
          this.createProveedor(result);
        }
      }
    });
  }

  createProveedor(data: Partial<Proveedor>): void {
    this.proveedorService.create(data).subscribe({
      next: () => {
        this.snackBar.open('Proveedor creado', 'Cerrar', { duration: 3000 });
        this.loadProveedores();
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Error al crear', 'Cerrar', { duration: 3000 });
      }
    });
  }

  updateProveedor(id: number, data: Partial<Proveedor>): void {
    this.proveedorService.update(id, data).subscribe({
      next: () => {
        this.snackBar.open('Proveedor actualizado', 'Cerrar', { duration: 3000 });
        this.loadProveedores();
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Error al actualizar', 'Cerrar', { duration: 3000 });
      }
    });
  }

  deleteProveedor(proveedor: Proveedor): void {
    if (confirm(`¿Eliminar el proveedor "${proveedor.nombre}"?`)) {
      this.proveedorService.delete(proveedor.id).subscribe({
        next: () => {
          this.snackBar.open('Proveedor eliminado', 'Cerrar', { duration: 3000 });
          this.loadProveedores();
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Error al eliminar', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }
}
