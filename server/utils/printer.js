// server/utils/printer.js - Formato profesional igual a la imagen
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

class POSPrinter {
    constructor() {
        this.printerName = process.env.PRINTER_NAME || 'EPSON TM-T20III Receipt';
        this.isConnected = false;
        this.tempDir = path.join(__dirname, '../../temp');
        // Ancho perfecto para el formato profesional
        this.thermalWidth = 40;
        this.initPrinter();
    }

    async initPrinter() {
        try {
            // Crear directorio temporal si no existe
            if (!fs.existsSync(this.tempDir)) {
                fs.mkdirSync(this.tempDir, { recursive: true });
            }

            // Verificar que la impresora esté instalada en Windows
            const printers = this.getWindowsPrinters();
            const found = printers.some(printer => 
                printer.toLowerCase().includes('epson') || 
                printer.toLowerCase().includes('tm-t20')
            );

            if (found) {
                this.isConnected = true;
                console.log('✅ Impresora EPSON detectada en Windows');
                console.log(`📋 Usando: ${this.printerName}`);
            } else {
                console.log('⚠️ Impresora EPSON no encontrada en la lista de Windows');
                this.isConnected = false;
            }
            
        } catch (error) {
            console.error('❌ Error verificando impresoras de Windows:', error.message);
            this.isConnected = false;
        }
    }

    getWindowsPrinters() {
        try {
            const { execSync } = require('child_process');
            const result = execSync('wmic printer get name', { encoding: 'utf8' });
            return result.split('\n')
                .map(line => line.trim())
                .filter(line => line && line !== 'Name')
                .filter(line => line.length > 0);
        } catch (error) {
            console.warn('No se pueden obtener impresoras de Windows');
            return [];
        }
    }

    // Funciones de formato profesional
    centerText(text, width = this.thermalWidth) {
        const spaces = Math.max(0, Math.floor((width - text.length) / 2));
        return ' '.repeat(spaces) + text;
    }

    alignRight(text, width = this.thermalWidth) {
        const spaces = Math.max(0, width - text.length);
        return ' '.repeat(spaces) + text;
    }

    // Función para crear líneas de productos como en la imagen
    formatProductLine(qty, description, unitPrice, total) {
        // Formato exacto como en la imagen
        const qtyStr = qty.toString().padEnd(3);
        const priceStr = unitPrice.toFixed(2).padStart(8);
        const totalStr = total.toFixed(2).padStart(8);
        
        // Primera línea: cantidad + descripción + precio + total
        const firstLine = `${qtyStr} ${description.padEnd(18)} ${priceStr} ${totalStr}`;
        
        return firstLine;
    }

    // TICKET DE PRUEBA CON FORMATO PROFESIONAL
    createTestTicket() {
        const now = new Date();
        const ticketNumber = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
        
        return `
${this.centerText(`Nº ${ticketNumber}`)}
${this.centerText('EN MESA')}
FECHA: ${now.toLocaleDateString('es-ES')} ${now.toLocaleTimeString('es-ES')}
SEÑOR(ES): SIN NOMBRE
----------------------------------------
CANT    DESCRIPCIÓN         P.U. TOTAL
----------------------------------------
  1  PIZZA MARGHERITA      25.00  25.00
  
  2  COCA COLA 350ML        8.00  16.00
  
  1  ENSALADA CAESAR       15.00  15.00
  
----------------------------------------
                      TOTAL Bs: 56.00

OBS.: TICKET DE PRUEBA

CAJERO: ADMINISTRADOR
GRACIAS POR SU PREFERENCIA...!!!
`;
    }

