// server/routes/products.js
const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Todas las rutas de productos requieren autenticación
router.use(authenticateToken);

// Rutas de lectura (todos los usuarios autenticados)
router.get('/', ProductController.getAll);
router.get('/search', ProductController.search);
router.get('/low-stock', ProductController.getLowStock);
router.get('/category/:categoryId', ProductController.getByCategory);
router.get('/:id', ProductController.getById);

// Rutas de escritura (solo administradores)
router.post('/', requireAdmin, ProductController.create);
router.put('/:id', requireAdmin, ProductController.update);
router.delete('/:id', requireAdmin, ProductController.delete);
router.patch('/:id/stock', requireAdmin, ProductController.updateStock);

module.exports = router;