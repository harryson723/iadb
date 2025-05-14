import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';
import { FormsModule } from '@angular/forms';
import { compressToUTF16, decompressFromUTF16 } from 'lz-string';

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
  isSell: string = '';

  ngOnInit(): void {
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
  }

  onFileSelected(event: any) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        const newFile = {
          name: file.name,
          type: file.type,
          date: new Date().toLocaleString(),
          data: base64String,
          nit: this.nit,
          descripcion: this.descripcion,
          valor: this.valor,
          isSell: this.isSell,
        };

        this.imgs.push(newFile);

        try {
          const comprimido = compressToUTF16(JSON.stringify(this.imgs));
          localStorage.setItem('archivos', comprimido);
        } catch (error) {
          console.error('Error al comprimir o guardar en localStorage:', error);
        }

        // Limpiar campos del formulario
        this.nit = '';
        this.descripcion = '';
        this.valor = '';
        this.isSell = '';
        this.modal = false;
      };

      reader.readAsDataURL(file);
    }
  }

  uploadFactur() {
    this.modal = true;
  }
}
