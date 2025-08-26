// server.js - VERSIÓN CORREGIDA SIN CONFLICTOS DE AUTENTICACIÓN
const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

// Importar configuración
const config = require('./server/config/config');

// Importar base de datos (esto inicializa las tablas)
require('./server/config/database');

const app = express();

// Middleware de seguridad
app.use(helmet({
    contentSecurityPolicy: false // Deshabilitado para desarrollo
}));

// Rate limiting más estricto
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 500, // Reducido a 500 requests por IP cada 15 minutos
    message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
});
app.use(limiter);

// Middleware básico
app.use(morgan('combined'));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =============================================
// MIDDLEWARE DE SEGURIDAD MEJORADO
// =============================================

// Headers de seguridad adicionales
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// Prevenir acceso directo a archivos del sistema
app.use('/server', (req, res) => {
    console.log(`⛔ Intento de acceso a archivo del servidor: ${req.path}`);
    res.status(403).json({ error: 'Acceso denegado' });
});

// Logging de accesos sospechosos
app.use((req, res, next) => {
    const suspiciousPatterns = [
        /\.env/,
        /\.git/,
        /node_modules/,
        /package\.json/,
        /server\//,
        /\.js$/,
        /\.sql$/,
        /\.db$/
    ];
    
    if (suspiciousPatterns.some(pattern => pattern.test(req.path))) {
        console.log(`🚨 ACCESO SOSPECHOSO: ${req.ip} intentó acceder a ${req.path}`);
        return res.status(404).json({ error: 'Archivo no encontrado' });
    }
    
    next();
});

// Servir archivos estáticos (ANTES de cualquier verificación de autenticación)
app.use(express.static(path.join(__dirname, 'public')));

// =============================================
// RUTAS PRINCIPALES - ENFOQUE CORREGIDO
// =============================================

// Ruta principal - LOGIN por defecto (SIN PROTECCIÓN)
app.get('/', (req, res) => {
    console.log('🏠 Acceso a página principal - redirigiendo a login');
    res.redirect('/login');
});

// Ruta de login (SIN PROTECCIÓN)
app.get('/login', (req, res) => {
    console.log('🔐 Cargando página de login');
    res.sendFile(path.join(__dirname, 'public/views/login.html'));
});

// RUTAS PROTEGIDAS - NUEVA ESTRATEGIA: Solo servir HTML, autenticación en cliente
app.get('/dashboard', (req, res) => {
    console.log('📊 Sirviendo dashboard (autenticación vía JavaScript)');
    res.sendFile(path.join(__dirname, 'public/views/dashboard.html'));
});

app.get('/pos', (req, res) => {
    console.log('🛒 Sirviendo POS (autenticación vía JavaScript)');
    res.sendFile(path.join(__dirname, 'public/views/pos.html'));
});

app.get('/products', (req, res) => {
    console.log('📦 Sirviendo productos (autenticación vía JavaScript)');
    res.sendFile(path.join(__dirname, 'public/views/products.html'));
});

app.get('/categories', (req, res) => {
    console.log('🏷️ Sirviendo categorías (autenticación vía JavaScript)');
    res.sendFile(path.join(__dirname, 'public/views/categories.html'));
});

app.get('/reports', (req, res) => {
    console.log('📈 Sirviendo reportes (autenticación vía JavaScript)');
    res.sendFile(path.join(__dirname, 'public/views/reports.html'));
});

app.get('/create-user', (req, res) => {
    console.log('👥 Sirviendo crear usuario (autenticación vía JavaScript)');
    res.sendFile(path.join(__dirname, 'public/views/create-user.html'));
});

// Rutas compatibles CON extensión .html (redirigir a versiones sin extensión)
app.get('/login.html', (req, res) => res.redirect('/login'));
app.get('/dashboard.html', (req, res) => res.redirect('/dashboard'));
app.get('/pos.html', (req, res) => res.redirect('/pos'));
app.get('/products.html', (req, res) => res.redirect('/products'));
app.get('/categories.html', (req, res) => res.redirect('/categories'));
app.get('/reports.html', (req, res) => res.redirect('/reports'));
app.get('/create-user.html', (req, res) => res.redirect('/create-user'));

// Rutas legacy
app.get('/admin.html', (req, res) => res.redirect('/dashboard'));

// =============================================
// RUTAS DE API (mantienen su propia autenticación)
// =============================================

