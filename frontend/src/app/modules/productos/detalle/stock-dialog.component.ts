import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Producto } from '../../../core/models';

interface DialogData {
  producto: Producto;
}

@Component({
  selector: 'app-stock-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Ajustar Stock</h2>
    <mat-dialog-content>
      <p class="product-name">{{ data.producto.nombre }}</p>
      <p class="current-stock">Stock actual: <strong>{{ data.producto.stock }}</strong></p>

      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Tipo de Movimiento</mat-label>
          <mat-select formControlName="tipo">
            <mat-option value="entrada">Entrada (agregar stock)</mat-option>
            <mat-option value="salida">Salida (reducir stock)</mat-option>
            <mat-option value="ajuste">Ajuste (establecer stock)</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Cantidad</mat-label>
          <input matInput type="number" formControlName="cantidad" min="1">
          @if (form.get('cantidad')?.hasError('required')) {
            <mat-error>La cantidad es requerida</mat-error>
          }
          @if (form.get('cantidad')?.hasError('min')) {
            <mat-error>Debe ser mayor a 0</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Motivo</mat-label>
          <input matInput formControlName="motivo" placeholder="Ej: Compra a proveedor">
        </mat-form-field>

        @if (form.get('tipo')?.value && form.get('cantidad')?.value) {
          <div class="preview">
            <span>Nuevo stock:</span>
            <strong [class.negative]="getNewStock() < 0">{{ getNewStock() }}</strong>
          </div>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button 
        mat-raised-button 
        color="primary" 
        [disabled]="form.invalid || getNewStock() < 0"
        (click)="save()">
        Guardar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .product-name {
      font-weight: 500;
      font-size: 16px;
      margin-bottom: 4px;
    }

    .current-stock {
      color: #64748b;
      margin-bottom: 16px;
    }

    .full-width {
      width: 100%;
    }

    .preview {
      display: flex;
      justify-content: space-between;
      padding: 12px;
      background: #f1f5f9;
      border-radius: 8px;

      strong {
        color: #22c55e;

        &.negative {
          color: #dc2626;
        }
      }
    }
  `]
})
export class StockDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<StockDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.form = this.fb.group({
      tipo: ['entrada', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      motivo: ['']
    });
  }

  getNewStock(): number {
    const tipo = this.form.get('tipo')?.value;
    const cantidad = this.form.get('cantidad')?.value || 0;
    const stockActual = this.data.producto.stock;

    switch (tipo) {
      case 'entrada':
        return stockActual + cantidad;
      case 'salida':
        return stockActual - cantidad;
      case 'ajuste':
        return cantidad;
      default:
        return stockActual;
    }
  }

  save(): void {
    if (this.form.valid && this.getNewStock() >= 0) {
      this.dialogRef.close(this.form.value);
    }
  }
}
