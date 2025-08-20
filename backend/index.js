// --- IMPORTACIONES DE MÓDULOS ---
const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");
const multer = require('multer');
const PDFDocument = require('pdfkit');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const bcrypt = require('bcrypt');
const saltRounds = 10;

// --- CONFIGURACIÓN INICIAL DE LA APP ---
const app = express();
const PORT = 4000;

// --- CONFIGURACIÓN DE CORS (CORREGIDA Y DEFINITIVA) ---
const allowedOrigins = [
    'http://localhost:3000',
    'https://distribuidoramarcial.netlify.app' // URL de tu frontend en Netlify
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por la política de CORS'));
        }
    }
};

app.use(cors(corsOptions));
app.use(express.json());


// --- CONFIGURACIÓN DE ARCHIVOS ESTÁTICOS Y SUBIDAS ---
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`)
});
const upload = multer({ storage: storage });

// --- CONEXIÓN A LA BASE DE DATOS ---
const dbPath = path.resolve(__dirname, "database.db");
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error("Error al conectar con la base de datos SQLite:", err.message);
    else console.log("Conectado a la base de datos SQLite.");
});

// --- FUNCIÓN DE AYUDA GLOBAL ---
function formatCurrency(num) {
    return "$" + (num || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// --- FUNCIÓN PARA CREAR ADMIN SI NO EXISTE ---
function crearAdminSiNoExiste() {
    console.log("A. Verificando si el usuario admin existe...");
    db.get("SELECT COUNT(*) as total FROM users WHERE username = 'admin'", [], (err, row) => {
        if (err) return console.error("ERROR: No se pudo consultar la tabla de usuarios.", err.message);
        if (row && row.total > 0) {
            console.log("B. El usuario admin ya existe.");
            return;
        }
        console.log("C. Usuario admin no encontrado. Creándolo ahora...");
        const adminPassword = 'password'; // Contraseña por defecto
        bcrypt.hash(adminPassword, saltRounds, (err, hash) => {
            if (err) return console.error("Error al encriptar la contraseña del admin:", err);
            db.run(`INSERT INTO users (username, password, role) VALUES (?, ?, 'admin')`, ['admin', hash], function(err) {
                if (err) return console.error("Error al insertar el usuario admin:", err.message);
                console.log(`D. ¡ÉXITO! Usuario administrador 'admin' fue creado.`);
            });
        });
    });
}

// --- FUNCIÓN PARA CARGAR DATOS INICIALES (EL SEEDER) ---
function cargarProductosInicialesSiEsNecesario() {
    console.log("1. Verificando si se deben cargar productos iniciales...");
    db.get("SELECT COUNT(*) as total FROM products", [], (err, row) => {
        if (err) return console.error("ERROR GRAVE: No se pudo consultar la tabla de productos.", err.message);
        if (row && row.total > 0) {
            console.log("2. La base de datos ya tiene productos.");
            return;
        }
        console.log("3. Tabla 'products' vacía. Intentando cargar datos desde JSON...");
        try {
            const dataPath = path.resolve(__dirname, "../src/data/productsData.json");
            console.log(`4. Buscando el archivo JSON en la ruta: ${dataPath}`);
            if (!fs.existsSync(dataPath)) {
                return console.error(`5. ¡ERROR! No se encontró el archivo JSON en la ruta especificada.`);
            }
            console.log("6. Archivo JSON encontrado. Leyendo y parseando...");
            const products = JSON.parse(fs.readFileSync(dataPath, "utf8"));
            console.log(`7. Parseo exitoso. Se encontraron ${products.length} productos para cargar.`);
            
            const insertProduct = db.prepare("INSERT INTO products (id, name, price, unidad, cost_price, image_url, lot_number, expiration_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            const insertStock = db.prepare("INSERT INTO stock (product_id, quantity) VALUES (?, ?)");
            
            db.serialize(() => {
                db.run("BEGIN TRANSACTION;");
                products.forEach(p => {
                    insertProduct.run(p.id, p.nombre || p.name, p.precio || p.price, p.unidad || 'unidad', p.cost_price, p.image_url, p.lot_number, p.expiration_date);
                    insertStock.run(p.id, p.stock || 0);
                });
                insertProduct.finalize();
                insertStock.finalize();
                db.run("COMMIT;", (commitErr) => {
                    if (commitErr) {
                        console.error("8. ¡ERROR! Falló el COMMIT de la transacción.", commitErr);
                        db.run("ROLLBACK;");
                    } else {
                        console.log("9. ¡ÉXITO! Productos y stock inicial cargados en la base de datos.");
                    }
                });
            });
        } catch (e) {
            console.error("¡ERROR CRÍTICO! Falló el proceso en el bloque try...catch:", e.message);
        }
    });
}

// --- CREACIÓN Y MIGRACIÓN DE TABLAS ---
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY, name TEXT NOT NULL, price REAL NOT NULL, unidad TEXT, image_url TEXT, lot_number TEXT, expiration_date DATE, cost_price REAL)`);
    db.run(`CREATE TABLE IF NOT EXISTS stock (product_id INTEGER PRIMARY KEY, quantity REAL NOT NULL DEFAULT 0, FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE)`);
    db.run(`CREATE TABLE IF NOT EXISTS stock_history (id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER, change_quantity REAL, new_quantity REAL, movement_type TEXT, reason TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE)`);
    db.run(`CREATE TABLE IF NOT EXISTS customers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, address TEXT, phone TEXT, email TEXT UNIQUE, contact_person TEXT, business_type TEXT, notes TEXT, localidad TEXT, created_at DATETIME, logo_url TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS suppliers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, cuit TEXT, contact_person TEXT, phone TEXT, email TEXT, address TEXT, notes TEXT, created_at DATETIME)`);
    db.run(`CREATE TABLE IF NOT EXISTS salespeople (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
    db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password TEXT NOT NULL, role TEXT NOT NULL, salesperson_id INTEGER UNIQUE, FOREIGN KEY (salesperson_id) REFERENCES salespeople(id) ON DELETE SET NULL)`);
    db.run(`CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id INTEGER, customer_name_manual TEXT, order_date DATETIME DEFAULT CURRENT_TIMESTAMP, status TEXT DEFAULT 'Pendiente', total_amount REAL, FOREIGN KEY (customer_id) REFERENCES customers(id))`);
    db.run(`CREATE TABLE IF NOT EXISTS order_items (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER, product_id INTEGER, product_name TEXT, quantity INTEGER, price_per_unit REAL, FOREIGN KEY (order_id) REFERENCES orders(id), FOREIGN KEY (product_id) REFERENCES products(id))`);
    db.run(`CREATE TABLE IF NOT EXISTS sales_records (id INTEGER PRIMARY KEY AUTOINCREMENT, salesperson_id INTEGER, customer_id INTEGER, sale_amount REAL, commission_amount REAL, sale_date DATETIME, notes TEXT, payment_method TEXT, is_paid_to_cashbox BOOLEAN, delivery_status TEXT DEFAULT 'Pendiente', delivery_status_date DATE, collection_status TEXT DEFAULT 'Pendiente', collection_date DATE, commission_rate REAL DEFAULT 0.05, commission_payment_date DATE, commission_paid_status TEXT DEFAULT 'pendiente', FOREIGN KEY (salesperson_id) REFERENCES salespeople(id), FOREIGN KEY (customer_id) REFERENCES customers(id))`);
    db.run(`CREATE TABLE IF NOT EXISTS sale_items (id INTEGER PRIMARY KEY AUTOINCREMENT, sale_record_id INTEGER, product_id INTEGER, quantity REAL, price REAL, price_override_reason TEXT, FOREIGN KEY (sale_record_id) REFERENCES sales_records(id), FOREIGN KEY (product_id) REFERENCES products(id))`);
    db.run(`CREATE TABLE IF NOT EXISTS customer_payments (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id INTEGER, payment_amount REAL, payment_date DATE, payment_method TEXT, notes TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS customer_special_prices (customer_id INTEGER, product_id INTEGER, special_price REAL, PRIMARY KEY (customer_id, product_id), FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE, FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE)`);
    db.run(`CREATE TABLE IF NOT EXISTS supplier_purchases (id INTEGER PRIMARY KEY AUTOINCREMENT, supplier_id INTEGER NOT NULL, purchase_date DATE NOT NULL, total_amount REAL NOT NULL, invoice_number TEXT, notes TEXT, payment_due_date DATE, payment_status TEXT DEFAULT 'Pendiente', FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE)`);
    db.run(`CREATE TABLE IF NOT EXISTS supplier_purchase_items (id INTEGER PRIMARY KEY AUTOINCREMENT, purchase_id INTEGER NOT NULL, product_id INTEGER NOT NULL, quantity REAL NOT NULL, cost_price REAL NOT NULL, FOREIGN KEY (purchase_id) REFERENCES supplier_purchases(id) ON DELETE CASCADE, FOREIGN KEY (product_id) REFERENCES products(id))`);
    db.run(`CREATE TABLE IF NOT EXISTS supplier_payments (id INTEGER PRIMARY KEY AUTOINCREMENT, supplier_id INTEGER NOT NULL, payment_amount REAL NOT NULL, payment_date DATE NOT NULL, payment_method TEXT, notes TEXT, FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE)`);
    db.run(`CREATE TABLE IF NOT EXISTS costs (id INTEGER PRIMARY KEY AUTOINCREMENT, description TEXT NOT NULL, amount REAL NOT NULL, cost_type TEXT NOT NULL, cost_date DATE NOT NULL, notes TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS vehicles (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, plate TEXT NOT NULL UNIQUE, brand TEXT, model TEXT, year INTEGER, last_service_date DATE, next_service_due_km INTEGER, insurance_expiry_date DATE, vtv_expiry_date DATE, notes TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS transformations (id INTEGER PRIMARY KEY AUTOINCREMENT, transformation_date DATETIME DEFAULT CURRENT_TIMESTAMP, notes TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS transformation_items (id INTEGER PRIMARY KEY AUTOINCREMENT, transformation_id INTEGER NOT NULL, product_id INTEGER NOT NULL, quantity REAL NOT NULL, type TEXT NOT NULL, FOREIGN KEY (transformation_id) REFERENCES transformations(id) ON DELETE CASCADE, FOREIGN KEY (product_id) REFERENCES products(id))`);
    db.run(`CREATE TABLE IF NOT EXISTS delivery_routes (id INTEGER PRIMARY KEY AUTOINCREMENT, route_date DATE NOT NULL, vehicle_id INTEGER, driver_name TEXT, status TEXT NOT NULL DEFAULT 'En preparación', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (vehicle_id) REFERENCES vehicles(id))`);
    db.run(`CREATE TABLE IF NOT EXISTS delivery_route_orders (route_id INTEGER NOT NULL, order_id INTEGER NOT NULL, delivery_order INTEGER, PRIMARY KEY (route_id, order_id), FOREIGN KEY (route_id) REFERENCES delivery_routes(id) ON DELETE CASCADE, FOREIGN KEY (order_id) REFERENCES sales_records(id) ON DELETE CASCADE)`);
    
    cargarProductosInicialesSiEsNecesario();
    crearAdminSiNoExiste();
});

