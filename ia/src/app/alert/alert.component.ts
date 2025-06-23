import { Component, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AlertType } from '../interfaces/AlertType';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alert',
  imports: [CommonModule],
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.scss',
})
export class AlertComponent {
  data: AlertType; // La data que recibimos a través del MAT_DIALOG_DATA
  private timeoutId: any; // Variable para almacenar el ID del temporizador

  constructor(
    private dialogRef: MatDialogRef<AlertComponent>, // Inyectamos el MatDialogRef en el constructor
    @Inject(MAT_DIALOG_DATA) public injectedData: AlertType // Inyectamos los datos del diálogo
  ) {
    // Asignamos la data recibida a la propiedad "data"
    this.data = injectedData;
  }

  ngOnInit() {
    // Cierra el diálogo automáticamente después de 5 segundos
    this.timeoutId = setTimeout(() => {
      this.dialogRef.close(); // Cerramos el diálogo después de 5 segundos
    }, 3000); // 5000 ms = 5 segundos
  }

  ngOnDestroy() {
    // Limpiar el timeout si el componente se destruye antes de 5 segundos
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  closeDialog(): void {
    this.dialogRef.close(); // Llama al método `close()` de MatDialogRef para cerrar el diálogo
  }
}
