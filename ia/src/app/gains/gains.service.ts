import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GainsService {
  private apiUrl = 'http://localhost:4001'; // Cambia si tu API está en otro lado

  constructor(private http: HttpClient) {}

  getResumen(): Observable<any> {
    return this.http.get(`${this.apiUrl}/resumen`);
  }
}
