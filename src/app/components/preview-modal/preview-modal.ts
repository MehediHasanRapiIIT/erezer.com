import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvoiceService } from '../../services/invoice.service';

@Component({
    selector: 'app-preview-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './preview-modal.html',
    styleUrl: './preview-modal.css'
})
export class PreviewModal {
    invoiceService = inject(InvoiceService);
    @Output() close = new EventEmitter<void>();

    get hasImages() {
        return this.invoiceService.products().some(p => p.images.length > 0);
    }
}