// ===================================
// --- ENDPOINTS DE LA APLICACIÓN ---
// ===================================

// --- AUTENTICACIÓN Y USUARIOS ---
app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: "Usuario y contraseña son requeridos." });
    const sql = `SELECT * FROM users WHERE username = ?`;
    db.get(sql, [username], async (err, user) => {
        if (err) return res.status(500).json({ message: "Error en la base de datos.", errorDetail: err.message });
        if (!user) return res.status(401).json({ message: "Usuario o contraseña incorrectos." });
        try {
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                res.json({ message: "Login exitoso", user: { id: user.id, username: user.username, role: user.role, salesperson_id: user.salesperson_id } });
            } else {
                res.status(401).json({ message: "Usuario o contraseña incorrectos." });
            }
        } catch (error) {
            res.status(500).json({ message: "Error del servidor durante la autenticación." });
        }
    });
});
app.post("/api/salespeople/:id/create-user", async (req, res) => {
    const { username, password } = req.body;
    const salespersonId = req.params.id;
    if (!username || !password) return res.status(400).json({ message: "El nombre de usuario y la contraseña son requeridos." });
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const sql = `INSERT INTO users (username, password, role, salesperson_id) VALUES (?, ?, 'vendedor', ?)`;
        db.run(sql, [username, hashedPassword, salespersonId], function(err) {
            if (err) {
                if (err.message.includes("UNIQUE")) return res.status(400).json({ message: `El nombre de usuario '${username}' ya existe o el vendedor ya tiene un usuario.` });
                return res.status(500).json({ message: "Error al crear el usuario.", errorDetail: err.message });
            }
            res.status(201).json({ message: `Usuario '${username}' creado y asociado al vendedor.` });
        });
    } catch (error) {
        res.status(500).json({ message: "Error del servidor al encriptar la contraseña." });
    }
});

// --- PRODUCTOS Y STOCK ---
app.get("/api/products", (req, res) => {
    const sql = `SELECT p.*, COALESCE(s.quantity, 0) as stock FROM products p LEFT JOIN stock s ON p.id = s.product_id ORDER BY p.name ASC`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ message: "Error al obtener productos.", errorDetail: err.message });
        res.json(rows.map(row => ({ ...row, nombre: row.name, precio: row.price })));
    });
});
app.post("/api/products", upload.single('product_image'), (req, res) => {
    const { nombre, precio, unidad, stock, cost_price, expiration_date, lot_number } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    if (!nombre || precio === undefined) return res.status(400).json({ error: "Nombre y precio son requeridos" });
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        const sqlProduct = "INSERT INTO products (name, price, unidad, cost_price, expiration_date, lot_number, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)";
        db.run(sqlProduct, [nombre, parseFloat(precio), unidad, cost_price, expiration_date, lot_number, imageUrl], function (err) {
            if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }
            const productId = this.lastID;
            const initialStock = stock !== undefined ? parseFloat(String(stock).replace(',', '.')) : 0;
            db.run("INSERT INTO stock (product_id, quantity) VALUES (?, ?)", [productId, initialStock], (stockErr) => {
                if (stockErr) { db.run("ROLLBACK"); return res.status(500).json({ error: stockErr.message }); }
                db.run("COMMIT", (commitErr) => {
                    if (commitErr) { db.run("ROLLBACK"); return res.status(500).json({ error: commitErr.message }); }
                    res.status(201).json({ id: productId, nombre, precio: parseFloat(precio), unidad, stock: initialStock });
                });
            });
        });
    });
});
app.put("/api/products/:id", upload.single('product_image'), (req, res) => {
    const { nombre, precio, unidad, cost_price, expiration_date, lot_number } = req.body;
    db.get("SELECT image_url FROM products WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        const oldImagePath = row ? row.image_url : null;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : oldImagePath;
        const sql = `UPDATE products SET name = ?, price = ?, unidad = ?, cost_price = ?, expiration_date = ?, lot_number = ?, image_url = ? WHERE id = ?`;
        db.run(sql, [nombre, parseFloat(precio), unidad, cost_price, expiration_date, lot_number, imageUrl, req.params.id], function (updateErr) {
            if (updateErr) return res.status(500).json({ error: updateErr.message });
            if (this.changes === 0) return res.status(404).json({ error: "Producto no encontrado" });
            if (req.file && oldImagePath) {
                fs.unlink(path.join(__dirname, oldImagePath), () => {});
            }
            res.json({ id: Number(req.params.id), nombre, precio: parseFloat(precio), unidad });
        });
    });
});
app.delete("/api/products/:id", (req, res) => {
    db.get("SELECT image_url FROM products WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ message: "Error.", errorDetail: err.message });
        const imagePath = row ? row.image_url : null;
        db.run("DELETE FROM products WHERE id = ?", [req.params.id], function (deleteErr) {
            if (deleteErr) return res.status(500).json({ message: "Error.", errorDetail: deleteErr.message });
            if (this.changes === 0) return res.status(404).json({ message: "Producto no encontrado." });
            if (imagePath) {
                fs.unlink(path.join(__dirname, imagePath), () => {});
            }
            res.json({ message: "Producto eliminado." });
        });
    });
});
app.put("/api/stock/:productId", (req, res) => {
    const { change_quantity, movement_type, reason } = req.body;
    const quantityChange = parseFloat(String(change_quantity).replace(',', '.'));
    if (isNaN(quantityChange)) return res.status(400).json({ message: "Cantidad inválida" });
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        db.run("UPDATE stock SET quantity = quantity + ? WHERE product_id = ?", [quantityChange, req.params.productId], function(err) {
            if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }
            const logHistory = () => {
                const historySql = `INSERT INTO stock_history (product_id, change_quantity, new_quantity, movement_type, reason) VALUES (?, ?, (SELECT quantity FROM stock WHERE product_id = ?), ?, ?)`;
                db.run(historySql, [req.params.productId, quantityChange, req.params.productId, movement_type, reason], (histErr) => {
                    if (histErr) { db.run("ROLLBACK"); return res.status(500).json({ error: histErr.message }); }
                    db.run("COMMIT", (commitErr) => {
                        if (commitErr) { db.run("ROLLBACK"); return res.status(500).json({ error: commitErr.message }); }
                        res.json({ message: "Stock y historial actualizados." });
                    });
                });
            };
            if (this.changes === 0) {
                db.run("INSERT INTO stock (product_id, quantity) VALUES (?, ?)", [req.params.productId, quantityChange], (insertErr) => {
                    if (insertErr) { db.run("ROLLBACK"); return res.status(500).json({ error: insertErr.message }); }
                    logHistory();
                });
            } else {
                logHistory();
            }
        });
    });
});
app.get("/api/products/:productId/stock-history", (req, res) => {
    const sql = `SELECT * FROM stock_history WHERE product_id = ? ORDER BY created_at DESC`;
    db.all(sql, [req.params.productId], (err, rows) => {
        if (err) return res.status(500).json({ message: "Error al obtener historial de stock", errorDetail: err.message });
        res.json(rows);
    });
});
app.get("/api/products/search", (req, res) => {
    const { term } = req.query;
    if (!term) return res.json([]);
    const sql = `SELECT p.id, p.name, p.price, COALESCE(s.quantity, 0) as stock FROM products p LEFT JOIN stock s ON p.id = s.product_id WHERE p.name LIKE ? LIMIT 10`;
    db.all(sql, [`%${term}%`], (err, rows) => {
        if (err) return res.status(500).json({ message: "Error al buscar productos.", error: err.message });
        res.json(rows.map(p => ({ value: p.id, label: `${p.name} - ${formatCurrency(p.price)} (Stock: ${p.stock || 0})`, product: p })));
    });
});
app.get("/api/products/export/csv", (req, res) => {
    const sql = `SELECT p.id, p.name, p.price, p.cost_price, p.unidad, p.lot_number, p.expiration_date, COALESCE(s.quantity, 0) as stock FROM products p LEFT JOIN stock s ON p.id = s.product_id ORDER BY p.name ASC`;
    db.all(sql, [], (err, products) => {
        if (err) return res.status(500).json({ message: "Error al obtener productos para exportar.", error: err.message });
        const filePath = path.join(__dirname, 'productos.csv');
        const csvWriter = createCsvWriter({ path: filePath, header: [ { id: 'id', title: 'ID' }, { id: 'name', title: 'NOMBRE' }, { id: 'cost_price', title: 'PRECIO_COSTO' }, { id: 'price', title: 'PRECIO_VENTA' }, { id: 'stock', title: 'STOCK' }, { id: 'unidad', title: 'UNIDAD' }, { id: 'lot_number', title: 'LOTE' }, { id: 'expiration_date', title: 'VENCIMIENTO' } ] });
        csvWriter.writeRecords(products).then(() => {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=distribuidora-marcial-productos.csv');
            res.download(filePath, () => fs.unlinkSync(filePath));
        }).catch(err => res.status(500).send("Error al generar el archivo CSV."));
    });
});

