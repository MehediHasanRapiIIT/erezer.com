import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';
import { Invoice, ProductImage } from '../models/invoice.model';

@Injectable({
    providedIn: 'root'
})
export class PdfService {

    constructor() { }

    async generatePdf(invoice: Invoice) {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;

        // 1. Black Header (Full Width)
        doc.setFillColor(0, 0, 0); // Black
        doc.rect(0, 0, pageWidth, 40, 'F');

        // 2. Header Content (Logo & Company Name)
        try {
            // Load LOGO (ICO -> PNG via canvas helper)
            const logoData = await this.getBase64ImageFromURL(invoice.company.logoUrl, 'png');
            doc.addImage(logoData, 'PNG', 10, 10, 20, 20);
        } catch (e) {
            console.warn('Logo not found', e);
        }

        // Preload Watermark
        let watermarkData: string | null = null;
        try {
            watermarkData = await this.getBase64ImageFromURL('watermark.ico', 'png');
        } catch (e) {
            console.warn('Watermark not found', e);
        }

        doc.setFontSize(20);
        doc.setTextColor(255, 255, 255); // White Text
        doc.text(invoice.company.name, 35, 20);

        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255); // White Text
        doc.text(invoice.company.address, 35, 26);
        doc.text(`Email: ${invoice.company.email} | Phone: ${invoice.company.phone}`, 35, 31);

        // INVOICE Label
        doc.setFontSize(24);
        doc.text('INVOICE', pageWidth - 10, 25, { align: 'right' });

        // Reset Text Color for Body
        doc.setTextColor(0, 0, 0);

        // 3. Invoice Details (Right Side below Header)
        doc.setFontSize(10);
        let rightColY = 50;
        doc.setFont('helvetica', 'normal');
        doc.text(`Invoice Id: ${invoice.id}`, pageWidth - 10, rightColY, { align: 'right' });

        rightColY += 10;
        doc.setFont('helvetica', 'normal');
        doc.text('DATE', pageWidth - 10, rightColY, { align: 'right' });
        doc.setFont('helvetica', 'bold');
        doc.text(new Date(invoice.date).toLocaleDateString('en-GB').replace(/\//g, '-'), pageWidth - 10, rightColY + 5, { align: 'right' });

        // 4. Customer Details (Left Side below Header)
        let leftColY = 50;
        doc.setFont('helvetica', 'normal');
        doc.text('BILL TO', 10, leftColY);

        leftColY += 6;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(invoice.customer.name, 10, leftColY);

        leftColY += 5;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(invoice.customer.address, 10, leftColY);

        let contactY = leftColY + 5;
        if (invoice.customer.mobile) {
            doc.text(`Mobile: ${invoice.customer.mobile}`, 10, contactY);
            contactY += 5;
        }
        doc.text(invoice.customer.email, 10, contactY);

        // 5. Product Table
        const head = [['ITEM DESCRIPTION', 'QTY', 'UNIT PRICE', 'AMOUNT']];
        const data = invoice.products.map(p => [
            p.name + (p.description ? `\n${p.description}` : ''),
            p.quantity,
            `Tk ${p.unitPrice.toFixed(2)}`,
            `Tk ${p.subtotal.toFixed(2)}`
        ]);

        // Helper to draw watermark
        const drawWatermark = () => {
            if (watermarkData) {
                doc.saveGraphicsState();
                doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
                const w = 100;
                const h = 100;
                const x = (pageWidth - w) / 2;
                const y = (pageHeight - h) / 2;
                doc.addImage(watermarkData, 'PNG', x, y, w, h);
                doc.restoreGraphicsState();
            }
        };

        autoTable(doc, {
            startY: 85,
            head: head,
            body: data,
            theme: 'grid',
            headStyles: {
                fillColor: [0, 0, 0],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'center',
                lineWidth: 0.5,
                lineColor: [0, 0, 0]
            },
            styles: {
                fontSize: 9,
                lineWidth: 0.1,
                lineColor: [200, 200, 200]
            },
            columnStyles: {
                0: { cellWidth: 90 },
                1: { cellWidth: 20, halign: 'center' },
                2: { cellWidth: 30, halign: 'right' },
                3: { cellWidth: 30, halign: 'right' }
            },
            didDrawPage: (data: any) => {
                drawWatermark();
            }
        });

        // 6. Totals
        let finalY = (doc as any).lastAutoTable.finalY + 10;

        const summaryX = pageWidth - 80;
        const summaryWidth = 70;

        // Background for total (Light Grey)
        doc.setFillColor(245, 245, 245);
        doc.rect(summaryX - 5, finalY - 5, summaryWidth + 10, 35, 'F');

        doc.setFontSize(9);
        doc.setTextColor(0);
        doc.text(`Subtotal:`, summaryX, finalY);
        doc.text(`Tk ${invoice.subTotal.toFixed(2)}`, pageWidth - 10, finalY, { align: 'right' });

        finalY += 6;
        doc.text(`Discount:`, summaryX, finalY);
        doc.setTextColor(255, 0, 0); // Red for discount
        doc.text(`-Tk ${invoice.discount.toFixed(2)}`, pageWidth - 10, finalY, { align: 'right' });

        finalY += 8;
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0); // Black for Total Text
        doc.setFont('helvetica', 'bold');
        doc.text(`Total:`, summaryX, finalY);
        doc.text(`Tk ${invoice.total.toFixed(2)}`, pageWidth - 10, finalY, { align: 'right' });

        // 7. Product Images
        finalY += 30; // Spacing

        // Check if we need a new page
        if (finalY > pageHeight - 50) {
            doc.addPage();
            drawWatermark();
            finalY = 20;
        }

        // Collect all images and convert to JPEG
        const allImages: { data: string, size: string, parentName: string }[] = [];
        const imageConversionPromises: Promise<void>[] = [];

        // Prepare images with dimensions
        const preparedProducts: {
            name: string,
            images: { data: string, width: number, height: number, size: string }[]
        }[] = [];

        const productsWithImages = invoice.products.filter(p => p.images && p.images.length > 0);

        for (const p of productsWithImages) {
            const processedImages = [];
            for (const img of p.images) {
                try {
                    // Use getImageDetails directly
                    const details = await this.getImageDetails(img.url, 'jpeg');
                    processedImages.push({ ...details, size: img.size });
                } catch (e) {
                    console.error('Failed to load image', e);
                }
            }
            if (processedImages.length > 0) {
                preparedProducts.push({ name: p.name, images: processedImages });
            }
        }

        // Render Loop
        for (const p of preparedProducts) {
            // Check Space for Product Header
            if (finalY + 15 > pageHeight - 20) {
                doc.addPage();
                drawWatermark();
                finalY = 20;
            }

            // Product Name
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'bold');
            doc.text(p.name, 10, finalY);
            finalY += 5;

            // Line
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.1);
            doc.line(10, finalY, pageWidth - 10, finalY);
            finalY += 10;

