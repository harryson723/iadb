import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Chart } from 'chart.js';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-sells',
  imports: [CommonModule, FormsModule],
  templateUrl: './sells.component.html',
  styleUrl: './sells.component.scss',
})
export class SellsComponent {
  inventory: any[] = [];
  filteredInventory: any[] = [];
  top: any[] = [];
  dataByDay: any[] = [];
  searchTerm: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadProducts();
  }

  ngAfterViewInit() {
    this.createChart(this.dataByDay);
  }

  loadProducts() {
    this.http.get<any>('http://localhost:4001/ventas-analisis').subscribe({
      next: (data) => {
        this.inventory = data.productos;
        this.filteredInventory = data.productos;
        this.top = data.topVendidos;
        this.dataByDay = data.ventasPorDia;
        this.createChart(this.dataByDay);
      },
      error: (error) => {
        console.error('Error al cargar productos', error);
      },
    });
  }

  searchProducts() {
    const term = this.searchTerm.toLowerCase();
    this.filteredInventory = this.inventory.filter(
      (product) =>
        product.descripcion.toLowerCase().includes(term) ||
        product.proveedor.toLowerCase().includes(term) ||
        product.nit.toLowerCase().includes(term)
    );
  }

  chartInstance: Chart | null = null;

  createChart(ventasPorDia: { dia: string; cantidad: number }[]) {
    const ctx = document.getElementById('gainsChart') as HTMLCanvasElement;

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const diasOrdenados = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
    const labelsTraducidos = [
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
      'Domingo',
    ];

    const dataOrdenada = diasOrdenados.map((diaIngles) => {
      const ventaDia = ventasPorDia.find((d) => d.dia === diaIngles);
      return ventaDia ? Number(ventaDia.cantidad) : 0;
    });

    console.log(dataOrdenada);
    this.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labelsTraducidos,
        datasets: [
          {
            label: 'Ventas',
            data: dataOrdenada,
            backgroundColor: '#00c4ff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            suggestedMax: 1, // 🔥 esto fuerza a que haya eje Y visible aunque los datos sean 0
          },
        },
      },
    });
  }

  downloadPDF() {
    const tableElement = document.querySelector('.table-container') as HTMLElement;

    // Guardar estilos originales
    const originalStyle = {
      maxHeight: tableElement.style.maxHeight,
      overflow: tableElement.style.overflow,
    };

    // Expandir tabla completa para capturarla
    tableElement.style.maxHeight = 'none';
    tableElement.style.overflow = 'visible';

    html2canvas(tableElement, { scale: 2 })
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png');

        const pdf = new jsPDF('l', 'mm', 'a4'); // Horizontal
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        const imgProps = {
          width: pdfWidth,
          height: (pdfWidth * canvasHeight) / canvasWidth,
        };

        let position = 0;

        // Si la imagen es más alta que una página, cortamos
        while (position < imgProps.height) {
          const sourceY = (position * canvasHeight) / imgProps.height;
          const pageHeightInCanvas =
            (pdfHeight * canvasHeight) / imgProps.height;

          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height =
            pageHeightInCanvas < canvas.height - sourceY
              ? pageHeightInCanvas
              : canvas.height - sourceY;

          const ctx = pageCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(
              canvas,
              0,
              sourceY,
              canvas.width,
              pageCanvas.height,
              0,
              0,
              canvas.width,
              pageCanvas.height
            );
            const pageImgData = pageCanvas.toDataURL('image/png');
            if (position !== 0) pdf.addPage();
            pdf.addImage(pageImgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          }

          position += pdfHeight;
        }

        pdf.save('tabla-paginada.pdf');
      })
      .finally(() => {
        // Restaurar estilos
        tableElement.style.maxHeight = originalStyle.maxHeight;
        tableElement.style.overflow = originalStyle.overflow;
      });
  }
}
