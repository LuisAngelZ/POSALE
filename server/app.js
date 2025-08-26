const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const config = require('./config/config');
require('./config/database');

const app = express();

if (config.ENVIRONMENT === 'production') {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com']
        }
      }
    })
  );
} else {
  app.use(helmet({ contentSecurityPolicy: false }));
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
});
app.use(limiter);

app.use(morgan('combined'));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use('/server', (req, res) => {
  res.status(403).json({ error: 'Acceso denegado' });
});

const suspiciousPatterns = [/\.env/, /\.git/, /node_modules/, /package\.json/, /server\//, /\.js$/, /\.sql$/, /\.db$/];
app.use((req, res, next) => {
  if (suspiciousPatterns.some(p => p.test(req.path))) {
    console.log(`🚨 ACCESO SOSPECHOSO: ${req.ip} intentó acceder a ${req.path}`);
    return res.status(404).json({ error: 'Archivo no encontrado' });
  }
  next();
});

app.use(express.static(path.join(__dirname, '..', 'public')));

const viewsPath = path.join(__dirname, '..', 'public', 'views');
app.get('/', (req, res) => res.redirect('/login'));
app.get('/login', (req, res) => res.sendFile(path.join(viewsPath, 'login.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(viewsPath, 'dashboard.html')));
app.get('/pos', (req, res) => res.sendFile(path.join(viewsPath, 'pos.html')));
app.get('/products', (req, res) => res.sendFile(path.join(viewsPath, 'products.html')));
app.get('/categories', (req, res) => res.sendFile(path.join(viewsPath, 'categories.html')));
app.get('/reports', (req, res) => res.sendFile(path.join(viewsPath, 'reports.html')));
app.get('/create-user', (req, res) => res.sendFile(path.join(viewsPath, 'create-user.html')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/products', require('./routes/products'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/printer', require('./routes/printer'));

app.use((err, req, res, next) => {
  console.error('🚨 Error del servidor:', err.stack);
  const isProduction = config.ENVIRONMENT === 'production';
  res.status(500).json({
    error: 'Error interno del servidor',
    message: isProduction ? 'Algo salió mal' : err.message,
    timestamp: new Date().toISOString()
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

module.exports = app;