            let currentX = 10;
            const rowMaxHeight = 70;

            for (const img of p.images) {
                const aspectRatio = img.width / img.height;
                let displayH = 50;
                let displayW = displayH * aspectRatio;

                // Max dimensions check (Width)
                if (displayW > (pageWidth - 20)) {
                    displayW = pageWidth - 20;
                    displayH = displayW / aspectRatio;
                }

                // Wrap to next line if needed
                if (currentX + displayW > pageWidth - 10) {
                    currentX = 10;
                    finalY += rowMaxHeight + 10;

                    // Check page overflow
                    if (finalY + img.height > pageHeight - 20) {
                        doc.addPage();
                        drawWatermark();
                        finalY = 20;
                    }
                }

                // Check page overflow (Vertical)
                if (finalY + displayH + 10 > pageHeight - 10) {
                    doc.addPage();
                    drawWatermark();
                    finalY = 20;
                    currentX = 10;
                }

                try {
                    doc.addImage(img.data, 'JPEG', currentX, finalY, displayW, displayH);

                    // Caption
                    doc.setFillColor(0, 0, 0);
                    doc.rect(currentX, finalY + displayH, displayW, 6, 'F');

                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'bold');
                    doc.text(`Size: ${img.size}`, currentX + displayW / 2, finalY + displayH + 4, { align: 'center' });
                } catch (e) {
                    console.warn('Draw error', e);
                }

                currentX += displayW + 10;
            }
            finalY += rowMaxHeight + 10;
        }

        doc.save(`Invoice_${invoice.id}.pdf`);
    }

    private getImageDetails(url: string, format: 'png' | 'jpeg' = 'png'): Promise<{ data: string, width: number, height: number }> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.setAttribute("crossOrigin", "anonymous");
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    if (format === 'jpeg') {
                        ctx.fillStyle = "#FFFFFF";
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                    ctx.drawImage(img, 0, 0);

                    const mimeType = format === 'jpeg' ? "image/jpeg" : "image/png";
                    const quality = format === 'jpeg' ? 0.8 : undefined;

                    const dataURL = canvas.toDataURL(mimeType, quality);
                    resolve({ data: dataURL, width: img.width, height: img.height });
                } else {
                    reject(new Error("Canvas context is null"));
                }
            };
            img.onerror = error => reject(error);
            img.src = url;
        });
    }

    private getBase64ImageFromURL(url: string, format: 'png' | 'jpeg' = 'png'): Promise<string> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.setAttribute("crossOrigin", "anonymous");
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    if (format === 'jpeg') {
                        // Fill white background for JPEGs (handling transparency)
                        ctx.fillStyle = "#FFFFFF";
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                    ctx.drawImage(img, 0, 0);

                    // Handle format
                    const mimeType = format === 'jpeg' ? "image/jpeg" : "image/png";
                    const quality = format === 'jpeg' ? 0.8 : undefined;

                    const dataURL = canvas.toDataURL(mimeType, quality);
                    resolve(dataURL);
                } else {
                    reject(new Error("Canvas context is null"));
                }
            };
            img.onerror = error => {
                reject(error);
            };
            img.src = url;
        });
    }
}
