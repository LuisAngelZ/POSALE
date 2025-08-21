// server/utils/printer.js - Módulo de impresión térmica
const { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } = require('node-thermal-printer');
const moment = require('moment');

class POSPrinter {
    constructor() {
        this.printer = null;
        this.isConnected = false;
        this.initPrinter();
    }

    initPrinter() {
        try {
            this.printer = new ThermalPrinter({
                type: PrinterTypes.EPSON,  // Para tu Epson TM-T20IIIL
                interface: process.env.PRINTER_INTERFACE || 'tcp://192.168.1.100:9100', // IP de la impresora
                characterSet: CharacterSet.PC850_MULTILINGUAL,
                width: 48, // Ancho de caracteres (típico para 80mm)
                removeSpecialCharacters: false,
                lineCharacter: "-",
            });

            this.isConnected = true;
            console.log('✅ Impresora térmica inicializada correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando impresora:', error.message);
            this.isConnected = false;
        }
    }

    // Configurar datos de la empresa
    getCompanyInfo() {
        return {
            name: process.env.COMPANY_NAME || 'TU EMPRESA',
            address: process.env.COMPANY_ADDRESS || 'Dirección de tu empresa',
            city: process.env.COMPANY_CITY || 'Cochabamba, Bolivia',
            phone: process.env.COMPANY_PHONE || 'Tel: +591 XXX XXXXX',
            email: process.env.COMPANY_EMAIL || 'email@empresa.com',
            nit: process.env.COMPANY_NIT || 'NIT: XXXXXXXXX'
        };
    }

    // Imprimir ticket de venta
    async printSaleTicket(saleData) {
        if (!this.isConnected) {
            throw new Error('Impresora no conectada');
        }

        try {
            const company = this.getCompanyInfo();
            
            // Limpiar buffer
            this.printer.clear();
            
            // Encabezado de la empresa
            this.printer.alignCenter();
            this.printer.setTextSize(1, 1);
            this.printer.bold(true);
            this.printer.println(company.name);
            this.printer.bold(false);
            this.printer.setTextSize(0, 0);
            this.printer.println(company.address);
            this.printer.println(company.city);
            this.printer.println(company.phone);
            this.printer.println(company.email);
            this.printer.println(company.nit);
            
            // Línea separadora
            this.printer.drawLine();
            
            // Información de la venta
            this.printer.alignLeft();
            this.printer.bold(true);
            this.printer.println(`TICKET DE VENTA #${saleData.id}`);
            this.printer.bold(false);
            
            this.printer.println(`Fecha: ${moment().format('DD/MM/YYYY HH:mm:ss')}`);
            this.printer.println(`Cajero: ${saleData.user_name || 'Sistema'}`);
            
            if (saleData.customer_name) {
                this.printer.println(`Cliente: ${saleData.customer_name}`);
            }
            
            if (saleData.customer_nit) {
                this.printer.println(`NIT/CI: ${saleData.customer_nit}`);
            }
            
            this.printer.println(`Tipo: ${saleData.order_type === 'takeaway' ? 'Para Llevar' : 'En Mesa'}`);
            
            if (saleData.table_number) {
                this.printer.println(`Mesa: ${saleData.table_number}`);
            }
            
            if (saleData.observations) {
                this.printer.println(`Obs: ${saleData.observations}`);
            }
            
            // Línea separadora
            this.printer.drawLine();
            
            // Encabezados de productos
            this.printer.bold(true);
            this.printer.tableCustom([
                { text: "Producto", align: "LEFT", width: 0.6 },
                { text: "Cant", align: "CENTER", width: 0.15 },
                { text: "P.Unit", align: "RIGHT", width: 0.12 },
                { text: "Total", align: "RIGHT", width: 0.13 }
            ]);
            this.printer.bold(false);
            this.printer.drawLine();
            
            // Productos
            if (saleData.details && saleData.details.length > 0) {
                saleData.details.forEach(item => {
                    // Nombre del producto (puede ocupar varias líneas)
                    this.printer.tableCustom([
                        { text: item.product_name, align: "LEFT", width: 0.6 },
                        { text: item.quantity.toString(), align: "CENTER", width: 0.15 },
                        { text: `$${item.unit_price.toFixed(2)}`, align: "RIGHT", width: 0.12 },
                        { text: `$${item.subtotal.toFixed(2)}`, align: "RIGHT", width: 0.13 }
                    ]);
                });
            }
            
            // Línea separadora
            this.printer.drawLine();
            
            // Totales
            this.printer.alignRight();
            this.printer.println(`Subtotal: $${saleData.subtotal.toFixed(2)}`);
            this.printer.setTextSize(1, 1);
            this.printer.bold(true);
            this.printer.println(`TOTAL: $${saleData.total.toFixed(2)}`);
            this.printer.bold(false);
            this.printer.setTextSize(0, 0);
            
            this.printer.alignLeft();
            this.printer.println(`Pagado: $${saleData.paid_amount.toFixed(2)}`);
            this.printer.println(`Cambio: $${saleData.change_amount.toFixed(2)}`);
            
            // Pie del ticket
            this.printer.newLine();
            this.printer.alignCenter();
            this.printer.println("¡Gracias por su compra!");
            this.printer.println("Que tenga un excelente día");
            
            // Código QR opcional (si tienes website)
            // this.printer.printQR("https://tuempresa.com", {
            //     cellSize: 3,
            //     correction: 'M'
            // });
            
            this.printer.newLine();
            this.printer.newLine();
            this.printer.newLine();
            
            // Cortar papel
            this.printer.cut();
            
            // Enviar a impresora
            await this.printer.execute();
            
            console.log('✅ Ticket impreso correctamente');
            return { success: true, message: 'Ticket impreso correctamente' };
            
        } catch (error) {
            console.error('❌ Error imprimiendo ticket:', error);
            throw new Error(`Error en impresión: ${error.message}`);
        }
    }

