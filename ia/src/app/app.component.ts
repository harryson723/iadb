import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SearchComponent } from './search/search.component';
import { CredentialsComponent } from './credentials/credentials.component';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FacturaComponent } from './factura/factura.component';
import { GainsComponent } from './gains/gains.component';
import { SellsComponent } from './sells/sells.component';
import { InventoryComponent } from './inventory/inventory.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SearchComponent, FacturaComponent, GainsComponent, InventoryComponent, SellsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private dialog = inject(MatDialog);

  currentOption: string = 'chat';


  ngOnInit(): void {
    const credentials = localStorage.getItem('credentials');
    if (!credentials) this.dialog.open(CredentialsComponent);
  }

  changeOption(option: string) {
    this.currentOption = option;
  }
}
