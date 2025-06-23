import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';
import { FormsModule } from '@angular/forms';
import { compressToUTF16, decompressFromUTF16 } from 'lz-string';
import { AlertType } from '../interfaces/AlertType';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-factura',
  imports: [CommonModule, ModalComponent, FormsModule],
  templateUrl: './factura.component.html',
  styleUrl: './factura.component.scss',
})
export class FacturaComponent {
  imgs: any[] = [];
  modal = false;

  nit: string = '';
  descripcion: string = '';
  valor: string = '';
  isSell: string | null = null;
  formaPago: string | null = null;

  consecutivo: number = 0;

  constructor(private alertService: AlertService) {}

  mostrarAlerta(
    type: 'error' | 'success' | 'warning',
    title: string,
    message: string
  ) {
    const alertData: AlertType = {
      message,
      type,
      title,
    };

    this.alertService.openAlert(alertData);
  }

  ngOnInit(): void {
    // Cargar facturas almacenadas
    const storedCompressed = localStorage.getItem('archivos');
    if (storedCompressed) {
      try {
        const descomprimido = decompressFromUTF16(storedCompressed);
        this.imgs = JSON.parse(descomprimido || '[]');
      } catch (error) {
        console.error('Error al descomprimir o parsear archivos:', error);
        this.imgs = [];
      }
    }

    // Cargar consecutivo guardado
    const consecutivoGuardado = localStorage.getItem('consecutivo');
    if (consecutivoGuardado) {
      this.consecutivo = Number(consecutivoGuardado);
    } else {
      this.consecutivo = 0;
    }
  }

  onFileSelected(event: any) {
    if (!this.nit || !this.descripcion || !this.valor || !this.isSell) {
      this.mostrarAlerta(
        'error',
        'Campos vacíos',
        'Por favor, complete todos los campos.'
      );
      return;
    }

    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;

        // Incrementar consecutivo y guardarlo
        this.consecutivo++;
        localStorage.setItem('consecutivo', this.consecutivo.toString());

        const newFile = {
          consecutivo: this.consecutivo,
          name: file.name,
          type: file.type,
          date: new Date().toLocaleString(),
          data: base64String,
          nit: this.nit,
          descripcion: this.descripcion,
          valor: this.valor,
          isSell: this.isSell,
          formaPago: this.formaPago,
        };

        this.imgs.push(newFile);

        try {
          const comprimido = compressToUTF16(JSON.stringify(this.imgs));
          localStorage.setItem('archivos', comprimido);
        } catch (error) {
          console.error('Error al comprimir o guardar en localStorage:', error);
        }

        // Limpiar campos
        this.nit = '';
        this.descripcion = '';
        this.valor = '';
        this.isSell = '';
        this.formaPago = '';
        this.modal = false;
      };

      reader.readAsDataURL(file);
      this.mostrarAlerta(
        'success',
        'Se agregó la factura',
        'Factura almacenada correctamente.'
      );
    }
  }

  uploadFactur() {
    this.modal = true;
  }
}