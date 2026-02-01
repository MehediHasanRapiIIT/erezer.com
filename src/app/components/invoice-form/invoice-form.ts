import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../services/invoice.service';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoice-form.html',
  styleUrl: './invoice-form.css'
})
export class InvoiceForm {
  invoiceService = inject(InvoiceService);

  // Expose signals for easier access in template
  company = this.invoiceService.company;
  customer = this.invoiceService.customer;

  get dateStr() {
    return this.invoiceService.invoiceDate().toISOString().split('T')[0];
  }

  updateDate(val: string) {
    this.invoiceService.invoiceDate.set(new Date(val));
  }

  updateCompany() {
    this.invoiceService.company.set({ ...this.company() });
  }

  updateCustomer() {
    this.invoiceService.customer.set({ ...this.customer() });
  }
}