    // Imprimir reporte de cierre del día
    async printDailyReport(reportData) {
        if (!this.isConnected) {
            throw new Error('Impresora no conectada');
        }

        try {
            const company = this.getCompanyInfo();
            
            this.printer.clear();
            
            // Encabezado
            this.printer.alignCenter();
            this.printer.setTextSize(1, 1);
            this.printer.bold(true);
            this.printer.println(company.name);
            this.printer.println("REPORTE DIARIO");
            this.printer.bold(false);
            this.printer.setTextSize(0, 0);
            
            this.printer.println(moment().format('DD/MM/YYYY'));
            this.printer.drawLine();
            
            // Resumen de ventas
            this.printer.alignLeft();
            this.printer.bold(true);
            this.printer.println("RESUMEN DEL DÍA");
            this.printer.bold(false);
            
            this.printer.println(`Total de ventas: ${reportData.total_sales}`);
            this.printer.println(`Monto total: $${reportData.total_amount.toFixed(2)}`);
            this.printer.println(`Venta promedio: $${reportData.average_sale.toFixed(2)}`);
            
            this.printer.drawLine();
            
            // Productos más vendidos
            if (reportData.top_products && reportData.top_products.length > 0) {
                this.printer.bold(true);
                this.printer.println("PRODUCTOS MÁS VENDIDOS");
                this.printer.bold(false);
                
                reportData.top_products.forEach((product, index) => {
                    this.printer.println(`${index + 1}. ${product.name} (${product.quantity} uds)`);
                });
                
                this.printer.drawLine();
            }
            
            // Ventas por usuario
            if (reportData.sales_by_user) {
                this.printer.bold(true);
                this.printer.println("VENTAS POR USUARIO");
                this.printer.bold(false);
                
                Object.entries(reportData.sales_by_user).forEach(([user, data]) => {
                    this.printer.println(`${user}: ${data.count} ventas - $${data.amount.toFixed(2)}`);
                });
                
                this.printer.drawLine();
            }
            
            // Pie del reporte
            this.printer.alignCenter();
            this.printer.println(`Reporte generado: ${moment().format('DD/MM/YYYY HH:mm:ss')}`);
            
            this.printer.newLine();
            this.printer.newLine();
            this.printer.cut();
            
            await this.printer.execute();
            
            console.log('✅ Reporte diario impreso correctamente');
            return { success: true, message: 'Reporte impreso correctamente' };
            
        } catch (error) {
            console.error('❌ Error imprimiendo reporte:', error);
            throw new Error(`Error en impresión: ${error.message}`);
        }
    }

    // Imprimir ticket de prueba
    async printTestTicket() {
        if (!this.isConnected) {
            throw new Error('Impresora no conectada');
        }

        try {
            this.printer.clear();
            
            this.printer.alignCenter();
            this.printer.setTextSize(1, 1);
            this.printer.bold(true);
            this.printer.println("TICKET DE PRUEBA");
            this.printer.bold(false);
            this.printer.setTextSize(0, 0);
            
            this.printer.drawLine();
            
            this.printer.alignLeft();
            this.printer.println("✅ Impresora conectada correctamente");
            this.printer.println(`Fecha: ${moment().format('DD/MM/YYYY HH:mm:ss')}`);
            this.printer.println("Modelo: Epson TM-T20IIIL");
            this.printer.println("Estado: Funcionando");
            
            this.printer.drawLine();
            
            // Prueba de caracteres especiales
            this.printer.println("Prueba de caracteres:");
            this.printer.println("ñáéíóúü ÑÁÉÍÓÚÜ");
            this.printer.println("¡¿°±×÷§¶");
            
            this.printer.drawLine();
            
            this.printer.alignCenter();
            this.printer.println("Prueba completada exitosamente");
            
            this.printer.newLine();
            this.printer.newLine();
            this.printer.cut();
            
            await this.printer.execute();
            
            console.log('✅ Ticket de prueba impreso');
            return { success: true, message: 'Ticket de prueba impreso' };
            
        } catch (error) {
            console.error('❌ Error en ticket de prueba:', error);
            throw new Error(`Error en prueba: ${error.message}`);
        }
    }

    // Verificar estado de la impresora
    async checkPrinterStatus() {
        try {
            if (!this.printer) {
                return { connected: false, message: 'Impresora no inicializada' };
            }

            // Intentar obtener el estado
            const isConnected = await this.printer.isPrinterConnected();
            
            return {
                connected: isConnected,
                message: isConnected ? 'Impresora conectada' : 'Impresora desconectada',
                model: 'Epson TM-T20IIIL',
                interface: this.printer.config.interface
            };
            
        } catch (error) {
            return {
                connected: false,
                message: `Error verificando impresora: ${error.message}`
            };
        }
    }

    // Configurar impresora (para uso manual)
    async configurePrinter(config) {
        try {
            this.printer = new ThermalPrinter({
                type: PrinterTypes.EPSON,
                interface: config.interface || 'tcp://192.168.1.100:9100',
                characterSet: CharacterSet.PC850_MULTILINGUAL,
                width: config.width || 48,
                removeSpecialCharacters: false,
                lineCharacter: "-",
            });

            this.isConnected = true;
            return { success: true, message: 'Impresora configurada correctamente' };
            
        } catch (error) {
            this.isConnected = false;
            throw new Error(`Error configurando impresora: ${error.message}`);
        }
    }
}

// Exportar instancia singleton
module.exports = new POSPrinter();