// --- VENDEDORES Y VENTAS ---
app.get("/api/salespeople", (req, res) => {
    db.all("SELECT * FROM salespeople ORDER BY name ASC", [], (err, rows) => {
        if (err) return res.status(500).json({ message: "Error al obtener vendedores.", errorDetail: err.message });
        res.json(rows);
    });
});
app.post("/api/salespeople", (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "El nombre es requerido." });
    db.run("INSERT INTO salespeople (name) VALUES (?)", [name], function(err) {
        if (err) {
            if (err.message.includes("UNIQUE")) return res.status(400).json({ message: `El vendedor '${name}' ya existe.` });
            return res.status(500).json({ message: "Error al añadir vendedor.", errorDetail: err.message });
        }
        res.status(201).json({ id: this.lastID, name });
    });
});
app.get("/api/salesrecords", (req, res) => {
    const sql = `SELECT sr.*, sp.name as salesperson_name, c.name as customer_name FROM sales_records sr LEFT JOIN salespeople sp ON sr.salesperson_id = sp.id LEFT JOIN customers c ON sr.customer_id = c.id ORDER BY sr.sale_date DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ message: "Error al obtener registros de ventas.", errorDetail: err.message });
        res.json(rows);
    });
});
app.post("/api/salesrecords", (req, res) => {
    const { salesperson_id, customer_id, items, notes, payment_method, is_paid_to_cashbox, delivery_status, delivery_status_date, collection_status, collection_date, commission_rate } = req.body;
    const final_commission_rate = commission_rate !== undefined ? parseFloat(commission_rate) : 0.05;
    if (!salesperson_id || !customer_id || !items || items.length === 0) return res.status(400).json({ message: "Faltan datos para registrar la venta." });
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const commissionAmount = totalAmount * final_commission_rate;
    db.serialize(() => {
        db.run("BEGIN TRANSACTION;");
        const sqlSaleRecord = `INSERT INTO sales_records (salesperson_id, customer_id, sale_amount, commission_amount, notes, payment_method, is_paid_to_cashbox, sale_date, delivery_status, delivery_status_date, collection_status, collection_date, commission_rate, commission_paid_status) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, 'pendiente')`;
        const params = [salesperson_id, customer_id, totalAmount, commissionAmount, notes, payment_method, is_paid_to_cashbox, delivery_status || 'Pendiente', delivery_status_date, collection_status || 'Pendiente', collection_date, final_commission_rate];
        db.run(sqlSaleRecord, params, function (err) {
            if (err) { db.run("ROLLBACK"); return res.status(500).json({ message: "Error al crear registro de venta.", errorDetail: err.message }); }
            const saleRecordId = this.lastID;
            const sqlSaleItem = `INSERT INTO sale_items (sale_record_id, product_id, quantity, price, price_override_reason) VALUES (?, ?, ?, ?, ?)`;
            const stockPromises = items.map(item => new Promise((resolve, reject) => {
                db.run(sqlSaleItem, [saleRecordId, item.productId, item.quantity, item.price, item.priceOverrideReason], (itemErr) => {
                    if (itemErr) return reject(itemErr);
                    db.run("UPDATE stock SET quantity = quantity - ? WHERE product_id = ? AND quantity >= ?", [item.quantity, item.productId, item.quantity], function(stockErr) {
                        if (stockErr) return reject(stockErr);
                        if (this.changes === 0) return reject(new Error(`Stock insuficiente para producto ID ${item.productId}`));
                        resolve();
                    });
                });
            }));
            Promise.all(stockPromises)
                .then(() => db.run("COMMIT", err => {
                    if (err) { db.run("ROLLBACK"); return res.status(500).json({ message: "Error en COMMIT.", errorDetail: err.message }); }
                    res.status(201).json({ id: saleRecordId, message: "Venta registrada exitosamente." });
                }))
                .catch(error => {
                    db.run("ROLLBACK");
                    res.status(400).json({ message: error.message });
                });
        });
    });
});
app.put("/api/salesrecords/:id/commission", (req, res) => {
    const { status, payment_date } = req.body;
    if (!status) return res.status(400).json({ message: "El estado es requerido." });
    let sql = "UPDATE sales_records SET commission_paid_status = ?";
    const params = [status];
    if(status.toLowerCase() === 'pagada' && payment_date) {
        sql += ", commission_payment_date = ?";
        params.push(payment_date);
    }
    sql += " WHERE id = ?";
    params.push(req.params.id);
    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ message: "Error al actualizar estado.", errorDetail: err.message });
        if (this.changes === 0) return res.status(404).json({ message: "Registro de venta no encontrado." });
        res.json({ message: "Estado de comisión actualizado." });
    });
});

// --- CLIENTES Y CUENTAS CORRIENTES ---
app.get("/api/customers", (req, res) => { db.all("SELECT * FROM customers ORDER BY name ASC", [], (err, rows) => { if (err) return res.status(500).json({ message: "Error.", errorDetail: err.message }); res.json(rows); }); });
app.get("/api/customers/:id", (req, res) => { db.get("SELECT * FROM customers WHERE id = ?", [req.params.id], (err, row) => { if (err) return res.status(500).json({ message: "Error.", errorDetail: err.message }); if (!row) return res.status(404).json({ message: "No encontrado." }); res.json(row); }); });
app.post("/api/customers", (req, res) => {
    const { name, address, phone, email, contact_person, business_type, notes, localidad } = req.body;
    if (!name) return res.status(400).json({ message: "El nombre es requerido." });
    const sql = `INSERT INTO customers (name, address, phone, email, contact_person, business_type, notes, localidad, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;
    const params = [name, address, phone, email ? email.toLowerCase() : null, contact_person, business_type, notes, localidad];
    db.run(sql, params, function (err) {
        if (err) {
            if (err.message.includes("UNIQUE")) return res.status(400).json({ message: `El email '${email}' ya está registrado.` });
            return res.status(500).json({ message: "Error.", errorDetail: err.message });
        }
        res.status(201).json({ id: this.lastID, ...req.body });
    });
});
app.put("/api/customers/:id", (req, res) => {
    const { id } = req.params;
    const { name, address, phone, email, contact_person, business_type, notes, localidad } = req.body;
    if (!name) return res.status(400).json({ message: "El nombre es requerido." });
    const sql = `UPDATE customers SET name = ?, address = ?, phone = ?, email = ?, contact_person = ?, business_type = ?, notes = ?, localidad = ? WHERE id = ?`;
    const params = [name, address, phone, email ? email.toLowerCase() : null, contact_person, business_type, notes, localidad, id];
    db.run(sql, params, function (err) {
        if (err) {
            if (err.message.includes("UNIQUE")) return res.status(400).json({ message: `El email '${email}' ya está registrado.` });
            return res.status(500).json({ message: "Error.", errorDetail: err.message });
        }
        if (this.changes === 0) return res.status(404).json({ message: "No encontrado." });
        res.json({ message: "Cliente actualizado." });
    });
});
app.delete("/api/customers/:id", (req, res) => { db.run("DELETE FROM customers WHERE id = ?", [req.params.id], function (err) { if (err) return res.status(500).json({ message: "Error.", errorDetail: err.message }); if (this.changes === 0) return res.status(404).json({ message: "No encontrado." }); res.json({ message: "Cliente eliminado." }); }); });
app.get("/api/customers/:id/details", async (req, res) => {
    const { id } = req.params;
    const query = (sql, params = []) => new Promise((resolve, reject) => db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row))));
    const queryAll = (sql, params = []) => new Promise((resolve, reject) => db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))));
    try {
        const customer = await query("SELECT * FROM customers WHERE id = ?", [id]);
        if (!customer) return res.status(404).json({ message: "Cliente no encontrado." });
        const [stats, salesHistory, paymentHistory, specialPrices] = await Promise.all([
            query(`SELECT (SELECT SUM(sale_amount) FROM sales_records WHERE customer_id = ?) as totalSold, (SELECT SUM(payment_amount) FROM customer_payments WHERE customer_id = ?) as totalPaid`, [id, id]),
            queryAll("SELECT * FROM sales_records WHERE customer_id = ? ORDER BY sale_date DESC", [id]),
            queryAll("SELECT * FROM customer_payments WHERE customer_id = ? ORDER BY payment_date DESC", [id]),
            queryAll(`SELECT sp.product_id, p.name as product_name, sp.special_price FROM customer_special_prices sp JOIN products p ON sp.product_id = p.id WHERE sp.customer_id = ?`, [id])
        ]);
        const totalSold = stats.totalSold || 0;
        const totalPaid = stats.totalPaid || 0;
        res.json({ customer, stats: { totalSold, balance: totalSold - totalPaid, lastSaleDate: salesHistory.length > 0 ? salesHistory[0].sale_date : null }, salesHistory, paymentHistory, specialPrices });
    } catch (error) {
        res.status(500).json({ message: "Error en el servidor.", error: error.message });
    }
});
app.post("/api/customers/:id/logo", upload.single('logo'), async (req, res) => {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ message: "No se seleccionó ningún archivo." });
    const logoUrl = `/uploads/${req.file.filename}`;
    const query = (sql, params = []) => new Promise((resolve, reject) => db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row))));
    try {
        const oldData = await query("SELECT logo_url FROM customers WHERE id = ?", [id]);
        if (oldData && oldData.logo_url) {
            const oldPath = path.join(__dirname, oldData.logo_url);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        db.run("UPDATE customers SET logo_url = ? WHERE id = ?", [logoUrl, id], function (err) {
            if (err) return res.status(500).json({ message: "Error al guardar el logo en la base de datos.", error: err.message });
            if (this.changes === 0) return res.status(404).json({ message: "Cliente no encontrado." });
            res.json({ message: "Logo actualizado correctamente.", logoUrl });
        });
    } catch (error) {
        res.status(500).json({ message: "Error en el servidor al procesar el logo.", error: error.message });
    }
});
app.get("/api/customers/:customerId/payments", (req, res) => { db.all("SELECT * FROM customer_payments WHERE customer_id = ? ORDER BY payment_date DESC", [req.params.customerId], (err, rows) => { if (err) return res.status(500).json({ message: "Error al obtener pagos.", errorDetail: err.message }); res.json(rows); }); });
app.post("/api/customers/:customerId/payments", (req, res) => {
    const { payment_amount, payment_date, payment_method, notes } = req.body;
    if (!payment_amount || !payment_date) return res.status(400).json({ message: "Monto y fecha son obligatorios." });
    const sql = `INSERT INTO customer_payments (customer_id, payment_amount, payment_date, payment_method, notes) VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [req.params.customerId, parseFloat(payment_amount), payment_date, payment_method, notes], function(err) {
        if (err) return res.status(500).json({ message: "Error al registrar pago.", errorDetail: err.message });
        res.status(201).json({ id: this.lastID, ...req.body });
    });
});
app.get("/api/customers/:customerId/orders", (req, res) => {
    const sql = "SELECT id, sale_date as order_date, 'Completado' as status, sale_amount as total_amount FROM sales_records WHERE customer_id = ? ORDER BY sale_date DESC";
    db.all(sql, [req.params.customerId], (err, rows) => {
        if (err) return res.status(500).json({ message: "Error al obtener los pedidos del cliente.", errorDetail: err.message });
        res.json(rows);
    });
});
app.get("/api/customers/:customerId/prices", (req, res) => {
    const sql = `SELECT sp.customer_id, sp.product_id, p.name as product_name, sp.special_price FROM customer_special_prices sp JOIN products p ON sp.product_id = p.id WHERE sp.customer_id = ?`;
    db.all(sql, [req.params.customerId], (err, rows) => {
        if(err) return res.status(500).json({message: "Error obteniendo precios especiales.", errorDetail: err.message});
        res.json(rows);
    });
});
app.post("/api/customers/:customerId/prices", (req, res) => {
    const { productId, specialPrice } = req.body;
    const { customerId } = req.params;
    if (!productId || specialPrice === undefined) return res.status(400).json({ message: "Faltan datos (productId, specialPrice)" });
    const sql = "REPLACE INTO customer_special_prices (customer_id, product_id, special_price) VALUES (?, ?, ?)";
    db.run(sql, [customerId, productId, specialPrice], function(err) {
        if (err) return res.status(500).json({ message: "Error al guardar el precio especial.", errorDetail: err.message });
        res.status(201).json({ message: "Precio especial guardado." });
    });
});
app.delete("/api/customers/:customerId/prices/:productId", (req, res) => {
    const { customerId, productId } = req.params;
    const sql = "DELETE FROM customer_special_prices WHERE customer_id = ? AND product_id = ?";
    db.run(sql, [customerId, productId], function(err) {
        if (err) return res.status(500).json({ message: "Error al eliminar el precio especial.", errorDetail: err.message });
        if (this.changes === 0) return res.status(404).json({ message: "Precio especial no encontrado." });
        res.json({ message: "Precio especial eliminado." });
    });
});

// --- PROVEEDORES Y COMPRAS ---
app.get("/api/suppliers", (req, res) => { db.all("SELECT * FROM suppliers ORDER BY name ASC", [], (err, rows) => { if (err) return res.status(500).json({ message: "Error.", errorDetail: err.message }); res.json(rows); }); });
app.get("/api/suppliers/debts", (req, res) => {
    const sql = `SELECT s.id, s.name, COALESCE(purchases.total_purchased, 0) as total_purchased, COALESCE(payments.total_paid, 0) as total_paid, (COALESCE(purchases.total_purchased, 0) - COALESCE(payments.total_paid, 0)) as balance FROM suppliers s LEFT JOIN (SELECT supplier_id, SUM(total_amount) as total_purchased FROM supplier_purchases GROUP BY supplier_id) purchases ON s.id = purchases.supplier_id LEFT JOIN (SELECT supplier_id, SUM(payment_amount) as total_paid FROM supplier_payments GROUP BY supplier_id) payments ON s.id = payments.supplier_id ORDER BY balance DESC, s.name ASC`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ message: "Error al calcular deudas de proveedores.", errorDetail: err.message });
        res.json(rows);
    });
});
app.get("/api/suppliers/:id", (req, res) => { db.get("SELECT * FROM suppliers WHERE id = ?", [req.params.id], (err, row) => { if (err) return res.status(500).json({ message: "Error.", errorDetail: err.message }); if (!row) return res.status(404).json({ message: "No encontrado." }); res.json(row); }); });
app.post("/api/suppliers", (req, res) => {
    const { name, cuit, contact_person, phone, email, address, notes } = req.body;
    if (!name) return res.status(400).json({ message: "El nombre es requerido." });
    const sql = `INSERT INTO suppliers (name, cuit, contact_person, phone, email, address, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;
    db.run(sql, [name, cuit, contact_person, phone, email, address, notes], function (err) {
        if (err) return res.status(500).json({ message: "Error.", errorDetail: err.message });
        res.status(201).json({ id: this.lastID, ...req.body });
    });
});
app.put("/api/suppliers/:id", (req, res) => {
    const { name, cuit, contact_person, phone, email, address, notes } = req.body;
    if (!name) return res.status(400).json({ message: "El nombre es requerido." });
    const sql = `UPDATE suppliers SET name = ?, cuit = ?, contact_person = ?, phone = ?, email = ?, address = ?, notes = ? WHERE id = ?`;
    db.run(sql, [name, cuit, contact_person, phone, email, address, notes, req.params.id], function (err) {
        if (err) return res.status(500).json({ message: "Error.", errorDetail: err.message });
        if (this.changes === 0) return res.status(404).json({ message: "No encontrado." });
        res.json({ message: "Proveedor actualizado." });
    });
});
app.delete("/api/suppliers/:id", (req, res) => { db.run("DELETE FROM suppliers WHERE id = ?", [req.params.id], function (err) { if (err) return res.status(500).json({ message: "Error.", errorDetail: err.message }); if (this.changes === 0) return res.status(404).json({ message: "No encontrado." }); res.json({ message: "Proveedor eliminado." }); }); });
app.get("/api/suppliers/:supplierId/purchases", (req, res) => {
    const sql = "SELECT * FROM supplier_purchases WHERE supplier_id = ? ORDER BY purchase_date DESC";
    db.all(sql, [req.params.supplierId], (err, rows) => {
        if (err) return res.status(500).json({ message: "Error al obtener compras.", errorDetail: err.message });
        res.json(rows);
    });
});
app.get("/api/suppliers/:supplierId/payments", (req, res) => {
    const sql = "SELECT * FROM supplier_payments WHERE supplier_id = ? ORDER BY payment_date DESC";
    db.all(sql, [req.params.supplierId], (err, rows) => {
        if (err) return res.status(500).json({ message: "Error al obtener pagos.", errorDetail: err.message });
        res.json(rows);
    });
});
app.post("/api/suppliers/:supplierId/payments", (req, res) => {
    const { payment_amount, payment_date, payment_method, notes } = req.body;
    if (!payment_amount || !payment_date) return res.status(400).json({ message: "Monto y fecha son obligatorios." });
    const sql = `INSERT INTO supplier_payments (supplier_id, payment_amount, payment_date, payment_method, notes) VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [req.params.supplierId, parseFloat(payment_amount), payment_date, payment_method, notes], function(err) {
        if (err) return res.status(500).json({ message: "Error al registrar pago.", errorDetail: err.message });
        res.status(201).json({ id: this.lastID, ...req.body });
    });
});
app.post("/api/purchases", (req, res) => {
    const { supplier_id, purchase_date, invoice_number, notes, items, payment_due_date } = req.body;
    if (!supplier_id || !purchase_date || !items || items.length === 0) return res.status(400).json({ message: "Faltan datos para registrar la compra." });
    const total_amount = items.reduce((sum, item) => sum + (item.quantity * item.cost_price), 0);
    db.serialize(() => {
        db.run("BEGIN TRANSACTION;");
        const sqlPurchase = `INSERT INTO supplier_purchases (supplier_id, purchase_date, total_amount, invoice_number, notes, payment_due_date, payment_status) VALUES (?, ?, ?, ?, ?, ?, 'Pendiente')`;
        db.run(sqlPurchase, [supplier_id, purchase_date, total_amount, invoice_number, notes, payment_due_date], function(err) {
            if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }
            const purchaseId = this.lastID;
            const sqlItem = `INSERT INTO supplier_purchase_items (purchase_id, product_id, quantity, cost_price) VALUES (?, ?, ?, ?)`;
            const stockUpdatePromises = items.map(item => new Promise((resolve, reject) => {
                db.run(sqlItem, [purchaseId, item.product_id, item.quantity, item.cost_price], (itemErr) => {
                    if (itemErr) return reject(itemErr);
                    db.run("UPDATE stock SET quantity = quantity + ? WHERE product_id = ?", [item.quantity, item.product_id], function(stockErr) {
                        if (stockErr) return reject(stockErr);
                        if (this.changes === 0) {
                            db.run("INSERT INTO stock (product_id, quantity) VALUES (?, ?)", [item.product_id, item.quantity], (insertErr) => {
                                if (insertErr) return reject(insertErr);
                                resolve();
                            });
                        } else { resolve(); }
                    });
                });
            }));
            Promise.all(stockUpdatePromises)
                .then(() => {
                    db.run("COMMIT;");
                    res.status(201).json({ id: purchaseId, message: "Compra registrada y stock actualizado." });
                })
                .catch(error => {
                    db.run("ROLLBACK;");
                    res.status(500).json({ message: "Error procesando los ítems de la compra.", errorDetail: error.message });
                });
        });
    });
});

// --- PEDIDOS Y DOCUMENTOS ---
app.get("/api/orders", (req, res) => {
    const sql = `SELECT id, unique_id, order_date, status, total_amount, customer_name, type FROM (SELECT sr.id, 'venta_' || sr.id as unique_id, sr.sale_date as order_date, sr.delivery_status as status, sr.sale_amount as total_amount, c.name as customer_name, 'Venta Directa' as type FROM sales_records sr LEFT JOIN customers c ON sr.customer_id = c.id UNION ALL SELECT o.id, 'pedido_' || o.id as unique_id, o.order_date, o.status, o.total_amount, o.customer_name_manual as customer_name, 'Pedido Carrito' as type FROM orders o) ORDER BY order_date DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ message: "Error al obtener la lista unificada de pedidos.", errorDetail: err.message });
        res.json(rows);
    });
});
app.get("/api/orders/:unique_id", (req, res) => {
    const { unique_id } = req.params;
    const [type, id] = unique_id.split('_');
    if (type === 'venta') {
        const sqlSaleRecord = `SELECT sr.id, sr.sale_date as order_date, sr.delivery_status as status, sr.sale_amount as total_amount, c.id as customer_id, c.name as customer_name, c.email as customer_email, c.phone as customer_phone FROM sales_records sr LEFT JOIN customers c ON sr.customer_id = c.id WHERE sr.id = ?`;
        db.get(sqlSaleRecord, [id], (err, saleRow) => {
            if (err) return res.status(500).json({ message: "Error buscando en ventas.", errorDetail: err.message });
            if (!saleRow) return res.status(404).json({ message: "Venta no encontrada." });
            const sqlItems = `SELECT si.id, si.quantity, si.price as price_per_unit, p.name as product_name FROM sale_items si JOIN products p ON si.product_id = p.id WHERE si.sale_record_id = ?`;
            db.all(sqlItems, [id], (itemErr, itemRows) => {
                if (itemErr) return res.status(500).json({ message: "Error buscando ítems de la venta.", errorDetail: itemErr.message });
                saleRow.items = itemRows || [];
                return res.json(saleRow);
            });
        });
    } else if (type === 'pedido') {
        const sqlOldOrder = `SELECT o.*, o.customer_name_manual as customer_name FROM orders o WHERE o.id = ?`;
        db.get(sqlOldOrder, [id], (oldErr, oldOrderRow) => {
            if (oldErr) return res.status(500).json({ message: "Error buscando en pedidos antiguos.", errorDetail: oldErr.message });
            if (!oldOrderRow) return res.status(404).json({ message: "Pedido no encontrado." });
            const sqlOldItems = "SELECT *, id as item_id FROM order_items WHERE order_id = ?";
            db.all(sqlOldItems, [id], (oldItemErr, oldItemRows) => {
                if (oldItemErr) return res.status(500).json({ message: "Error buscando ítems del pedido antiguo.", errorDetail: oldItemErr.message });
                oldOrderRow.items = oldItemRows || [];
                return res.json(oldOrderRow);
            });
        });
    } else {
        return res.status(400).json({ message: "ID de pedido inválido." });
    }
});
app.put("/api/orders/:unique_id/status", (req, res) => {
    const { status } = req.body;
    const { unique_id } = req.params;
    if (!status || !unique_id) return res.status(400).json({ message: "El estado y el ID son requeridos." });
    const [type, id] = unique_id.split('_');
    let tableName, statusColumn, dateColumn;
    if (type === 'venta') {
        tableName = 'sales_records';
        statusColumn = 'delivery_status';
        dateColumn = 'delivery_status_date';
    } else if (type === 'pedido') {
        tableName = 'orders';
        statusColumn = 'status';
        dateColumn = null;
    } else {
        return res.status(400).json({ message: "ID de pedido inválido." });
    }
    let sql, params = [status];
    if (dateColumn) {
        sql = `UPDATE ${tableName} SET ${statusColumn} = ?, ${dateColumn} = ? WHERE id = ?`;
        params.push(new Date().toISOString().split('T')[0], id);
    } else {
        sql = `UPDATE ${tableName} SET ${statusColumn} = ? WHERE id = ?`;
        params.push(id);
    }
    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ message: "Error al actualizar estado.", errorDetail: err.message });
        if (this.changes === 0) return res.status(404).json({ message: "ID de pedido no encontrado." });
        res.json({ message: "Estado de pedido actualizado." });
    });
});
app.post("/api/orders", (req, res) => {
    const { items, total_amount, status, customer_name } = req.body;
    if (!items || !items.length || total_amount === undefined) return res.status(400).json({ message: "Datos incompletos para crear el pedido." });
    db.serialize(() => {
        db.run("BEGIN TRANSACTION;");
        const sqlOrder = `INSERT INTO orders (customer_name_manual, total_amount, status, order_date) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`;
        db.run(sqlOrder, [customer_name || 'Cliente Anónimo', total_amount, status || 'Pendiente'], function (err) {
            if (err) { db.run("ROLLBACK;"); return res.status(500).json({ message: "Error DB creando pedido.", errorDetail: err.message }); }
            const orderId = this.lastID;
            const sqlItem = `INSERT INTO order_items (order_id, product_id, product_name, quantity, price_per_unit) VALUES (?, ?, ?, ?, ?)`;
            const stockPromises = items.map(item => new Promise((resolve, reject) => {
                db.run(sqlItem, [orderId, item.product_id, item.product_name, item.quantity, item.price_per_unit], (itemErr) => {
                    if (itemErr) return reject(itemErr);
                    db.run("UPDATE stock SET quantity = quantity - ? WHERE product_id = ?", [item.quantity, item.product_id], function (stockErr) {
                        if (stockErr) return reject(stockErr);
                        if (this.changes === 0) return reject(new Error(`Stock insuficiente o producto no encontrado para ID ${item.product_id}`));
                        resolve();
                    });
                });
            }));
            Promise.all(stockPromises)
                .then(() => {
                    db.run("COMMIT;", (commitErr) => {
                        if(commitErr) { db.run("ROLLBACK;"); return res.status(500).json({ message: "Error en COMMIT.", errorDetail: commitErr.message });}
                        res.status(201).json({ order_id: orderId, message: "Pedido creado exitosamente." });
                    });
                })
                .catch(error => {
                    db.run("ROLLBACK;");
                    res.status(500).json({ message: "Error procesando ítems del pedido.", errorDetail: error.message });
                });
        });
    });
});
app.get("/api/orders/:unique_id/pdf", async (req, res) => {
    const { unique_id } = req.params;
    const [type, id] = unique_id.split('_');
    const seller = { name: "DISTRIBUIDORA MARCIAL", razonSocial: "MARCIAL S.A.", domicilio: "Av. Siempre Viva 123, Santa Fe", condIVA: "Responsable Inscripto", cuit: "30-11111111-1" };
    if (!type || !id) return res.status(400).json({ message: "ID de pedido inválido." });
    const query = (sql, params = []) => new Promise((resolve, reject) => db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row))));
    const queryAll = (sql, params = []) => new Promise((resolve, reject) => db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))));
    try {
        let orderData, itemsData;
        if (type === 'venta') {
            orderData = await query(`SELECT sr.id, sr.sale_date, sr.total_amount, sr.payment_method, c.name as customer_name, c.address, c.localidad, c.phone, c.notes as customer_cuit FROM sales_records sr LEFT JOIN customers c ON sr.customer_id = c.id WHERE sr.id = ?`, [id]);
            itemsData = await queryAll(`SELECT p.name, si.quantity, si.price, p.id as product_code FROM sale_items si JOIN products p ON si.product_id = p.id WHERE si.sale_record_id = ?`, [id]);
        } else {
            orderData = await query(`SELECT id, order_date as sale_date, total_amount, 'Efectivo' as payment_method, customer_name_manual as customer_name FROM orders WHERE id = ?`, [id]);
            itemsData = await queryAll(`SELECT product_name as name, quantity, price_per_unit as price, product_id as product_code FROM order_items WHERE order_id = ?`, [id]);
        }
        if (!orderData) return res.status(404).json({ message: "Pedido no encontrado." });
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=remito-${id}.pdf`);
        doc.pipe(res);
        const pageW = doc.page.width;
        const pageH = doc.page.height;
        const margin = 40;
        if (fs.existsSync(path.join(__dirname, './uploads/logo.png'))) {
            doc.image(path.join(__dirname, './uploads/logo.png'), margin + 15, margin + 15, { width: 100 });
        }
        doc.moveTo(pageW / 2, margin).lineTo(pageW / 2, margin + 80).stroke();
        doc.fontSize(25).font('Helvetica-Bold').text('R', pageW / 2 + 15, margin + 25);
        doc.rect(pageW / 2 + 10, margin + 20, 40, 40).stroke();
        doc.fontSize(10).font('Helvetica').text('Documento No Válido Como Factura', pageW / 2 - 75, margin - 12);
        doc.font('Helvetica-Bold').text('REMITO', pageW / 2 + 60, margin + 15);
        doc.font('Helvetica').text(`Nº: ${String(id).padStart(8, '0')}`, pageW / 2 + 60, margin + 30);
        doc.text(`Fecha: ${new Date(orderData.sale_date).toLocaleDateString('es-AR')}`, pageW / 2 + 60, margin + 45);
        let y = margin + 85;
        doc.font('Helvetica-Bold').text('Razón Social:', margin + 15, y);
        doc.font('Helvetica').text(seller.razonSocial, margin + 85, y);
        y += 15;
        doc.font('Helvetica-Bold').text('Domicilio:', margin + 15, y);
        doc.font('Helvetica').text(seller.domicilio, margin + 85, y);
        y += 15;
        doc.font('Helvetica-Bold').text('Cond. IVA:', margin + 15, y);
        doc.font('Helvetica').text(seller.condIVA, margin + 85, y);
        y += 15;
        doc.font('Helvetica-Bold').text('CUIT:', margin + 15, y);
        doc.font('Helvetica').text(seller.cuit, margin + 85, y);
        doc.rect(margin, margin + 160, pageW - margin * 2, 80).stroke();
        y = margin + 170;
        doc.font('Helvetica-Bold').text('Cliente:', margin + 15, y);
        doc.font('Helvetica').text(orderData.customer_name || 'Consumidor Final', margin + 85, y);
        y += 15;
        doc.font('Helvetica-Bold').text('Localidad:', margin + 15, y);
        doc.font('Helvetica').text(orderData.localidad || 'Santa Fe', margin + 85, y);
        y += 15;
        doc.font('Helvetica-Bold').text('Documento:', margin + 15, y);
        doc.font('Helvetica').text(orderData.customer_cuit || 'N/A', margin + 85, y);
        y = margin + 170;
        doc.font('Helvetica-Bold').text('Provincia:', pageW / 2, y);
        doc.font('Helvetica').text('Santa Fe', pageW / 2 + 55, y);
        y += 15;
        doc.font('Helvetica-Bold').text('Teléfono:', pageW / 2, y);
        doc.font('Helvetica').text(orderData.phone || 'N/A', pageW / 2 + 55, y);
        const tableTop = 260;
        const tableHeaders = ["Código", "Descripción", "Cantidad", "P. Unitario", "IVA", "Total"];
        const colStarts = [margin, 110, 310, 370, 440, 490];
        doc.font('Helvetica-Bold');
        tableHeaders.forEach((header, i) => doc.text(header, colStarts[i], tableTop + 10));
        doc.rect(margin, tableTop, pageW - margin * 2, 30).stroke();
        let tableY = tableTop + 40;
        doc.font('Helvetica');
        itemsData.forEach(item => {
            const subtotal = item.quantity * item.price;
            doc.text(item.product_code || 'N/A', colStarts[0] + 5, tableY);
            doc.text(item.name, colStarts[1] + 5, tableY, { width: 180 });
            doc.text(item.quantity.toFixed(2), colStarts[2] + 5, tableY);
            doc.text(formatCurrency(item.price), colStarts[3] + 5, tableY);
            doc.text("0%", colStarts[4] + 5, tableY);
            doc.text(formatCurrency(subtotal), colStarts[5] + 5, tableY);
            tableY += 20;
        });
        doc.rect(margin, tableTop + 30, pageW - margin * 2, tableY - (tableTop + 30) + 200).stroke();
        const footerY = pageH - margin - 100;
        doc.rect(margin, footerY, pageW - margin * 2, 60).stroke();
        doc.font('Helvetica').text('Forma de pago:', margin + 15, footerY + 15);
        doc.font('Helvetica-Bold').text(orderData.payment_method === 'cta_cte' ? 'Cuenta Corriente' : 'Contado', margin + 90, footerY + 15);
        doc.font('Helvetica-Bold').fontSize(12).text('TOTAL:', pageW / 2, footerY + 25);
        doc.fontSize(14).text(formatCurrency(orderData.total_amount), pageW - margin - 100, footerY + 23, { align: 'right'});
        if (fs.existsSync(path.join(__dirname, 'logo.png'))) {
            doc.image(path.join(__dirname, 'logo.png'), margin, footerY + 70, { width: 60 });
        }
        doc.fontSize(8).text('Página 1', pageW - margin - 40, footerY + 80);
        doc.end();
    } catch (error) {
        res.status(500).json({ message: "No se pudo generar el PDF.", error: error.message });
    }
});

// --- COSTOS ---
app.get("/api/costs", (req, res) => {
    db.all("SELECT * FROM costs ORDER BY cost_date DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ message: "Error al obtener costos.", errorDetail: err.message });
        res.json(rows);
    });
});
app.post("/api/costs", (req, res) => {
    const { description, amount, cost_type, cost_date, notes } = req.body;
    if (!description || !amount || !cost_type || !cost_date) return res.status(400).json({ message: "Descripción, monto, tipo y fecha son requeridos." });
    const sql = "INSERT INTO costs (description, amount, cost_type, cost_date, notes) VALUES (?, ?, ?, ?, ?)";
    db.run(sql, [description, amount, cost_type, cost_date, notes], function(err) {
        if (err) return res.status(500).json({ message: "Error al guardar el costo.", errorDetail: err.message });
        res.status(201).json({ id: this.lastID, ...req.body });
    });
});
app.delete("/api/costs/:id", (req, res) => {
    db.run("DELETE FROM costs WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ message: "Error al eliminar el costo.", errorDetail: err.message });
        if (this.changes === 0) return res.status(404).json({ message: "Costo no encontrado." });
        res.json({ message: "Costo eliminado exitosamente." });
    });
});

// --- GESTIÓN DE FLOTA ---
app.get("/api/vehicles", (req, res) => {
    const sql = "SELECT * FROM vehicles ORDER BY name ASC";
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ message: "Error al obtener vehículos.", error: err.message });
        res.json(rows);
    });
});
app.post("/api/vehicles", (req, res) => {
    const { name, plate, brand, model, year, last_service_date, next_service_due_km, insurance_expiry_date, vtv_expiry_date, notes } = req.body;
    if (!name || !plate) return res.status(400).json({ message: "El nombre y la patente son obligatorios." });
    const sql = `INSERT INTO vehicles (name, plate, brand, model, year, last_service_date, next_service_due_km, insurance_expiry_date, vtv_expiry_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [name, plate.toUpperCase(), brand, model, year, last_service_date, next_service_due_km, insurance_expiry_date, vtv_expiry_date, notes];
    db.run(sql, params, function(err) {
        if (err) {
            if (err.message.includes("UNIQUE")) return res.status(400).json({ message: `La patente '${plate.toUpperCase()}' ya está registrada.` });
            return res.status(500).json({ message: "Error al guardar el vehículo.", error: err.message });
        }
        res.status(201).json({ id: this.lastID, ...req.body });
    });
});
app.put("/api/vehicles/:id", (req, res) => {
    const { id } = req.params;
    const { name, plate, brand, model, year, last_service_date, next_service_due_km, insurance_expiry_date, vtv_expiry_date, notes } = req.body;
    if (!name || !plate) return res.status(400).json({ message: "El nombre y la patente son obligatorios." });
    const sql = `UPDATE vehicles SET name = ?, plate = ?, brand = ?, model = ?, year = ?, last_service_date = ?, next_service_due_km = ?, insurance_expiry_date = ?, vtv_expiry_date = ?, notes = ? WHERE id = ?`;
    const params = [name, plate.toUpperCase(), brand, model, year, last_service_date, next_service_due_km, insurance_expiry_date, vtv_expiry_date, notes, id];
    db.run(sql, params, function(err) {
        if (err) {
             if (err.message.includes("UNIQUE")) return res.status(400).json({ message: `La patente '${plate.toUpperCase()}' ya pertenece a otro vehículo.` });
            return res.status(500).json({ message: "Error al actualizar el vehículo.", error: err.message });
        }
        if (this.changes === 0) return res.status(404).json({ message: "Vehículo no encontrado." });
        res.json({ message: "Vehículo actualizado exitosamente." });
    });
});
app.delete("/api/vehicles/:id", (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM vehicles WHERE id = ?";
    db.run(sql, id, function(err) {
        if (err) return res.status(500).json({ message: "Error al eliminar el vehículo.", error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: "Vehículo no encontrado." });
        res.json({ message: "Vehículo eliminado exitosamente." });
    });
});

