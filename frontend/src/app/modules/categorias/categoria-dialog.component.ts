import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Categoria } from '../../core/models';

interface DialogData {
  categoria?: Categoria;
}

@Component({
  selector: 'app-categoria-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.categoria ? 'Editar Categoría' : 'Nueva Categoría' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="nombre" placeholder="Ej: Lácteos">
          @if (form.get('nombre')?.hasError('required')) {
            <mat-error>El nombre es requerido</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Descripción</mat-label>
          <textarea matInput formControlName="descripcion" rows="3" placeholder="Descripción de la categoría"></textarea>
        </mat-form-field>

        @if (data.categoria) {
          <mat-slide-toggle formControlName="activo" color="primary">
            Categoría activa
          </mat-slide-toggle>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button 
        mat-raised-button 
        color="primary" 
        [disabled]="form.invalid"
        (click)="save()">
        {{ data.categoria ? 'Guardar' : 'Crear' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 8px;
    }

    mat-slide-toggle {
      margin-top: 8px;
    }
  `]
})
export class CategoriaDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CategoriaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.form = this.fb.group({
      nombre: [data.categoria?.nombre || '', Validators.required],
      descripcion: [data.categoria?.descripcion || ''],
      activo: [data.categoria?.activo ?? true]
    });
  }

  save(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}
