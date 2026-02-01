import { Injectable } from '@angular/core';
// @ts-ignore
import * as XLSX from 'xlsx';
import { Invoice } from '../models/invoice.model';
import { saveAs } from 'file-saver';

@Injectable({
    providedIn: 'root'
})
export class ExcelService {
    private readonly STORAGE_KEY = 'invoice_history';

    constructor() { }

    private getHistory(): any[] {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    private saveHistory(history: any[]) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    }

    generateExcel(currentInvoice: Invoice) {
        // 1. Get existing history
        let history = this.getHistory();

        // 2. Format current invoice for Excel
        // Columns: Invoice No, Date, Customer Name, Product Summary, Total Amount
        const productSummary = currentInvoice.products.map(p => `${p.name} (x${p.quantity})`).join(', ');

        const newRow = {
            'Invoice No': currentInvoice.id,
            'Date': new Date(currentInvoice.date).toLocaleDateString(),
            'Customer': currentInvoice.customer.name,
            'Products': productSummary,
            'Total': currentInvoice.total
        };

        // 3. Append
        history.push(newRow);
        this.saveHistory(history);

        // 4. Create Workbook
        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(history);
        const wb: XLSX.WorkBook = { Sheets: { 'Invoices': ws }, SheetNames: ['Invoices'] };

        // 5. Write to file
        const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        this.saveAsExcelFile(excelBuffer, 'invoices');
    }

    private saveAsExcelFile(buffer: any, fileName: string): void {
        const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const EXCEL_EXTENSION = '.xlsx';
        const data: Blob = new Blob([buffer], { type: EXCEL_TYPE });
        saveAs(data, fileName + EXCEL_EXTENSION);
    }
}