// --- TRANSFORMACIÓN DE PRODUCTOS ---
app.post("/api/transformations", (req, res) => {
    const { notes, inputs, outputs } = req.body;
    if (!inputs || inputs.length === 0 || !outputs || outputs.length === 0) return res.status(400).json({ message: "Se requiere al menos un producto de entrada y uno de salida." });
    db.serialize(() => {
        db.run("BEGIN TRANSACTION;");
        const sqlTransformation = `INSERT INTO transformations (notes) VALUES (?)`;
        db.run(sqlTransformation, [notes], function(err) {
            if (err) { db.run("ROLLBACK;"); return res.status(500).json({ message: "Error al crear el registro de transformación.", error: err.message }); }
            const transformationId = this.lastID;
            let promises = [];
            inputs.forEach(item => {
                const promise = new Promise((resolve, reject) => {
                    const sqlItem = `INSERT INTO transformation_items (transformation_id, product_id, quantity, type) VALUES (?, ?, ?, 'input')`;
                    db.run(sqlItem, [transformationId, item.productId, item.quantity], (err) => {
                        if (err) return reject(err);
                        const sqlStock = `UPDATE stock SET quantity = quantity - ? WHERE product_id = ? AND quantity >= ?`;
                        db.run(sqlStock, [item.quantity, item.productId, item.quantity], function(err) {
                            if (err) return reject(err);
                            if (this.changes === 0) return reject(new Error(`Stock insuficiente para el producto de entrada ID ${item.productId}`));
                            resolve();
                        });
                    });
                });
                promises.push(promise);
            });
            outputs.forEach(item => {
                const promise = new Promise((resolve, reject) => {
                    const sqlItem = `INSERT INTO transformation_items (transformation_id, product_id, quantity, type) VALUES (?, ?, ?, 'output')`;
                    db.run(sqlItem, [transformationId, item.productId, item.quantity], (err) => {
                        if (err) return reject(err);
                        const sqlStock = `UPDATE stock SET quantity = quantity + ? WHERE product_id = ?`;
                        db.run(sqlStock, [item.quantity, item.productId], function(err) {
                            if (err) return reject(err);
                            if (this.changes === 0) {
                                db.run(`INSERT INTO stock (product_id, quantity) VALUES (?, ?)`, [item.productId, item.quantity], (err) => {
                                    if(err) return reject(err);
                                    resolve();
                                });
                            } else {
                                resolve();
                            }
                        });
                    });
                });
                promises.push(promise);
            });
            Promise.all(promises)
                .then(() => {
                    db.run("COMMIT;");
                    res.status(201).json({ id: transformationId, message: "Transformación procesada y stock actualizado." });
                })
                .catch(error => {
                    db.run("ROLLBACK;");
                    res.status(500).json({ message: "Error procesando la transformación.", error: error.message });
                });
        });
    });
});

