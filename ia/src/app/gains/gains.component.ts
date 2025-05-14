import { Component, AfterViewInit } from '@angular/core';
import { GainsService } from './gains.service';
import Chart from 'chart.js/auto';
import { CommonModule } from '@angular/common';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ResumenResponse {
  ingresoSemana: number;
  ingresoMes: number;
  gastoSemana: number;
  gastoMes: number;
  gananciaMes: number;
  ingresosDiarios: number[];
}

@Component({
  selector: 'app-gains',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gains.component.html',
  styleUrls: ['./gains.component.scss'],
})
export class GainsComponent implements AfterViewInit {
  ingresoSemana = 0;
  ingresoMes = 0;
  gastoSemana = 0;
  gastoMes = 0;
  gananciaMes = 0;
  ingresosDiarios: number[] = [];

  constructor(private gainsService: GainsService) {}

  ngAfterViewInit() {
    this.gainsService.getResumen().subscribe((data: ResumenResponse) => {
      this.ingresoSemana = data.ingresoSemana;
      this.ingresoMes = data.ingresoMes;
      this.gastoSemana = data.gastoSemana;
      this.gastoMes = data.gastoMes;
      this.gananciaMes = data.gananciaMes;
      this.ingresosDiarios = data.ingresosDiarios;

      // Si "ingresosDiarios" es del tipo: { dia: string, ingreso: number }[]
      const diasOrdenados = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ];
      const diasGrafico = [
        'Domingo',
        'Lunes',
        'Martes',
        'Miércoles',
        'Jueves',
        'Viernes',
        'Sábado',
      ];

      // Inicializa el array con ceros
      const ingresosOrdenados = Array(7).fill(0);

      // Llena los valores según el día
      this.ingresosDiarios.forEach((dato: any) => {
        const index = diasOrdenados.indexOf(dato.dia); // Sunday = 0, etc.
        if (index !== -1) {
          ingresosOrdenados[index] = dato.ingreso;
        }
      });

      // Llama al método con los datos ordenados
      this.createChart(ingresosOrdenados);
    });
  }

  createChart(ingresosDiarios: number[]) {
    const ctx = document.getElementById('gainsChart') as HTMLCanvasElement;

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [
          'Lunes',
          'Martes',
          'Miércoles',
          'Jueves',
          'Viernes',
          'Sábado',
          'Domingo',
        ],
        datasets: [
          {
            label: 'Ingresos diarios',
            data: ingresosDiarios,
            backgroundColor: '#00c4ff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    });
  }

  downloadPDF() {
    const element = document.querySelector('.gains-container') as HTMLElement;

    html2canvas(element).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4'); // 👈 'l' = landscape

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Ajustamos imagen al tamaño completo de la página
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('resumen-ventas.pdf');
    });
  }
}
