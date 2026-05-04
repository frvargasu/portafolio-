import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  titulo: string;
  mensaje: string;
  labelConfirmar?: string;
  labelCancelar?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-dialog">
      <div class="dialog-header">
        <mat-icon class="warn-icon">warning_amber</mat-icon>
        <h2 mat-dialog-title>{{ data.titulo }}</h2>
      </div>
      <mat-dialog-content>
        <p>{{ data.mensaje }}</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button (click)="cancelar()">
          {{ data.labelCancelar || 'Cancelar' }}
        </button>
        <button mat-flat-button color="warn" (click)="confirmar()">
          {{ data.labelConfirmar || 'Confirmar' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      padding: 8px;
      min-width: 320px;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;

      h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        padding: 0;
      }
    }

    .warn-icon {
      color: #f59e0b;
      font-size: 28px;
      width: 28px;
      height: 28px;
      flex-shrink: 0;
    }

    mat-dialog-content p {
      color: #4b5563;
      font-size: 14px;
      line-height: 1.6;
      margin: 0;
    }

    mat-dialog-actions {
      padding-top: 16px;
      gap: 8px;
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  confirmar(): void {
    this.dialogRef.close(true);
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}
