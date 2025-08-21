// server/routes/printer.js - Rutas completas de impresión
const express = require('express');
const router = express.Router();
const PrintController = require('../controllers/printController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Todas las rutas de impresión requieren autenticación
router.use(authenticateToken);

// ============================
// RUTAS BÁSICAS DE IMPRESIÓN
// ============================

// Imprimir ticket de venta específica
// POST /api/printer/sale/:saleId
router.post('/sale/:saleId', PrintController.printSaleTicket);

// Reimprimir última venta del usuario actual
// POST /api/printer/reprint-last
router.post('/reprint-last', PrintController.reprintLastSale);

// Imprimir ticket de prueba para verificar conexión
// POST /api/printer/test
router.post('/test', PrintController.printTestTicket);

// Verificar estado de la impresora
// GET /api/printer/status
router.get('/status', PrintController.checkPrinterStatus);

// Obtener configuración actual de la impresora
// GET /api/printer/config
router.get('/config', PrintController.getPrinterConfig);

// ============================
// RUTAS DE ADMINISTRADOR
// ============================

// Imprimir reporte diario (solo administradores)
// POST /api/printer/daily-report?date=2024-01-15
router.post('/daily-report', requireAdmin, PrintController.printDailyReport);

// Imprimir reporte personalizado (solo administradores)
// POST /api/printer/custom-report
// Body: { startDate, endDate, reportType }
router.post('/custom-report', requireAdmin, PrintController.printCustomReport);

// Imprimir backup de ventas del día (solo administradores)
// POST /api/printer/backup?date=2024-01-15
router.post('/backup', requireAdmin, PrintController.printBackupReport);

// Configurar impresora (solo administradores)
// POST /api/printer/configure
// Body: { interface, width }
router.post('/configure', requireAdmin, PrintController.configurePrinter);

// ============================
// RUTAS DE INFORMACIÓN
// ============================

// Obtener ayuda sobre las rutas disponibles
router.get('/help', (req, res) => {
    res.json({
        success: true,
        message: 'Rutas de impresión disponibles',
        routes: {
            basic: [
                {
                    method: 'POST',
                    path: '/api/printer/sale/:saleId',
                    description: 'Imprimir ticket de venta específica',
                    auth: 'Usuario autenticado'
                },
                {
                    method: 'POST',
                    path: '/api/printer/reprint-last',
                    description: 'Reimprimir última venta del usuario',
                    auth: 'Usuario autenticado'
                },
                {
                    method: 'POST',
                    path: '/api/printer/test',
                    description: 'Imprimir ticket de prueba',
                    auth: 'Usuario autenticado'
                },
                {
                    method: 'GET',
                    path: '/api/printer/status',
                    description: 'Verificar estado de la impresora',
                    auth: 'Usuario autenticado'
                },
                {
                    method: 'GET',
                    path: '/api/printer/config',
                    description: 'Obtener configuración de impresora',
                    auth: 'Usuario autenticado'
                }
            ],
            admin: [
                {
                    method: 'POST',
                    path: '/api/printer/daily-report',
                    description: 'Imprimir reporte diario',
                    auth: 'Solo administradores',
                    params: 'date (opcional)'
                },
                {
                    method: 'POST',
                    path: '/api/printer/custom-report',
                    description: 'Imprimir reporte personalizado',
                    auth: 'Solo administradores',
                    body: '{ startDate, endDate, reportType }'
                },
                {
                    method: 'POST',
                    path: '/api/printer/backup',
                    description: 'Imprimir backup de ventas',
                    auth: 'Solo administradores',
                    params: 'date (opcional)'
                },
                {
                    method: 'POST',
                    path: '/api/printer/configure',
                    description: 'Configurar impresora',
                    auth: 'Solo administradores',
                    body: '{ interface: "printer:EPSON TM-T20III", width: 48 }'
                }
            ]
        },
        examples: {
            interfaces: [
                'printer:EPSON TM-T20III (USB)',
                'tcp://192.168.1.100:9100 (Red)',
                'serial:COM1 (Puerto serie)'
            ]
        }
    });
});

module.exports = router;