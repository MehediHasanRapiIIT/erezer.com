import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../services/invoice.service';
import { Product } from '../../models/invoice.model';

@Component({
    selector: 'app-product-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './product-list.html',
    styleUrl: './product-list.css'
})
export class ProductList {
    invoiceService = inject(InvoiceService);

    update(id: string, field: keyof Product, value: any) {
        this.invoiceService.updateProduct(id, field, value);
    }

    // Image Upload Logic
    onFileSelected(event: any, productId: string) {
        if (event.target.files) {
            this.handleFiles(event.target.files, productId);
        }
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        // Add visual cue
    }

    onDragLeave(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
    }

    onDrop(event: DragEvent, productId: string) {
        event.preventDefault();
        event.stopPropagation();
        if (event.dataTransfer?.files) {
            this.handleFiles(event.dataTransfer.files, productId);
        }
    }

    handleFiles(fileList: FileList, productId: string) {
        Array.from(fileList).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e: any) => {
                    this.invoiceService.addProductImage(productId, file, e.target.result, 'M');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    updateImageSize(productId: string, imageId: string, event: Event) {
        const select = event.target as HTMLSelectElement;
        const newSize = select.value as 'S' | 'M' | 'L' | 'XL' | 'XXL';
        this.invoiceService.updateProductImageSize(productId, imageId, newSize);
    }

    trackById(index: number, item: any): string {
        return item.id;
    }
}
