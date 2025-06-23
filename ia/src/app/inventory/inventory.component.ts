import { Component, OnInit } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AlertType } from '../interfaces/AlertType';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [ModalComponent, CommonModule, FormsModule, HttpClientModule],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
})
export class InventoryComponent implements OnInit {
  modal = false;
  inventory: any[] = [];
  filteredInventory: any[] = [];

  nit: string = '';
  descripcion: string = '';
  valor: string = '';
  stock: string = '';
  provider: string = '';
  searchTerm: string = '';
  gain: string = '';

  constructor(private http: HttpClient, private alertService: AlertService) {}

  mostrarAlerta(type: "error" | "success" | "warning", title: string, message: string) {
    const alertData: AlertType = {
      message,
      type, 
      title
    };

    this.alertService.openAlert(alertData);
  }

  ngOnInit() {
    this.loadProducts(); // 👈 cargar productos apenas inicia
  }

  addProduct() {
    this.modal = true;
  }

  sendProduct(event: any) {
    event.preventDefault();

    const newProduct = {
      nit: this.nit,
      descripcion: this.descripcion,
      cantidadStock: parseInt(this.stock),
      costoUnidad: parseFloat(this.valor),
      proveedor: this.provider,
      gananciaUnidad: parseFloat(this.gain),
    };

    this.http.post('http://localhost:4001/productos', newProduct).subscribe({
      next: (response) => {
        console.log('Producto agregado correctamente', response);
        this.modal = false;
        this.mostrarAlerta('success', 'Producto agregado correctamente', 'El producto se agrego');
        this.clearForm();
        this.loadProducts();
      },
      error: (error) => {
        console.error('Error al agregar producto', error);
        this.mostrarAlerta('error', 'Error al agregar el producto', error.error.error);
      },
    });
  }

  loadProducts() {
    this.http.get<any[]>('http://localhost:4001/productos').subscribe({
      next: (data) => {
        this.inventory = data;
        this.filteredInventory = data;
      },
      error: (error) => {
           this.mostrarAlerta('error', 'Error al cargar productos', 'Hubo un erorr de conexión');
        console.error('Error al cargar productos', error);
      },
    });
  }

  clearForm() {
    this.nit = '';
    this.descripcion = '';
    this.valor = '';
    this.stock = '';
    this.provider = '';
    this.gain = '';
  }

  searchProducts() {
    console.log(this.searchTerm);
    const term = this.searchTerm.toLowerCase();
    this.filteredInventory = this.inventory.filter(
      (product) =>
        product.descripcion.toLowerCase().includes(term) ||
        product.proveedor.toLowerCase().includes(term) ||
        product.nit.toLowerCase().includes(term)
    );
  }

  updateStock(product: any) {
    const updatedProduct = {
      cantidadStock: product.cantidad_stock,
    };

    this.http
      .put(`http://localhost:4001/productos/${product.id}`, updatedProduct)
      .subscribe({
        next: (res) => {
          console.log('✅ Stock actualizado', res);
          this.mostrarAlerta('success', 'Actualización exitosa', 'El producto actualizo su stock');
        },
        error: (err) => {
          this.mostrarAlerta('error', 'Error en la actualización', 'No se puedo actualizar el stock');
          console.error('❌ Error al actualizar stock', err);
        },
      });
  }
}
