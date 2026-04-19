import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CategoriaService } from '../../core/services/categoria.service';
import { Categoria } from '../../core/models';
import { CategoriaDialogComponent } from './categoria-dialog.component';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatSnackBarModule
  ],
  template: `
    <div class="categorias-container">
      <div class="page-header">
        <h1>Categorías</h1>
        <button mat-raised-button color="primary" (click)="openDialog()">
          <mat-icon>add</mat-icon>
          Nueva Categoría
        </button>
      </div>

      <mat-card>
        @if (loading()) {
          <div class="loading-container">
            <mat-spinner></mat-spinner>
          </div>
        } @else {
          <div class="table-container">
            <table mat-table [dataSource]="categorias()">
              <ng-container matColumnDef="nombre">
                <th mat-header-cell *matHeaderCellDef>Nombre</th>
                <td mat-cell *matCellDef="let c">
                  <div class="categoria-info">
                    <div class="categoria-icon">
                      <mat-icon>category</mat-icon>
                    </div>
                    <div>
                      <strong>{{ c.nombre }}</strong>
                      @if (c.descripcion) {
                        <br><small class="text-muted">{{ c.descripcion }}</small>
                      }
                    </div>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="productos">
                <th mat-header-cell *matHeaderCellDef>Productos</th>
                <td mat-cell *matCellDef="let c">
                  <span class="productos-count">{{ c.productos_count || 0 }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="estado">
                <th mat-header-cell *matHeaderCellDef>Estado</th>
                <td mat-cell *matCellDef="let c">
                  <mat-chip [class]="c.activo ? 'chip-active' : 'chip-inactive'">
                    {{ c.activo ? 'Activa' : 'Inactiva' }}
                  </mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="acciones">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let c">
                  <button mat-icon-button color="primary" (click)="openDialog(c)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteCategoria(c)" [disabled]="c.productos_count > 0">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            @if (categorias().length === 0) {
              <div class="no-data">
                <mat-icon>category</mat-icon>
                <p>No hay categorías registradas</p>
                <button mat-stroked-button color="primary" (click)="openDialog()">
                  Crear primera categoría
                </button>
              </div>
            }
          </div>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .categorias-container {
      max-width: 1000px;
      margin: 0 auto;
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

    .categoria-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .categoria-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        color: white;
      }
    }

    .text-muted {
      color: #64748b;
    }

    .productos-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 32px;
      height: 32px;
      background: #f1f5f9;
      border-radius: 16px;
      font-weight: 500;
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
export class CategoriasComponent implements OnInit {
  categorias = signal<Categoria[]>([]);
  loading = signal(true);
  displayedColumns = ['nombre', 'productos', 'estado', 'acciones'];

  constructor(
    private categoriaService: CategoriaService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCategorias();
  }

  loadCategorias(): void {
    this.loading.set(true);
    
    this.categoriaService.getAll({ includeInactive: true }).subscribe({
      next: (response) => {
        if (response.success) {
          this.categorias.set(response.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  openDialog(categoria?: Categoria): void {
    const dialogRef = this.dialog.open(CategoriaDialogComponent, {
      width: '450px',
      data: { categoria }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (categoria) {
          this.updateCategoria(categoria.id, result);
        } else {
          this.createCategoria(result);
        }
      }
    });
  }

  createCategoria(data: Partial<Categoria>): void {
    this.categoriaService.create(data).subscribe({
      next: () => {
        this.snackBar.open('Categoría creada', 'Cerrar', { duration: 3000 });
        this.loadCategorias();
      },
      error: (err) => {
        this.snackBar.open(err.message || 'Error al crear', 'Cerrar', { duration: 3000 });
      }
    });
  }

  updateCategoria(id: number, data: Partial<Categoria>): void {
    this.categoriaService.update(id, data).subscribe({
      next: () => {
        this.snackBar.open('Categoría actualizada', 'Cerrar', { duration: 3000 });
        this.loadCategorias();
      },
      error: (err) => {
        this.snackBar.open(err.message || 'Error al actualizar', 'Cerrar', { duration: 3000 });
      }
    });
  }

  deleteCategoria(categoria: Categoria): void {
    if (categoria.productos_count && categoria.productos_count > 0) {
      this.snackBar.open('No se puede eliminar una categoría con productos', 'Cerrar', { duration: 3000 });
      return;
    }

    if (confirm(`¿Eliminar la categoría "${categoria.nombre}"?`)) {
      this.categoriaService.delete(categoria.id).subscribe({
        next: () => {
          this.snackBar.open('Categoría eliminada', 'Cerrar', { duration: 3000 });
          this.loadCategorias();
        },
        error: (err) => {
          this.snackBar.open(err.message || 'Error al eliminar', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }
}
