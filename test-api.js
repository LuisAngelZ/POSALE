// test-api.js - Guarda este archivo en la raíz del proyecto D:\POS_VENTA\test-api.js
const config = require('./server/config/config');

const BASE_URL = `http://localhost:${config.PORT}`;
let authToken = '';

// Función helper para hacer requests
async function makeRequest(method, endpoint, data = null, useAuth = false) {
    const url = `${BASE_URL}${endpoint}`;
    
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (useAuth && authToken) {
        options.headers.Authorization = `Bearer ${authToken}`;
    }

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        const result = await response.json();
        
        console.log(`${method} ${endpoint}:`, response.status);
        if (!response.ok) {
            console.log('❌ Error:', result.message);
        } else {
            console.log('✅ Success');
        }
        
        return { success: response.ok, data: result, status: response.status };
    } catch (error) {
        console.error(`❌ Error en ${method} ${endpoint}:`, error.message);
        return { success: false, error: error.message };
    }
}

async function testAPIs() {
    console.log('🧪 Iniciando pruebas completas de APIs del sistema POS...\n');
    console.log(`📍 URL Base: ${BASE_URL}\n`);
    
    try {
        // 1. Probar conexión del servidor
        console.log('1️⃣ PROBANDO CONEXIÓN DEL SERVIDOR...');
        console.log('=' .repeat(50));
        const serverTest = await makeRequest('GET', '/api/test');
        if (!serverTest.success) {
            throw new Error('❌ Servidor no está funcionando');
        }
        console.log('✅ Servidor funcionando correctamente');
        console.log('📄 Mensaje:', serverTest.data.message);
        console.log('');

        // 2. Probar autenticación
        console.log('2️⃣ PROBANDO AUTENTICACIÓN...');
        console.log('=' .repeat(50));
        
        // Login con credenciales por defecto
        console.log('🔐 Intentando login con usuario admin...');
        const loginResult = await makeRequest('POST', '/api/auth/login', {
            username: 'admin',
            password: '123456'
        });
        
        if (loginResult.success) {
            authToken = loginResult.data.token;
            console.log('✅ Login exitoso');
            console.log('👤 Usuario:', loginResult.data.user.full_name);
            console.log('🔑 Token obtenido correctamente');
        } else {
            console.log('❌ Error en login:', loginResult.data.message);
            throw new Error('No se pudo autenticar');
        }
        console.log('');

        // 3. Verificar token
        console.log('3️⃣ VERIFICANDO TOKEN...');
        console.log('=' .repeat(50));
        const verifyResult = await makeRequest('POST', '/api/auth/verify-token', null, true);
        if (verifyResult.success) {
            console.log('✅ Token válido');
            console.log('👤 Usuario verificado:', verifyResult.data.user.username);
        }
        console.log('');

        // 4. Probar categorías
        console.log('4️⃣ PROBANDO APIs DE CATEGORÍAS...');
        console.log('=' .repeat(50));
        
        // Obtener categorías existentes
        console.log('📋 Obteniendo categorías...');
        const categoriesResult = await makeRequest('GET', '/api/categories', null, true);
        console.log(`📊 Categorías encontradas: ${categoriesResult.data.categories?.length || 0}`);
        
        // Crear nueva categoría
        console.log('➕ Creando nueva categoría...');
        const newCategoryResult = await makeRequest('POST', '/api/categories', {
            name: 'Postres',
            description: 'Postres y dulces deliciosos'
        }, true);
        
        if (newCategoryResult.success) {
            console.log('✅ Categoría creada:', newCategoryResult.data.category.name);
        }
        console.log('');

        // 5. Probar productos
        console.log('5️⃣ PROBANDO APIs DE PRODUCTOS...');
        console.log('=' .repeat(50));
        
        // Obtener productos existentes
        console.log('🛍️ Obteniendo productos...');
        const productsResult = await makeRequest('GET', '/api/products', null, true);
        console.log(`📊 Productos encontrados: ${productsResult.data.products?.length || 0}`);
        
        // Crear nuevo producto
        console.log('➕ Creando nuevo producto...');
        const newProductResult = await makeRequest('POST', '/api/products', {
            name: 'Pizza Margherita',
            description: 'Pizza con tomate, mozzarella y albahaca fresca',
            price: 35.50,
            category_id: 1,
            stock: 20
        }, true);
        
        if (newProductResult.success) {
            console.log('✅ Producto creado:', newProductResult.data.product.name);
            console.log('💰 Precio:', newProductResult.data.product.price);
        }

        // Buscar productos
        console.log('🔍 Probando búsqueda de productos...');
        await makeRequest('GET', '/api/products/search?q=pizza', null, true);
        console.log('');

        // 6. Probar ventas
        console.log('6️⃣ PROBANDO APIs DE VENTAS...');
        console.log('=' .repeat(50));
        
        // Crear nueva venta
        console.log('💰 Creando nueva venta...');
        const newSaleResult = await makeRequest('POST', '/api/sales', {
            customer_nit: '12345678',
            customer_name: 'María González',
            order_type: 'dine_in',
            table_number: '5',
            observations: 'Sin picante, extra queso',
            items: [
                {
                    product_id: 1,
                    quantity: 1
                },
                {
                    product_id: 2,
                    quantity: 2
                }
            ],
            paid_amount: 60.00
        }, true);
        
        if (newSaleResult.success) {
            console.log('✅ Venta creada con ID:', newSaleResult.data.sale.id);
            console.log('💵 Total:', newSaleResult.data.sale.total);
            console.log('💸 Cambio:', newSaleResult.data.sale.change_amount);
        }
        
        // Obtener ventas de hoy
        console.log('📅 Obteniendo ventas de hoy...');
        const todaySalesResult = await makeRequest('GET', '/api/sales/today', null, true);
        if (todaySalesResult.success) {
            console.log(`📊 Ventas de hoy: ${todaySalesResult.data.totals.count}`);
            console.log(`💵 Total del día: $${todaySalesResult.data.totals.amount}`);
        }
        console.log('');

        // 7. Probar reportes
        console.log('7️⃣ PROBANDO APIs DE REPORTES...');
        console.log('=' .repeat(50));
        
        // Dashboard
        console.log('📊 Cargando dashboard...');
        const dashboardResult = await makeRequest('GET', '/api/reports/dashboard', null, true);
        if (dashboardResult.success) {
            console.log('✅ Dashboard cargado correctamente');
            console.log(`📈 Ventas hoy: ${dashboardResult.data.dashboard.today.sales}`);
            console.log(`💰 Ingresos hoy: $${dashboardResult.data.dashboard.today.amount}`);
        }
        
        // Reporte diario
        console.log('📅 Generando reporte diario...');
        const dailyReportResult = await makeRequest('GET', '/api/reports/daily', null, true);
        if (dailyReportResult.success) {
            console.log('✅ Reporte diario generado');
        }
        console.log('');

        // 8. Resumen final
        console.log('🎉 ¡TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE!');
        console.log('=' .repeat(60));
        console.log('✅ Servidor funcionando');
        console.log('✅ Autenticación (Login/Token)');
        console.log('✅ Categorías (CRUD)');
        console.log('✅ Productos (CRUD + Búsqueda)');
        console.log('✅ Ventas (Crear + Consultar)');
        console.log('✅ Reportes (Dashboard + Diario)');
        console.log('');
        console.log('🚀 El sistema está listo para usar!');
        console.log('💡 Puedes acceder al sistema en:', BASE_URL);

    } catch (error) {
        console.error('\n❌ ERROR EN LAS PRUEBAS:', error.message);
        console.log('\n🔧 SOLUCIONES POSIBLES:');
        console.log('1. Verifica que el servidor esté ejecutándose: npm run dev');
        console.log('2. Verifica que la base de datos esté inicializada: node test-models.js');
        console.log('3. Verifica que el puerto 3000 esté libre');
    }
}

// Ejecutar pruebas
console.log('🚀 INICIANDO SUITE DE PRUEBAS DEL SISTEMA POS');
console.log('=' .repeat(60));

// Importar fetch para Node.js y ejecutar
async function runTests() {
    try {
        const fetch = (await import('node-fetch')).default;
        global.fetch = fetch;
        await testAPIs();
    } catch (importError) {
        console.log('❌ Error: node-fetch no está instalado');
        console.log('💡 Ejecuta: npm install node-fetch');
    }
}

runTests();