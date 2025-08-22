// migration-remove-stock.js - Script para remover columna stock
const database = require('./server/config/database');

async function removeStockColumn() {
    console.log('🔄 Iniciando migración para remover stock...\n');
    
    try {
        await database.ensureConnected();
        const db = database.getDB();
        
        console.log('1️⃣ Creando tabla temporal sin stock...');
        
        // Crear tabla temporal sin la columna stock
        const createTempTable = `
            CREATE TABLE products_temp (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                category_id INTEGER,
                image_url VARCHAR(255),
                active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id)
            )
        `;
        
        await new Promise((resolve, reject) => {
            db.run(createTempTable, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        console.log('✅ Tabla temporal creada');
        
        console.log('2️⃣ Copiando datos (excluyendo stock)...');
        
        // Copiar datos sin la columna stock
        const copyData = `
            INSERT INTO products_temp (id, name, description, price, category_id, image_url, active, created_at, updated_at)
            SELECT id, name, description, price, category_id, image_url, active, created_at, updated_at
            FROM products
        `;
        
        await new Promise((resolve, reject) => {
            db.run(copyData, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        console.log('✅ Datos copiados');
        
        console.log('3️⃣ Eliminando tabla original...');
        
        // Eliminar tabla original
        await new Promise((resolve, reject) => {
            db.run('DROP TABLE products', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        console.log('✅ Tabla original eliminada');
        
        console.log('4️⃣ Renombrando tabla temporal...');
        
        // Renombrar tabla temporal
        await new Promise((resolve, reject) => {
            db.run('ALTER TABLE products_temp RENAME TO products', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        console.log('✅ Tabla renombrada');
        
        console.log('\n🎉 ¡Migración completada exitosamente!');
        console.log('📝 La columna "stock" ha sido removida de la tabla products');
        
        // Verificar los productos existentes
        const products = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM products LIMIT 3', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        console.log(`\n📋 Productos verificados: ${products.length} productos encontrados`);
        products.forEach(product => {
            console.log(`   - ${product.name}: $${product.price}`);
        });
        
    } catch (error) {
        console.error('❌ Error en la migración:', error);
        console.log('\n🔄 Si hay errores, puedes restaurar ejecutando: node test-models.js');
    } finally {
        await database.close();
        console.log('\n🔌 Conexión cerrada');
    }
}

// Ejecutar migración
removeStockColumn();