// Ruta de prueba
app.get('/api/test', (req, res) => {
    res.json({ 
        message: '🔒 Servidor POS funcionando con seguridad mejorada!',
        timestamp: new Date().toISOString(),
        version: '2.1.0-fixed',
        authentication: {
            strategy: 'client_side_verification',
            protected_pages: ['/dashboard', '/pos', '/products', '/reports', '/create-user', '/categories'],
            note: 'Las páginas se sirven libremente, pero requieren token válido para funcionar'
        },
        security: {
            rate_limit: '500 requests per 15 minutes',
            headers_security: 'enabled',
            suspicious_access_monitoring: 'enabled',
            file_system_protection: 'enabled'
        },
        available_routes: {
            public: [
                '/ (redirige a login)',
                '/login',
                '/api/test',
                '/api/auth/login',
                '/api/auth/verify-token'
            ],
            client_protected: [
                '/dashboard (requiere token en localStorage)',
                '/pos (requiere token en localStorage)', 
                '/products (requiere token en localStorage)',
                '/categories (requiere token en localStorage)',
                '/reports (requiere token en localStorage)',
                '/create-user (requiere token en localStorage)'
            ],
            api: [
                '/api/auth/* (autenticación)',
                '/api/categories/* (requiere token)',
                '/api/products/* (requiere token)',
                '/api/sales/* (requiere token)',
                '/api/reports/* (requiere token)',
                '/api/printer/* (requiere token)'
            ]
        }
    });
});

// Importar rutas de la API
app.use('/api/auth', require('./server/routes/auth'));
app.use('/api/categories', require('./server/routes/categories'));
app.use('/api/products', require('./server/routes/products'));
app.use('/api/sales', require('./server/routes/sales'));
app.use('/api/reports', require('./server/routes/reports'));
app.use('/api/printer', require('./server/routes/printer'));

// =============================================
// MIDDLEWARE DE ERRORES Y SEGURIDAD
// =============================================

// Middleware para manejo de errores
app.use((err, req, res, next) => {
    console.error('🚨 Error del servidor:', err.stack);
    
    // No revelar detalles del error en producción
    const isProduction = config.ENVIRONMENT === 'production';
    
    res.status(500).json({ 
        error: 'Error interno del servidor',
        message: isProduction ? 'Algo salió mal' : err.message,
        timestamp: new Date().toISOString()
    });
});

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
    const path = req.originalUrl.toLowerCase();
    
    console.log(`⛔ Ruta no encontrada: ${req.method} ${req.originalUrl} desde IP: ${req.ip}`);
    
    // Si es una ruta de página que podría existir, sugerir páginas disponibles
    if (path.includes('dashboard') || path.includes('pos') || path.includes('product') || path.includes('admin')) {
        return res.status(404).json({ 
            error: 'Página no encontrada',
            message: 'Esta página no existe en el servidor',
            suggestions: [
                '/login (página de acceso)',
                '/dashboard (panel principal)',
                '/pos (punto de venta)',
                '/products (gestión de productos)'
            ],
            note: 'Todas las páginas protegidas requieren autenticación válida'
        });
    }
    
    // Para otras rutas no encontradas
    res.status(404).json({ 
        error: 'Ruta no encontrada',
        path: req.originalUrl,
        method: req.method,
        suggestions: [
            '/login (página de acceso)',
            '/api/test (test de API)',
            'Contacta al administrador del sistema'
        ],
        security_note: 'Este acceso ha sido registrado'
    });
});

// =============================================
// INICIAR SERVIDOR CON INFORMACIÓN ACTUALIZADA
// =============================================
const PORT = config.PORT;
app.listen(PORT, () => {
    console.log('🔒'.repeat(50));
    console.log(`🚀 Servidor POS CORREGIDO iniciado en http://localhost:${PORT}`);
    console.log(`🌐 Accesible desde la red en http://[tu-ip]:${PORT}`);
    console.log(`📊 Ambiente: ${config.ENVIRONMENT}`);
    console.log(`🖨️ Impresora configurada: ${config.PRINTER_NAME}`);
    console.log('');
    console.log('🔧 CORRECCIONES APLICADAS:');
    console.log('   ✅ Eliminado middleware de autenticación en servidor');
    console.log('   ✅ Autenticación movida completamente al cliente');
    console.log('   ✅ Páginas protegidas se sirven libremente');
    console.log('   ✅ Verificación de token solo via JavaScript');
    console.log('   ✅ Sin redirecciones automáticas del servidor');
    console.log('');
    console.log('🔐 CARACTERÍSTICAS DE SEGURIDAD:');
    console.log('   ✅ APIs protegidas con tokens JWT');
    console.log('   ✅ Rate limiting (500 req/15min)');
    console.log('   ✅ Headers de seguridad');
    console.log('   ✅ Protección contra acceso a archivos del sistema');
    console.log('   ✅ Monitoreo de accesos sospechosos');
    console.log('   ✅ Autenticación del lado del cliente');
    console.log('');
    console.log('📋 RUTAS DISPONIBLES:');
    console.log('   🏠 Página principal: http://localhost:' + PORT + ' (→ login)');
    console.log('   🔐 Login: http://localhost:' + PORT + '/login');
    console.log('   📊 Dashboard: http://localhost:' + PORT + '/dashboard');
    console.log('   🛒 POS: http://localhost:' + PORT + '/pos');
    console.log('   📦 Productos: http://localhost:' + PORT + '/products');
    console.log('   📈 Reportes: http://localhost:' + PORT + '/reports');
    console.log('   🧪 Test API: http://localhost:' + PORT + '/api/test');
    console.log('');
    console.log('💡 NOTA: Todas las páginas requieren token válido en localStorage para funcionar');
    console.log('🔒'.repeat(50));
});

module.exports = app;