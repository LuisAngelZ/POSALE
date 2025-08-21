// server/config/database.js - Versión corregida
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        // Asegurar que la carpeta database existe
        const dbDir = path.join(__dirname, '../../database');
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        this.dbPath = path.join(dbDir, 'pos.db');
        this.db = null;
        this.isInitialized = false;
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error conectando a la base de datos:', err);
                    reject(err);
                } else {
                    console.log('Conectado a SQLite database');
                    this.initTables().then(() => {
                        this.isInitialized = true;
                        resolve(this.db);
                    }).catch(reject);
                }
            });
        });
    }

    async initTables() {
        console.log('📋 Creando tablas...');
        
        // Habilitar foreign keys
        await this.runAsync('PRAGMA foreign_keys = ON');
        
        // Crear tablas en orden (respetando dependencias)
        await this.createUsersTable();
        await this.createCategoriesTable();
        await this.createProductsTable();
        await this.createSalesTable();
        await this.createSaleDetailsTable();
        
        console.log('✅ Todas las tablas creadas correctamente');
    }

    runAsync(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });
    }

    async createUsersTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                full_name VARCHAR(100) NOT NULL,
                role VARCHAR(20) DEFAULT 'user',
                active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await this.runAsync(sql);
        console.log('✅ Tabla users creada');
    }

    async createCategoriesTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await this.runAsync(sql);
        console.log('✅ Tabla categories creada');
    }

    async createProductsTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                category_id INTEGER,
                stock INTEGER DEFAULT 0,
                image_url VARCHAR(255),
                active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id)
            )
        `;
        await this.runAsync(sql);
        console.log('✅ Tabla products creada');
    }

    async createSalesTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS sales (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_nit VARCHAR(20),
                customer_name VARCHAR(100),
                order_type VARCHAR(20) NOT NULL,
                table_number VARCHAR(10),
                observations TEXT,
                subtotal DECIMAL(10,2) NOT NULL,
                total DECIMAL(10,2) NOT NULL,
                paid_amount DECIMAL(10,2) NOT NULL,
                change_amount DECIMAL(10,2) DEFAULT 0,
                user_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `;
        await this.runAsync(sql);
        console.log('✅ Tabla sales creada');
    }

    async createSaleDetailsTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS sale_details (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sale_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                product_name VARCHAR(100) NOT NULL,
                quantity INTEGER NOT NULL,
                unit_price DECIMAL(10,2) NOT NULL,
                subtotal DECIMAL(10,2) NOT NULL,
                FOREIGN KEY (sale_id) REFERENCES sales(id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            )
        `;
        await this.runAsync(sql);
        console.log('✅ Tabla sale_details creada');
    }

    getDB() {
        if (!this.db) {
            throw new Error('Base de datos no inicializada. Llama a connect() primero.');
        }
        return this.db;
    }

    async ensureConnected() {
        if (!this.isInitialized) {
            await this.connect();
        }
        return this.db;
    }

    close() {
        return new Promise((resolve) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) console.error('Error cerrando la base de datos:', err);
                    else console.log('Base de datos cerrada');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

// Crear instancia singleton
const database = new Database();

module.exports = database;