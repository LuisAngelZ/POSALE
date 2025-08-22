// server.js - Archivo principal del servidor
const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Importar configuración
const config = require('./server/config/config');

// Importar base de datos (esto inicializa las tablas)
require('./server/config/database');

const app = express();

// Middleware de seguridad
app.use(helmet({
    contentSecurityPolicy: false // Deshabilitado para desarrollo
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000 // máximo 1000 requests por IP cada 15 minutos
});
app.use(limiter);

// Middleware básico
app.use(morgan('combined'));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Ruta de prueba
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Servidor POS funcionando correctamente!',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Rutas principales
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/views/login.html'));
});

app.get('/pos.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/views/pos.html'));
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/views/admin.html'));
});

app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/views/dashboard.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/views/login.html'));
});

app.get('/products.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/views/products.html'));
});

// Importar rutas
app.use('/api/auth', require('./server/routes/auth'));
app.use('/api/categories', require('./server/routes/categories'));
app.use('/api/products', require('./server/routes/products'));
app.use('/api/sales', require('./server/routes/sales'));
app.use('/api/reports', require('./server/routes/reports'));
app.use('/api/printer', require('./server/routes/printer'));

// Middleware para manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Algo salió mal!',
        message: config.ENVIRONMENT === 'development' ? err.message : 'Error interno del servidor'
    });
});

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor
const PORT = config.PORT;
app.listen(PORT, () => {
    console.log(`🚀 Servidor POS iniciado en http://localhost:${PORT}`);
    console.log(`🌐 Accesible desde la red en http://[tu-ip]:${PORT}`);
    console.log(`📊 Ambiente: ${config.ENVIRONMENT}`);
    console.log(`🖨️  Impresora configurada: ${config.PRINTER_NAME}`);
});

module.exports = app;