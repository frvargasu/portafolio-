import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProductoService } from '../../../core/services/producto.service';
import { CategoriaService } from '../../../core/services/categoria.service';
import { Producto, Categoria } from '../../../core/models';

@Component({
  selector: 'app-producto-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    CurrencyPipe
  ],
  template: `
    <div class="form-container">
      <div class="page-header">
        <h1>{{ isEditing() ? 'Editar Producto' : 'Nuevo Producto' }}</h1>
      </div>

      <mat-card>
        @if (loadingData()) {
          <div class="loading-container">
            <mat-spinner></mat-spinner>
          </div>
        } @else {
          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <div class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Código de Barras</mat-label>
                  <input matInput formControlName="codigo_barras" placeholder="Opcional">
                  <mat-icon matSuffix>qr_code</mat-icon>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Nombre del Producto</mat-label>
                  <input matInput formControlName="nombre" placeholder="Ej: Leche Entera 1L">
                  @if (form.get('nombre')?.hasError('required')) {
                    <mat-error>El nombre es requerido</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Descripción</mat-label>
                  <textarea matInput formControlName="descripcion" rows="3" placeholder="Descripción del producto"></textarea>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Categoría</mat-label>
                  <mat-select formControlName="categoria_id">
                    @for (cat of categorias(); track cat.id) {
                      <mat-option [value]="cat.id">{{ cat.nombre }}</mat-option>
                    }
                  </mat-select>
                  @if (form.get('categoria_id')?.hasError('required')) {
                    <mat-error>Seleccione una categoría</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Precio de Compra</mat-label>
                  <input matInput type="number" formControlName="precio_compra" placeholder="0">
                  <span matTextPrefix>$&nbsp;</span>
                  @if (form.get('precio_compra')?.hasError('required')) {
                    <mat-error>El precio de compra es requerido</mat-error>
                  }
                  @if (form.get('precio_compra')?.hasError('min')) {
                    <mat-error>Debe ser mayor o igual a 0</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Precio de Venta</mat-label>
                  <input matInput type="number" formControlName="precio_venta" placeholder="0">
                  <span matTextPrefix>$&nbsp;</span>
                  @if (form.get('precio_venta')?.hasError('required')) {
                    <mat-error>El precio de venta es requerido</mat-error>
                  }
                  @if (form.get('precio_venta')?.hasError('min')) {
                    <mat-error>Debe ser mayor a 0</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Stock Inicial</mat-label>
                  <input matInput type="number" formControlName="stock" placeholder="0">
                  @if (form.get('stock')?.hasError('required')) {
                    <mat-error>El stock es requerido</mat-error>
                  }
                  @if (form.get('stock')?.hasError('min')) {
                    <mat-error>Debe ser mayor o igual a 0</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Stock Mínimo</mat-label>
                  <input matInput type="number" formControlName="stock_minimo" placeholder="0">
                  <mat-hint>Alerta cuando el stock baje de este nivel</mat-hint>
                  @if (form.get('stock_minimo')?.hasError('min')) {
                    <mat-error>Debe ser mayor o igual a 0</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>URL de Imagen</mat-label>
                  <input matInput formControlName="imagen_url" placeholder="https://...">
                  <mat-icon matSuffix>image</mat-icon>
                </mat-form-field>
              </div>

              <!-- Preview de margen -->
              @if (form.get('precio_compra')?.value && form.get('precio_venta')?.value) {
                <div class="margin-preview">
                  <span class="margin-label">Margen de ganancia:</span>
                  <span class="margin-value" [class.negative]="getMargin() < 0">
                    {{ getMargin() | currency:'CLP':'symbol-narrow':'1.0-0' }} 
                    ({{ getMarginPercent() | number:'1.1-1' }}%)
                  </span>
                </div>
              }

              <div class="form-actions">
                <button mat-button type="button" routerLink="/productos">Cancelar</button>
                <button 
                  mat-raised-button 
                  color="primary" 
                  type="submit"
                  [disabled]="saving() || form.invalid">
                  @if (saving()) {
                    <mat-spinner diameter="20"></mat-spinner>
                  } @else {
                    {{ isEditing() ? 'Guardar Cambios' : 'Crear Producto' }}
                  }
                </button>
              </div>
            </form>
          </mat-card-content>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .form-container {
      max-width: 800px;
      margin: 0 auto;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    mat-card-content {
      padding: 24px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .margin-preview {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      background: #f1f5f9;
      border-radius: 8px;
      margin: 16px 0;
    }

    .margin-label {
      color: #64748b;
    }

    .margin-value {
      font-weight: 600;
      color: #22c55e;

      &.negative {
        color: #dc2626;
      }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }

    @media (max-width: 600px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProductoFormComponent implements OnInit {
  form: FormGroup;
  categorias = signal<Categoria[]>([]);
  isEditing = signal(false);
  loadingData = signal(false);
  saving = signal(false);
  productoId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      codigo_barras: [''],
      nombre: ['', [Validators.required]],
      descripcion: [''],
      categoria_id: [null, [Validators.required]],
      precio_compra: [0, [Validators.required, Validators.min(0)]],
      precio_venta: [0, [Validators.required, Validators.min(1)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      stock_minimo: [5, [Validators.min(0)]],
      imagen_url: ['']
    });
  }

  ngOnInit(): void {
    this.loadCategorias();
    
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.productoId = parseInt(id);
      this.isEditing.set(true);
      this.loadProducto();
    }
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

  loadProducto(): void {
    if (!this.productoId) return;

    this.loadingData.set(true);
    this.productoService.getById(this.productoId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.form.patchValue(response.data);
        }
        this.loadingData.set(false);
      },
      error: () => {
        this.snackBar.open('Error al cargar el producto', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/productos']);
      }
    });
  }

  getMargin(): number {
    const compra = this.form.get('precio_compra')?.value || 0;
    const venta = this.form.get('precio_venta')?.value || 0;
    return venta - compra;
  }

  getMarginPercent(): number {
    const compra = this.form.get('precio_compra')?.value || 0;
    const venta = this.form.get('precio_venta')?.value || 0;
    if (compra === 0) return 0;
    return ((venta - compra) / compra) * 100;
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.saving.set(true);
    const data = this.form.value;

    const request$ = this.isEditing()
      ? this.productoService.update(this.productoId!, data)
      : this.productoService.create(data);

    request$.subscribe({
      next: () => {
        this.snackBar.open(
          this.isEditing() ? 'Producto actualizado' : 'Producto creado',
          'Cerrar',
          { duration: 3000 }
        );
        this.router.navigate(['/productos']);
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(err.message || 'Error al guardar', 'Cerrar', { duration: 3000 });
      }
    });
  }
}
