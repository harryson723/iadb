import { Component, OnInit } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [ModalComponent, CommonModule, FormsModule, HttpClientModule],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss'
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

  constructor(private http: HttpClient) {}

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
      proveedor: this.provider
    };

    this.http.post('http://localhost:4001/productos', newProduct)
      .subscribe({
        next: (response) => {
          console.log('Producto agregado correctamente', response);
          this.modal = false;
          this.clearForm();
          this.loadProducts();
        },
        error: (error) => {
          console.error('Error al agregar producto', error);
        }
      });
  }

  loadProducts() {
    this.http.get<any[]>('http://localhost:4001/productos')
      .subscribe({
        next: (data) => {
          this.inventory = data;
          this.filteredInventory = data;
        },
        error: (error) => {
          console.error('Error al cargar productos', error);
        }
      });
  }

  clearForm() {
    this.nit = '';
    this.descripcion = '';
    this.valor = '';
    this.stock = '';
    this.provider = '';
  }

  searchProducts() {
    console.log(this.searchTerm)
    const term = this.searchTerm.toLowerCase();
    this.filteredInventory = this.inventory.filter(product =>
      product.descripcion.toLowerCase().includes(term) ||
      product.proveedor.toLowerCase().includes(term) ||
      product.nit.toLowerCase().includes(term)
    );
  }
}
