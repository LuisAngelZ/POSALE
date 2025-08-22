// test-models.js - Script para probar que todos los modelos funcionen correctamente
const database = require('./server/config/database');
const User = require('./server/models/User');
const Category = require('./server/models/Category');
const Product = require('./server/models/Product');
const Sale = require('./server/models/Sale');
const SaleDetail = require('./server/models/SaleDetail');

async function testModels() {
    console.log('🧪 Iniciando pruebas de modelos...\n');
    
    // Primero asegurar que la base de datos esté conectada
    console.log('🔌 Conectando a la base de datos...');
    await database.ensureConnected();
    console.log('✅ Base de datos conectada y tablas creadas\n');

    try {
        // 1. Probar modelo User
        console.log('1️⃣ Probando modelo User...');
        
        // Verificar si el usuario admin ya existe
        let adminUser = await User.findByUsername('admin');
        
        if (!adminUser) {
            // Si no existe, crearlo
            adminUser = await User.create({
                username: 'admin',
                password: '123456',
                full_name: 'Administrador del Sistema',
                role: 'admin'
            });
            console.log('✅ Usuario admin creado:', adminUser.username);
        } else {
            console.log('✅ Usuario admin ya existe:', adminUser.username);
        }

        // Verificar si el usuario cajero ya existe
        let cajeroUser = await User.findByUsername('cajero');
        
        if (!cajeroUser) {
            // Si no existe, crearlo
            cajeroUser = await User.create({
                username: 'cajero',
                password: '123456',
                full_name: 'Cajero Principal',
                role: 'cajero'
            });
            console.log('✅ Usuario cajero creado:', cajeroUser.username);
        } else {
            console.log('✅ Usuario cajero ya existe:', cajeroUser.username);
        }

        // 2. Probar modelo Category
        console.log('\n2️⃣ Probando modelo Category...');
        
        // Verificar categorías existentes
        const existingCategories = await Category.findAll();
        let category1, category2;
        
        if (existingCategories.length === 0) {
            category1 = await Category.create({
                name: 'Comidas',
                description: 'Platos principales y comidas'
            });
            
            category2 = await Category.create({
                name: 'Bebidas',
                description: 'Bebidas frías y calientes'
            });
            console.log('✅ Categorías creadas:', category1.name, category2.name);
        } else {
            category1 = existingCategories[0];
            category2 = existingCategories[1] || existingCategories[0];
            console.log('✅ Categorías ya existen:', existingCategories.map(c => c.name).join(', '));
        }

        // 3. Probar modelo Product
        console.log('\n3️⃣ Probando modelo Product...');
        
        // Verificar productos existentes
        const existingProducts = await Product.findAll();
        let product1, product2;
        
        if (existingProducts.length === 0) {
            product1 = await Product.create({
                name: 'Hamburguesa Clásica',
                description: 'Hamburguesa con carne, lechuga, tomate',
                price: 25.00,
                category_id: category1.id,
                stock: 50
            });

            product2 = await Product.create({
                name: 'Coca Cola',
                description: 'Refresco de cola 350ml',
                price: 8.00,
                category_id: category2.id,
                stock: 100
            });
            console.log('✅ Productos creados:', product1.name, product2.name);
        } else {
            product1 = existingProducts[0];
            product2 = existingProducts[1] || existingProducts[0];
            console.log('✅ Productos ya existen:', existingProducts.map(p => p.name).join(', '));
        }

        // 4. Probar modelo Sale
        console.log('\n4️⃣ Probando modelo Sale...');
        const sale = await Sale.create({
            customer_nit: '12345678',
            customer_name: 'Juan Pérez',
            order_type: 'takeaway',
            observations: 'Sin cebolla en la hamburguesa',
            subtotal: 33.00,
            total: 33.00,
            paid_amount: 50.00,
            change_amount: 17.00,
            user_id: adminUser.id // Usar el usuario admin
        });

        console.log('✅ Venta creada con ID:', sale.id);

        // 5. Probar modelo SaleDetail
        console.log('\n5️⃣ Probando modelo SaleDetail...');
        await SaleDetail.createMultiple(sale.id, [
            {
                product_id: product1.id,
                product_name: product1.name,
                quantity: 1,
                unit_price: product1.price,
                subtotal: product1.price * 1
            },
            {
                product_id: product2.id,
                product_name: product2.name,
                quantity: 1,
                unit_price: product2.price,
                subtotal: product2.price * 1
            }
        ]);

        console.log('✅ Detalles de venta creados');

        // 6. Probar consultas
        console.log('\n6️⃣ Probando consultas...');
        
        const allCategories = await Category.findAll();
        console.log('📋 Categorías encontradas:', allCategories.length);

        const allProducts = await Product.findAll();
        console.log('🛍️ Productos encontrados:', allProducts.length);

        const todaySales = await Sale.getTodaySales();
        console.log('💰 Ventas de hoy:', todaySales.length);

        const saleDetails = await SaleDetail.findBySaleId(sale.id);
        console.log('📝 Detalles de la venta:', saleDetails.length);

        const todayTotals = await Sale.getTodayTotals();
        console.log('📊 Totales de hoy:', {
            ventas: todayTotals.total_sales,
            monto: todayTotals.total_amount
        });

        console.log('\n🎉 ¡Todos los modelos funcionan correctamente!');
        console.log('\n📁 Base de datos creada en: database/pos.db');
        console.log('🔧 Puedes usar un visor de SQLite para ver las tablas y datos');

    } catch (error) {
        console.error('❌ Error en las pruebas:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        // Cerrar la conexión a la base de datos
        await database.close();
        console.log('\n🔌 Conexión cerrada');
    }
}

// Ejecutar las pruebas
testModels();