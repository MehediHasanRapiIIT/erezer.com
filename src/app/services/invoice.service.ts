import { Injectable, signal, computed, effect } from '@angular/core';
import { Invoice, Product, Company, Customer, ProductImage } from '../models/invoice.model';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
    providedIn: 'root'
})
export class InvoiceService {

    // Default Company Data
    readonly defaultCompany: Company = {
        name: 'EREZER',
        address: '123 Business Rd, Tech City, TC 90210',
        phone: '+1 234 567 8900',
        email: 'contact@erezer.com',
        logoUrl: 'logo.ico'
    };

    // Signals
    company = signal<Company>(this.defaultCompany);
    customer = signal<Customer>({ name: '', address: '', email: '', mobile: '' });
    invoiceDate = signal<Date>(new Date());
    invoiceNumber = signal<string>(this.generateInvoiceNumber());

    products = signal<Product[]>([
        { id: uuidv4(), name: 'Sample Product', description: 'Description here', quantity: 1, unitPrice: 100, subtotal: 100, images: [] }
    ]);

    discount = signal<number>(0);

    // Computed values
    subTotal = computed(() => {
        return this.products().reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
    });

    total = computed(() => {
        return this.subTotal() - this.discount();
    });

    constructor() {
        // Auto-save or sync logic could go here
    }

    generateInvoiceNumber(): string {
        return 'INV-' + Math.floor(1000 + Math.random() * 9000);
    }

    addProduct() {
        this.products.update(products => [
            ...products,
            { id: uuidv4(), name: '', description: '', quantity: 1, unitPrice: 0, subtotal: 0, images: [] }
        ]);
    }

    removeProduct(id: string) {
        this.products.update(products => products.filter(p => p.id !== id));
    }

    clearAllProducts() {
        this.products.set([]);
    }

    updateProduct(id: string, field: keyof Product, value: any) {
        this.products.update(products => products.map(p => {
            if (p.id === id) {
                const updated = { ...p, [field]: value };
                if (field === 'quantity' || field === 'unitPrice') {
                    updated.subtotal = updated.quantity * updated.unitPrice;
                }
                return updated;
            }
            return p;
        }));
    }

    addProductImage(productId: string, file: File, url: string, size: 'S' | 'M' | 'L' | 'XL' | 'XXL' = 'M') {
        this.products.update(products => products.map(p => {
            if (p.id === productId) {
                return {
                    ...p,
                    images: [...p.images, { id: uuidv4(), url, size, file }]
                };
            }
            return p;
        }));
    }

    removeProductImage(productId: string, imageId: string) {
        this.products.update(products => products.map(p => {
            if (p.id === productId) {
                return { ...p, images: p.images.filter(img => img.id !== imageId) };
            }
            return p;
        }));
    }

    updateProductImageSize(productId: string, imageId: string, newSize: 'S' | 'M' | 'L' | 'XL' | 'XXL') {
        this.products.update(products => products.map(p => {
            if (p.id === productId) {
                return {
                    ...p,
                    images: p.images.map(img => {
                        if (img.id === imageId) {
                            return { ...img, size: newSize };
                        }
                        return img;
                    })
                };
            }
            return p;
        }));
    }

    getInvoiceData(): Invoice {
        return {
            id: this.invoiceNumber(),
            date: this.invoiceDate(),
            company: this.company(),
            customer: this.customer(),
            products: this.products(),
            discount: this.discount(),
            subTotal: this.subTotal(),
            total: this.total()
        };
    }
}
