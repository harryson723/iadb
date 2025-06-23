// alert.service.ts
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AlertType } from '../src/app/interfaces/AlertType';
import { AlertComponent } from '../src/app/alert/alert.component';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  constructor(private dialog: MatDialog) { }

  openAlert(data: AlertType) {
    this.dialog.open(AlertComponent, {
      data: data,
      width: '400px'
    });
  }
}
