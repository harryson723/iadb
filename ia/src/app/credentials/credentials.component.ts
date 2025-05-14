import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { AlertComponent } from '../alert/alert.component';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-credentials',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './credentials.component.html',
  styleUrl: './credentials.component.scss',
})
export class CredentialsComponent {
  private dialog = inject(MatDialog);
  public show: boolean = false;
  public successDB: boolean = false;
  public messageInfo = '';
  public typeDbform = new FormGroup({
    type: new FormControl('mysql', Validators.required),
  });
  public form = new FormGroup({
    user: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required),
    host: new FormControl('', Validators.required),
    db: new FormControl('', Validators.required),
  });

  constructor(private http: HttpClient) {}

  showForm() {
    this.show = true;
  }

  openAlert(type: string, message: string) {
    this.dialog.open(AlertComponent, {
      data: {
        type,
        message,
      },
    });
  }

  handleSubmit(e: any) {
    e.preventDefault();
    if (this.form.invalid)
      return this.openAlert('error', 'Ingrese las credenciales');
    this.messageInfo = 'Conectando a la base de datos';
    const credentials = {
      ...this.typeDbform.value,
      credentials: this.form.value,
    };
    this.http
      .post('http://localhost:4000/check', {
        ...credentials,
      })
      .subscribe({
        next: (res: any) => {
          console.log(res);
          if (res.success) {
            this.messageInfo = 'Conexión exitosa.';
            this.successDB = true;
            localStorage.setItem('credentials', JSON.stringify(credentials));
          }
        },
        error: (err) => {
          console.log(err);
          this.successDB = false;
          this.messageInfo = 'Error en la conexión.';
        },
      });
  }
}