// --- LOGÍSTICA Y HOJAS DE RUTA ---
app.get("/api/logistics/pending-orders", (req, res) => {
    const sql = `SELECT sr.*, c.name as customer_name, c.address, c.localidad FROM sales_records sr JOIN customers c ON sr.customer_id = c.id LEFT JOIN delivery_route_orders dro ON sr.id = dro.order_id WHERE dro.route_id IS NULL AND sr.delivery_status = 'Pendiente' ORDER BY sr.sale_date ASC`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ message: "Error al obtener pedidos pendientes.", error: err.message });
        res.json(rows);
    });
});
app.post("/api/logistics/routes", (req, res) => {
    const { route_date, vehicle_id, driver_name, order_ids } = req.body;
    if (!route_date || !vehicle_id || !order_ids || order_ids.length === 0) return res.status(400).json({ message: "La fecha, el vehículo y al menos un pedido son requeridos." });
    db.serialize(() => {
        db.run("BEGIN TRANSACTION;");
        const sqlRoute = `INSERT INTO delivery_routes (route_date, vehicle_id, driver_name) VALUES (?, ?, ?)`;
        db.run(sqlRoute, [route_date, vehicle_id, driver_name], function(err) {
            if (err) { db.run("ROLLBACK;"); return res.status(500).json({ message: "Error al crear la ruta.", error: err.message }); }
            const routeId = this.lastID;
            const sqlLink = `INSERT INTO delivery_route_orders (route_id, order_id, delivery_order) VALUES (?, ?, ?)`;
            const sqlUpdateStatus = `UPDATE sales_records SET delivery_status = 'En preparación' WHERE id = ?`;
            let promises = order_ids.map((orderId, index) => {
                return new Promise((resolve, reject) => {
                    db.run(sqlLink, [routeId, orderId, index + 1], (err) => {
                        if (err) return reject(err);
                        db.run(sqlUpdateStatus, [orderId], (err) => {
                            if (err) return reject(err);
                            resolve();
                        });
                    });
                });
            });
            Promise.all(promises)
                .then(() => {
                    db.run("COMMIT;");
                    res.status(201).json({ id: routeId, message: "Hoja de ruta creada exitosamente." });
                })
                .catch(error => {
                    db.run("ROLLBACK;");
                    res.status(500).json({ message: "Error al asociar pedidos a la ruta.", error: error.message });
                });
        });
    });
});
app.get("/api/logistics/routes", (req, res) => {
    const sql = `SELECT dr.*, v.name as vehicle_name, v.plate as vehicle_plate, COUNT(dro.order_id) as order_count FROM delivery_routes dr LEFT JOIN vehicles v ON dr.vehicle_id = v.id LEFT JOIN delivery_route_orders dro ON dr.id = dro.route_id GROUP BY dr.id ORDER BY dr.route_date DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ message: "Error al obtener las hojas de ruta.", error: err.message });
        res.json(rows);
    });
});
app.get("/api/logistics/routes/:id/pdf", async (req, res) => {
    const { id } = req.params;
    const query = (sql, params = []) => new Promise((resolve, reject) => db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row))));
    const queryAll = (sql, params = []) => new Promise((resolve, reject) => db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))));
    try {
        const routeData = await query(`SELECT dr.route_date, dr.driver_name, v.name as vehicle_name, v.plate as vehicle_plate FROM delivery_routes dr JOIN vehicles v ON dr.vehicle_id = v.id WHERE dr.id = ?`, [id]);
        if (!routeData) return res.status(404).json({ message: "Hoja de ruta no encontrada." });
        const orders = await queryAll(`SELECT sr.id, sr.sale_amount, c.name as customer_name, c.address, c.localidad FROM delivery_route_orders dro JOIN sales_records sr ON dro.order_id = sr.id JOIN customers c ON sr.customer_id = c.id WHERE dro.route_id = ? ORDER BY dro.delivery_order ASC`, [id]);
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=hoja-de-ruta-${id}.pdf`);
        doc.pipe(res);
        doc.fontSize(20).font('Helvetica-Bold').text('Hoja de Ruta', { align: 'center' });
        doc.fontSize(12).font('Helvetica').moveDown();
        doc.text(`Fecha: ${new Date(routeData.route_date).toLocaleDateString('es-AR')}`);
        doc.text(`Vehículo: ${routeData.vehicle_name} (${routeData.vehicle_plate})`);
        doc.text(`Conductor: ${routeData.driver_name || 'No especificado'}`);
        doc.moveDown(2);
        for (const [index, order] of orders.entries()) {
            doc.fontSize(14).font('Helvetica-Bold').text(`${index + 1}. ${order.customer_name}`);
            doc.fontSize(10).font('Helvetica');
            doc.text(`Dirección: ${order.address}, ${order.localidad}`);
            doc.text(`Monto a Cobrar: ${formatCurrency(order.sale_amount)}`);
            doc.rect(doc.x, doc.y + 5, 250, 50).stroke();
            doc.fontSize(8).text('Firma y Aclaración:', doc.x + 5, doc.y + 10);
            doc.moveDown(4);
            if (doc.y > 680 && index < orders.length - 1) doc.addPage();
        }
        doc.end();
    } catch (error) {
        res.status(500).json({ message: "No se pudo generar el PDF.", error: error.message });
    }
});

