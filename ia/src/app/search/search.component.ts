import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { Chat } from '../interfaces/Chat';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { AlertComponent } from '../alert/alert.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-search',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
})
export class SearchComponent {
  public chats: Chat[] = [];
  public question = new FormControl('', [Validators.required]);
  private dialog = inject(MatDialog);
  private credentials: any;

  constructor(private http: HttpClient) {
    const tempCrendentials = localStorage.getItem('credentials');
    if (tempCrendentials) this.credentials = JSON.parse(tempCrendentials);
  }

  openAlert() {
    this.dialog.open(AlertComponent, {
      data: {
        type: 'error',
        message: 'Error: debe ingresar texto',
      },
    });
  }

  sendQuestion(event: any) {
    event.preventDefault();
    if (this.question.invalid) {
      this.openAlert();
      return;
    }
    const text = this.question.value || '';
    this.chats.push({
      type: 'user',
      text,
    });
    this.question.setValue('');
    this.question.disable();
    this.http
      .post('http://localhost:4000/query', {
        query: text,
        credentials: this.credentials,
      })
      .subscribe({
        next: (res: any) => {
          this.question.enable();
          this.chats.push({
            type: 'ia',
            text: res.data,
          });
        },
        error: (err) => {
          this.question.enable();
          this.chats.push({
            type: 'ia',
            text: 'Error al procesar',
          });
        },
        complete: () => this.question.enable(),
      });
  }
}
