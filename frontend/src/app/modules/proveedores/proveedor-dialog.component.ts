import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Proveedor } from '../../core/models';

interface DialogData {
  proveedor?: Proveedor;
}

@Component({
  selector: 'app-proveedor-dialog',
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
    <h2 mat-dialog-title>{{ data.proveedor ? 'Editar Proveedor' : 'Nuevo Proveedor' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="nombre" placeholder="Ej: Distribuidora XYZ">
          @if (form.get('nombre')?.hasError('required')) {
            <mat-error>El nombre es requerido</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Persona de contacto</mat-label>
          <input matInput formControlName="contacto" placeholder="Ej: Juan Pérez">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" placeholder="correo@ejemplo.com" type="email">
          @if (form.get('email')?.hasError('email')) {
            <mat-error>Ingresa un email válido</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Teléfono</mat-label>
          <input matInput formControlName="telefono" placeholder="Ej: +1 555 0100">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Dirección</mat-label>
          <input matInput formControlName="direccion" placeholder="Dirección del proveedor">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notas</mat-label>
          <textarea matInput formControlName="notas" rows="3" placeholder="Notas adicionales"></textarea>
        </mat-form-field>

        @if (data.proveedor) {
          <mat-slide-toggle formControlName="activo" color="primary">
            Proveedor activo
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
        {{ data.proveedor ? 'Guardar' : 'Crear' }}
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
export class ProveedorDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProveedorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.form = this.fb.group({
      nombre: [data.proveedor?.nombre || '', Validators.required],
      contacto: [data.proveedor?.contacto || ''],
      email: [data.proveedor?.email || '', Validators.email],
      telefono: [data.proveedor?.telefono || ''],
      direccion: [data.proveedor?.direccion || ''],
      notas: [data.proveedor?.notas || ''],
      activo: [data.proveedor?.activo ?? true]
    });
  }

  save(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}