// --- DASHBOARD, REPORTES Y NOTIFICACIONES ---
app.get("/api/dashboard/stats", (req, res) => {
    const period = parseInt(req.query.period || 30);
    const query = (sql, params = []) => new Promise((resolve, reject) => db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row))));
    const getStatsForPeriod = async (startDate, endDate) => {
        const costOfGoodsSoldSql = `SELECT SUM(si.quantity * p.cost_price) as totalCost FROM sale_items si JOIN products p ON si.product_id = p.id JOIN sales_records sr ON si.sale_record_id = sr.id WHERE sr.sale_date BETWEEN ? AND ?`;
        const [sales, cogs, avg, customers] = await Promise.all([
            query("SELECT SUM(sale_amount) as totalSales FROM sales_records WHERE sale_date BETWEEN ? AND ?", [startDate, endDate]),
            query(costOfGoodsSoldSql, [startDate, endDate]),
            query("SELECT AVG(sale_amount) as avgSale FROM sales_records WHERE sale_date BETWEEN ? AND ?", [startDate, endDate]),
            query("SELECT COUNT(*) as newCustomers FROM customers WHERE created_at BETWEEN ? AND ?", [startDate, endDate])
        ]);
        const totalSales = sales.totalSales || 0;
        const totalCost = cogs.totalCost || 0;
        const grossMargin = totalSales - totalCost;
        return { totalSales, grossMargin, avgSale: avg.avgSale || 0, newCustomers: customers.newCustomers || 0 };
    };
    const now = new Date();
    const currentEndDate = now.toISOString();
    const currentStartDate = new Date(new Date().setDate(now.getDate() - period)).toISOString();
    const previousEndDate = new Date(new Date().setDate(now.getDate() - period)).toISOString();
    const previousStartDate = new Date(new Date().setDate(now.getDate() - (period * 2))).toISOString();
    Promise.all([
        getStatsForPeriod(currentStartDate, currentEndDate),
        getStatsForPeriod(previousStartDate, previousEndDate)
    ]).then(([currentStats, previousStats]) => {
        res.json({ current: currentStats, previous: previousStats });
    }).catch(err => {
        res.status(500).json({ message: "Error al obtener estadísticas comparativas.", error: err.message });
    });
});
app.get("/api/dashboard/top-salespeople", (req, res) => {
    const sql = `SELECT sp.name, COUNT(sr.id) as salesCount, SUM(sr.sale_amount) as totalAmount FROM sales_records sr JOIN salespeople sp ON sr.salesperson_id = sp.id GROUP BY sr.salesperson_id ORDER BY totalAmount DESC LIMIT 5`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ message: "Error obteniendo top vendedores.", error: err.message });
        res.json(rows);
    });
});
app.get("/api/dashboard/inventory-value", (req, res) => {
    const sql = `SELECT SUM(s.quantity * p.cost_price) as totalValue FROM stock s JOIN products p ON s.product_id = p.id`;
    db.get(sql, [], (err, row) => {
        if (err) return res.status(500).json({ message: "Error calculando valor del inventario.", error: err.message });
        res.json({ totalValue: row.totalValue || 0 });
    });
});
app.get("/api/dashboard/top-products", (req, res) => {
    const sql = `SELECT p.name, SUM(si.quantity) as total FROM sale_items si JOIN products p ON si.product_id = p.id GROUP BY si.product_id ORDER BY total DESC LIMIT 5`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ message: "Error obteniendo top productos.", error: err.message });
        res.json(rows);
    });
});
app.get("/api/dashboard/top-clients", (req, res) => {
    const sql = `SELECT c.name, SUM(sr.sale_amount) as total FROM sales_records sr JOIN customers c ON sr.customer_id = c.id GROUP BY sr.customer_id ORDER BY total DESC LIMIT 5`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ message: "Error obteniendo top clientes.", error: err.message });
        res.json(rows);
    });
});
app.get("/api/reports/sales-over-time", (req, res) => {
    const { days = 30 } = req.query;
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);
    const dateLimitString = dateLimit.toISOString().split('T')[0];
    const sql = `SELECT DATE(sale_date) as date, SUM(sale_amount) as total_sales FROM sales_records WHERE sale_date >= ? GROUP BY DATE(sale_date) ORDER BY date ASC`;
    db.all(sql, [dateLimitString], (err, rows) => {
        if (err) return res.status(500).json({ message: "Error obteniendo datos para el gráfico.", errorDetail: err.message });
        res.json(rows);
    });
});
app.get("/api/reports/profit-loss", async (req, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ message: "Las fechas de inicio y fin son requeridas." });
    const query = (sql, params = []) => new Promise((resolve, reject) => db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row))));
    const queryAll = (sql, params = []) => new Promise((resolve, reject) => db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))));
    try {
        const salesData = await query("SELECT SUM(sale_amount) as totalSales FROM sales_records WHERE sale_date BETWEEN ? AND ?", [startDate, endDate]);
        const totalSales = salesData.totalSales || 0;
        const cogsData = await query(`SELECT SUM(si.quantity * p.cost_price) as totalCost FROM sale_items si JOIN products p ON si.product_id = p.id JOIN sales_records sr ON si.sale_record_id = sr.id WHERE sr.sale_date BETWEEN ? AND ?`, [startDate, endDate]);
        const costOfGoodsSold = cogsData.totalCost || 0;
        const grossMargin = totalSales - costOfGoodsSold;
        const otherCostsData = await query("SELECT SUM(amount) as totalOtherCosts FROM costs WHERE cost_date BETWEEN ? AND ?", [startDate, endDate]);
        const otherCosts = otherCostsData.totalOtherCosts || 0;
        const otherCostsDetail = await queryAll("SELECT cost_date, description, amount FROM costs WHERE cost_date BETWEEN ? AND ? ORDER BY cost_date DESC", [startDate, endDate]);
        const netProfit = grossMargin - otherCosts;
        res.json({ totalSales, costOfGoodsSold, grossMargin, otherCosts, otherCostsDetail, netProfit, period: { startDate, endDate } });
    } catch (error) {
        res.status(500).json({ message: "No se pudo generar el reporte.", error: error.message });
    }
});
app.get("/api/notifications", (req, res) => {
    const queryAll = (sql, params = []) => new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows || []));
    });
    const today = new Date().toISOString().split('T')[0];
    const in30Days = new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0];
    const lowStockThreshold = 10;
    Promise.all([
        queryAll(`SELECT p.name, s.quantity FROM stock s JOIN products p ON s.product_id = p.id WHERE s.quantity <= ? AND s.quantity > 0`, [lowStockThreshold]),
        queryAll(`SELECT name, lot_number, expiration_date FROM products WHERE expiration_date BETWEEN ? AND ? ORDER BY expiration_date ASC`, [today, in30Days]),
        queryAll(`SELECT s.name as supplier_name, sp.invoice_number, sp.payment_due_date FROM supplier_purchases sp JOIN suppliers s ON sp.supplier_id = s.id WHERE sp.payment_status = 'Pendiente' AND sp.payment_due_date BETWEEN ? AND ? ORDER BY sp.payment_due_date ASC`, [today, in30Days]),
        queryAll(`SELECT c.name FROM customers c WHERE c.id NOT IN (SELECT DISTINCT customer_id FROM sales_records WHERE sale_date >= date('now', '-30 days'))`)
    ]).then(([lowStock, expiringProducts, duePayments, inactiveCustomers]) => {
        const notifications = [];
        lowStock.forEach(p => notifications.push({ type: 'warning', message: `Bajo Stock: Quedan solo ${p.quantity} de ${p.name}.` }));
        expiringProducts.forEach(p => notifications.push({ type: 'danger', message: `Vencimiento Próximo: ${p.name} (lote ${p.lot_number || 'N/A'}) vence el ${p.expiration_date}.` }));
        duePayments.forEach(p => notifications.push({ type: 'info', message: `Pago Próximo: Vence el pago a ${p.supplier_name} (fact. ${p.invoice_number || 'N/A'}) el ${p.payment_due_date}.` }));
        inactiveCustomers.forEach(c => notifications.push({ type: 'success', message: `Oportunidad: El cliente ${c.name} no compra hace más de 30 días.` }));
        res.json(notifications);
    }).catch(err => {
        res.status(500).json({ message: "Error al generar notificaciones.", error: err.message });
    });
});

// --- INICIAR EL SERVIDOR ---
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
