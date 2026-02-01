import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { InvoiceForm } from './components/invoice-form/invoice-form';
import { ProductList } from './components/product-list/product-list';
import { PreviewModal } from './components/preview-modal/preview-modal';
import { InvoiceService } from './services/invoice.service';
import { PdfService } from './services/pdf.service';
import { ExcelService } from './services/excel.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, FormsModule, InvoiceForm, ProductList, PreviewModal],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('invoiceApp');
  invoiceService = inject(InvoiceService);
  pdfService = inject(PdfService);
  excelService = inject(ExcelService);

  showPreview = false;
  mobileMenuOpen = false;
  showSuccessMessage = signal(false);
  successMessage = signal('');

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  openPreview() {
    this.showPreview = true;
    this.mobileMenuOpen = false;
  }

  generatePdf() {
    this.pdfService.generatePdf(this.invoiceService.getInvoiceData());
    this.showSuccess('PDF downloaded successfully!');
  }

  generateExcel() {
    this.excelService.generateExcel(this.invoiceService.getInvoiceData());
    this.showSuccess('Excel file updated successfully!');
  }

  private showSuccess(message: string) {
    this.successMessage.set(message);
    this.showSuccessMessage.set(true);
    setTimeout(() => {
      this.showSuccessMessage.set(false);
    }, 5000);
  }
}