    // TICKET DE VENTA CON FORMATO PROFESIONAL IGUAL A LA IMAGEN
    createSaleTicket(saleData) {
        const ticketNumber = saleData.id.toString().padStart(6, '0');
        const orderType = saleData.order_type === 'takeaway' ? 'PARA LLEVAR' : 'EN MESA';
        
        let content = `
${this.centerText(`Nº ${ticketNumber}`)}
${this.centerText(orderType)}
FECHA: ${moment().format('DD/MM/YYYY HH:mm:ss')}`;

        // Información del cliente (igual a la imagen)
        if (saleData.customer_name && saleData.customer_name !== 'SIN NOMBRE') {
            content += `\nSEÑOR(ES): ${saleData.customer_name.toUpperCase()}`;
        } else {
            content += `\nSEÑOR(ES): SIN NOMBRE`;
        }

        // Línea separadora
        content += `\n${'-'.repeat(40)}`;
        
        // Cabecera de productos (igual a la imagen)
        content += `\nCANT    DESCRIPCIÓN         P.U. TOTAL`;
        content += `\n${'-'.repeat(40)}`;

        // Productos con formato exacto de la imagen
        if (saleData.details && saleData.details.length > 0) {
            saleData.details.forEach(item => {
                const qty = item.quantity;
                const description = item.product_name.toUpperCase();
                const unitPrice = parseFloat(item.unit_price);
                const total = parseFloat(item.subtotal);
                
                // Línea principal del producto
                const qtyStr = qty.toString().padEnd(3);
                const priceStr = unitPrice.toFixed(2).padStart(8);
                const totalStr = total.toFixed(2).padStart(8);
                
                content += `\n${qtyStr} ${description.padEnd(18)} ${priceStr} ${totalStr}`;
                content += `\n`; // Línea vacía después de cada producto como en la imagen
            });
        }

        content += `${'-'.repeat(40)}`;
        
        // Total (igual a la imagen)
        const total = parseFloat(saleData.total || 0);
        content += `\n${this.alignRight(`TOTAL Bs: ${total.toFixed(2)}`)}`;
        
        content += `\n`;
        
        // Observaciones (si existen)
        if (saleData.observations) {
            content += `\nOBS.: ${saleData.observations.toUpperCase()}`;
            content += `\n`;
        }

        // Información del cajero (igual a la imagen)
        const cajero = saleData.user_name || 'SISTEMA';
        content += `\nCAJERO: ${cajero.toUpperCase()}`;
        content += `\nGRACIAS POR SU PREFERENCIA...!!!`;

        return content;
    }

    // PowerShell optimizado para el formato profesional
    async printTicket(content, filename = 'ticket') {
        return new Promise((resolve, reject) => {
            try {
                const filePath = path.join(this.tempDir, `${filename}.txt`);
                fs.writeFileSync(filePath, content, 'utf8');

                console.log(`🖨️ Enviando ticket profesional a impresora: ${this.printerName}`);
                
                // Script PowerShell para formato profesional
                const psScript = `
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

$content = Get-Content "${filePath}" -Raw

# Configurar impresión para formato profesional
$printDocument = New-Object System.Drawing.Printing.PrintDocument
$printDocument.PrinterSettings.PrinterName = "${this.printerName}"

# Márgenes optimizados para formato profesional
$printDocument.DefaultPageSettings.Margins = New-Object System.Drawing.Printing.Margins(5, 5, 5, 5)

# Configurar papel térmico
$paperSizes = $printDocument.PrinterSettings.PaperSizes
$thermalPaper = $null
foreach ($size in $paperSizes) {
    if ($size.PaperName -like "*80*" -or $size.PaperName -like "*Thermal*" -or $size.Width -eq 315) {
        $thermalPaper = $size
        break
    }
}

if ($thermalPaper -ne $null) {
    $printDocument.DefaultPageSettings.PaperSize = $thermalPaper
} else {
    $customPaper = New-Object System.Drawing.Printing.PaperSize("Thermal80mm", 315, 3150)
    $printDocument.DefaultPageSettings.PaperSize = $customPaper
}

$printDocument.add_PrintPage({
    param($sender, $e)
    
    # Fuente profesional para ticket
    $font = New-Object System.Drawing.Font("Courier New", 9, [System.Drawing.FontStyle]::Bold)
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Black)
    
    # Posicionamiento para formato profesional
    $x = 10  # Margen izquierdo para centrado
    $y = 8   # Margen superior mínimo
    $lineHeight = $font.GetHeight($e.Graphics)
    
    $lines = $content -split "\\r?\\n"
    foreach ($line in $lines) {
        if ($line.Trim() -ne "") {
            $e.Graphics.DrawString($line, $font, $brush, $x, $y)
        }
        $y += $lineHeight
        
        if ($y -gt $e.MarginBounds.Bottom) {
            break
        }
    }
    
    $font.Dispose()
    $brush.Dispose()
})

try {
    $printDocument.Print()
    Write-Host "✅ Ticket profesional impreso correctamente"
} catch {
    Write-Error "❌ Error en impresión: $_"
    throw $_
} finally {
    $printDocument.Dispose()
}
`;
                
                const psFilePath = path.join(this.tempDir, `${filename}.ps1`);
                fs.writeFileSync(psFilePath, psScript, 'utf8');
                
                const command = `powershell.exe -ExecutionPolicy Bypass -File "${psFilePath}"`;
                
                exec(command, { encoding: 'utf8' }, (error, stdout, stderr) => {
                    // Limpiar archivos temporales
                    try {
                        fs.unlinkSync(filePath);
                        fs.unlinkSync(psFilePath);
                    } catch (e) {
                        console.warn('No se pudieron eliminar archivos temporales');
                    }

                    if (error) {
                        console.error('❌ Error con PowerShell:', error.message);
                        reject(new Error(`Error en PowerShell: ${error.message}`));
                        return;
                    }

                    console.log('✅ Ticket PROFESIONAL impreso exitosamente');
                    resolve({
                        success: true,
                        message: 'Ticket profesional impreso - formato igual a la imagen',
                        method: 'PowerShell Professional Format'
                    });
                });

            } catch (error) {
                reject(new Error(`Error preparando impresión: ${error.message}`));
            }
        });
    }

