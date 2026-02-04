const puppeteer = require('puppeteer');
const QRCode = require('qrcode');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class EWayBillService {
    /**
     * Generate a QR Code as Base64 string
     * @param {Object} data 
     * @returns {Promise<string>}
     */
    static async generateQRCode(data) {
        try {
            const jsonStr = JSON.stringify(data);
            return await QRCode.toDataURL(jsonStr);
        } catch (error) {
            console.error('QR Code generation error:', error);
            throw error;
        }
    }

    /**
     * Generate an e-Way Bill PDF
     * @param {Object} billData 
     * @returns {Promise<Buffer>}
     */
    static async generatePDF(billData) {
        let browser;
        try {
            browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();

            // Read HTML template
            const templatePath = path.join(__dirname, '../templates/ewayBill.html');
            let htmlContent = fs.readFileSync(templatePath, 'utf8');

            // Simple template replacement
            // In a real app, use Handlebars or EJS
            const placeholders = {
                billNo: billData.billNo,
                generatedDate: billData.generatedDate,
                generatedBy: billData.generatedBy,
                validFrom: billData.validFrom,
                validUntil: billData.validUntil,
                qrCode: billData.qrCode,
                supplierGstin: billData.supplierGstin,
                dispatchPlace: billData.dispatchPlace,
                recipientGstin: billData.recipientGstin,
                deliveryPlace: billData.deliveryPlace,
                docNo: billData.docNo,
                docDate: billData.docDate,
                transactionType: billData.transactionType,
                vehicleNo: billData.vehicleNo,
                fromLocation: billData.fromLocation,
                cssPath: `file://${path.join(__dirname, '../public/ewayBill.css')}`
            };

            Object.keys(placeholders).forEach(key => {
                const regex = new RegExp(`{{${key}}}`, 'g');
                htmlContent = htmlContent.replace(regex, placeholders[key]);
            });

            // Handle goods array (basic simulation of Handlebars each)
            let goodsHtml = '';
            billData.goods.forEach(item => {
                goodsHtml += `
                    <tr>
                        <td>${item.hsnCode}</td>
                        <td>${item.productName}</td>
                        <td>${item.quantity}</td>
                        <td>${item.unit}</td>
                        <td>₹ ${item.value}</td>
                    </tr>
                `;
            });
            htmlContent = htmlContent.replace(/{{#each goods}}[\s\S]*{{\/each}}/, goodsHtml);

            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20px',
                    right: '20px',
                    bottom: '20px',
                    left: '20px'
                }
            });

            return pdfBuffer;
        } catch (error) {
            console.error('PDF generation error:', error);
            throw error;
        } finally {
            if (browser) await browser.close();
        }
    }

    /**
     * Bundle multiple PDFs into a zip
     * @param {Array<{name: string, buffer: Buffer}>} files 
     * @returns {Promise<Buffer>}
     */
    static async createZip(files) {
        return new Promise((resolve, reject) => {
            const chunks = [];
            const archive = archiver('zip', {
                zlib: { level: 9 }
            });

            archive.on('data', chunk => chunks.push(chunk));
            archive.on('end', () => resolve(Buffer.concat(chunks)));
            archive.on('error', err => reject(err));

            files.forEach(file => {
                archive.append(file.buffer, { name: file.name });
            });

            archive.finalize();
        });
    }
}

module.exports = EWayBillService;
