export interface Company {
    name: string;
    address: string;
    phone: string;
    email: string;
    logoUrl: string;
}

export interface Customer {
    name: string;
    address: string;
    phone?: string;
    mobile?: string;
    email: string;
}

export interface ProductImage {
    id: string; // unique id
    url: string; // base64 or object url
    size: 'S' | 'M' | 'L' | 'XL' | 'XXL';
    file?: File; // for upload handling
}

export interface Product {
    id: string;
    name: string;
    description: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    images: ProductImage[];
}

export interface Invoice {
    id: string; // e.g. INV-001
    date: Date;
    company: Company;
    customer: Customer;
    products: Product[];
    discount: number; // amount
    subTotal: number;
    total: number;
}