    // Métodos principales
    async checkPrinterStatus() {
        try {
            const printers = this.getWindowsPrinters();
            const epsonPrinters = printers.filter(p => 
                p.toLowerCase().includes('epson') || 
                p.toLowerCase().includes('tm-t20')
            );

            return {
                connected: epsonPrinters.length > 0,
                message: epsonPrinters.length > 0 ? 
                    `✅ Impresora EPSON encontrada: ${epsonPrinters[0]}` : 
                    '❌ Impresora EPSON no encontrada en Windows',
                model: 'EPSON TM-T20III Receipt',
                interface: 'Windows PowerShell Professional Format',
                thermal_width: this.thermalWidth,
                available_printers: printers,
                epson_printers: epsonPrinters,
                using_printer: this.printerName
            };
            
        } catch (error) {
            return {
                connected: false,
                message: `Error verificando impresoras: ${error.message}`
            };
        }
    }

    async printTestTicket() {
        if (!this.isConnected) {
            throw new Error('Impresora no encontrada en Windows. Verifica que esté instalada.');
        }

        try {
            const content = this.createTestTicket();
            const result = await this.printTicket(content, 'test_ticket');
            
            console.log('✅ Ticket de prueba profesional enviado');
            return {
                success: true,
                message: 'Test profesional impreso - formato como la imagen',
                printer: this.printerName
            };
            
        } catch (error) {
            console.error('❌ Error imprimiendo ticket de prueba:', error);
            throw new Error(`Error en impresión: ${error.message}`);
        }
    }

    async printSaleTicket(saleData) {
        if (!this.isConnected) {
            throw new Error('Impresora no encontrada en Windows.');
        }

        try {
            const content = this.createSaleTicket(saleData);
            const result = await this.printTicket(content, `sale_${saleData.id}`);
            
            console.log('✅ Ticket de venta profesional impreso');
            return {
                success: true,
                message: 'Ticket profesional impreso - igual a la imagen'
            };
            
        } catch (error) {
            console.error('❌ Error imprimiendo ticket de venta:', error);
            throw new Error(`Error en impresión: ${error.message}`);
        }
    }

    async printDailyReport(reportData) {
        if (!this.isConnected) {
            throw new Error('Impresora no conectada');
        }
        // Implementación del reporte diario...
    }

    async configurePrinter(config) {
        try {
            if (config.printerName) {
                this.printerName = config.printerName;
            }
            if (config.thermalWidth) {
                this.thermalWidth = config.thermalWidth;
            }
            await this.initPrinter();
            return { success: true, message: 'Impresora reconfigurada correctamente' };
        } catch (error) {
            throw new Error(`Error configurando impresora: ${error.message}`);
        }
    }
}

module.exports = new POSPrinter();