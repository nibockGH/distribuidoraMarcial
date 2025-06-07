const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

const dbPath = path.resolve(__dirname, "database.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("Error al conectar con la base de datos SQLite:", err.message);
  else console.log("Conectado a la base de datos SQLite.");
});

// Creación de todas las tablas en secuencia
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY, name TEXT NOT NULL, price REAL NOT NULL, unidad TEXT DEFAULT 'unidad')`, (err) => {
      if (err) console.error("Error creando tabla 'products':", err.message);
      else {
        console.log("Tabla 'products' OK.");
        cargarProductosInicialesSiEsNecesario();
      }
    }
  );
  db.run(`CREATE TABLE IF NOT EXISTS stock (product_id INTEGER PRIMARY KEY, quantity INTEGER NOT NULL DEFAULT 0, last_updated DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE)`, (err) => { if (err) console.error("Error creando tabla stock:", err.message); else console.log("Tabla 'stock' OK."); });
  db.run(`CREATE TABLE IF NOT EXISTS customers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, address TEXT, phone TEXT, email TEXT UNIQUE, contact_person TEXT, business_type TEXT, notes TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)`, (err) => { if (err) console.error("Error tabla customers:", err.message); else console.log("Tabla 'customers' OK.");});
  db.run(`CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id INTEGER, order_date DATETIME DEFAULT CURRENT_TIMESTAMP, status TEXT DEFAULT 'Pendiente', total_amount REAL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL)`, (err) => { if (err) console.error("Error tabla orders:", err.message); else console.log("Tabla 'orders' OK.");});
  db.run(`CREATE TABLE IF NOT EXISTS order_items (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL, product_id INTEGER, product_name TEXT NOT NULL, quantity INTEGER NOT NULL, price_per_unit REAL NOT NULL, FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE, FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL)`, (err) => { if (err) console.error("Error tabla order_items:", err.message); else console.log("Tabla 'order_items' OK.");});
  db.run(`CREATE TABLE IF NOT EXISTS salespeople (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)`, (err) => { if (err) console.error("Error tabla salespeople:", err.message); else console.log("Tabla 'salespeople' OK.");});
  db.run(`CREATE TABLE IF NOT EXISTS sales_records (id INTEGER PRIMARY KEY AUTOINCREMENT, salesperson_id INTEGER NOT NULL, customer_id INTEGER, customer_name_manual TEXT, order_id INTEGER, sale_amount REAL NOT NULL, commission_rate REAL DEFAULT 0.05, commission_amount REAL NOT NULL, sale_date DATETIME DEFAULT CURRENT_TIMESTAMP, notes TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (salesperson_id) REFERENCES salespeople(id) ON DELETE CASCADE, FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL, FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL)`, (err) => { if (err) console.error("Error tabla sales_records:", err.message); else console.log("Tabla 'sales_records' OK.");});
  db.run(`CREATE TABLE IF NOT EXISTS sales_record_items (id INTEGER PRIMARY KEY AUTOINCREMENT, sales_record_id INTEGER NOT NULL, product_id INTEGER NOT NULL, product_name TEXT NOT NULL, quantity INTEGER NOT NULL, price_per_unit REAL NOT NULL, FOREIGN KEY (sales_record_id) REFERENCES sales_records(id) ON DELETE CASCADE, FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL)`, (err) => { if (err) console.error("Error creando tabla sales_record_items:", err.message); else console.log("Tabla 'sales_record_items' OK.");});
  db.run(`CREATE TABLE IF NOT EXISTS customer_prices (customer_id INTEGER NOT NULL, product_id INTEGER NOT NULL, special_price REAL NOT NULL, PRIMARY KEY (customer_id, product_id), FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE, FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE)`, (err) => { if (err) console.error("Error creando tabla customer_prices:", err.message); else console.log("Tabla 'customer_prices' OK.");});
});

function cargarProductosInicialesSiEsNecesario(callback) {
  db.get("SELECT COUNT(*) as total FROM products", [], (err, row) => {
    if (err) { if (callback) callback(err); return; }
    if (row && row.total > 0) {
      if (callback) callback();
      return;
    }
    console.log("Tabla 'products' vacía. Cargando datos y stock desde productsData.json...");
    try {
      const dataPath = path.resolve(__dirname, "../src/data/productsData.json");
      const products = JSON.parse(fs.readFileSync(dataPath, "utf8"));
      const insertProduct = db.prepare("INSERT INTO products (id, name, price, unidad) VALUES (?, ?, ?, ?)");
      const insertStock = db.prepare("INSERT INTO stock (product_id, quantity) VALUES (?, ?)");
      db.serialize(() => {
        db.run("BEGIN TRANSACTION;");
        products.forEach((p) => {
          insertProduct.run(p.id, p.nombre || p.name, p.precio || p.price, p.unidad || 'unidad');
          insertStock.run(p.id, p.stock || 0);
        });
        insertProduct.finalize();
        insertStock.finalize();
        db.run("COMMIT;", (commitErr) => {
          if (commitErr) {
            console.error("Fallo el COMMIT, haciendo ROLLBACK...", commitErr);
            db.run("ROLLBACK;");
          } else {
            console.log("Productos y stock inicial cargados exitosamente.");
          }
          if (callback) callback(commitErr);
        });
      });
    } catch (e) {
      console.error("Error al leer o cargar productsData.json:", e.message);
      if (callback) callback(e);
    }
  });
}

// --- Endpoints ---
app.get("/api/products", (req, res) => {
  const sql = `SELECT p.id, p.name, p.price, p.unidad, COALESCE(s.quantity, 0) as stock FROM products p LEFT JOIN stock s ON p.id = s.product_id ORDER BY p.id ASC`;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ message: "Error al obtener productos de la DB.", errorDetail: err.message });
    const products = rows.map(row => ({ id: row.id, nombre: row.name, precio: row.price, unidad: row.unidad, stock: row.stock }));
    res.json(products);
  });
});
app.post("/api/products", (req, res) => {
  const { nombre, precio, unidad, stock } = req.body;
  if (!nombre || precio === undefined || !unidad) return res.status(400).json({ error: "Nombre, precio y unidad son requeridos" });
  db.run("INSERT INTO products (name, price, unidad) VALUES (?, ?, ?)", [nombre, parseFloat(precio), unidad], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    const newProductId = this.lastID;
    db.run("INSERT INTO stock (product_id, quantity) VALUES (?, ?)", [newProductId, parseInt(stock) || 0], (stockErr) => {
      if (stockErr) return res.status(500).json({ error: stockErr.message });
      res.status(201).json({ id: newProductId, nombre, precio: parseFloat(precio), unidad, stock: parseInt(stock) || 0 });
    });
  });
});
app.put("/api/products/:id", (req, res) => {
  const { nombre, precio, unidad } = req.body;
  db.run("UPDATE products SET name = ?, price = ?, unidad = ? WHERE id = ?", [nombre, parseFloat(precio), unidad, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Producto no encontrado" });
    res.json({ id: Number(req.params.id), nombre, precio: parseFloat(precio), unidad });
  });
});
app.delete("/api/products/:id", (req, res) => {
  db.run("DELETE FROM products WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ message: "Error al eliminar producto.", errorDetail: err.message });
    if (this.changes === 0) return res.status(404).json({ message: "Producto no encontrado." });
    res.json({ message: "Producto eliminado exitosamente" });
  });
});
app.put("/api/stock/:productId", (req, res) => {
    const { quantity } = req.body;
    db.run("UPDATE stock SET quantity = ?, last_updated = CURRENT_TIMESTAMP WHERE product_id = ?", [parseInt(quantity), req.params.productId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: "Producto no encontrado en stock." });
        res.json({ message: "Stock actualizado." });
    });
});
app.post("/api/customers", (req, res) => {
  const { name, address, phone, email, contact_person, business_type, notes } = req.body;
  if (!name) return res.status(400).json({ message: "El nombre del cliente es requerido." });
  const processedEmail = email ? email.toLowerCase() : null;
  if (processedEmail) {
    db.get("SELECT id FROM customers WHERE email = ?", [processedEmail], (err, row) => {
      if (err) return res.status(500).json({ message: "Error DB al verificar email.", errorDetail: err.message });
      if (row) return res.status(400).json({ message: `El email '${email}' ya está registrado.` });
      insertCustomer();
    });
  } else {
    insertCustomer();
  }
  function insertCustomer() {
    const sql = `INSERT INTO customers (name, address, phone, email, contact_person, business_type, notes, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;
    const params = [name, address, phone, processedEmail, contact_person, business_type, notes];
    db.run(sql, params, function (err) {
      if (err) return res.status(500).json({ message: "Error DB al crear cliente.", errorDetail: err.message });
      res.status(201).json({ id: this.lastID, name, email: processedEmail, address, phone, contact_person, business_type, notes });
    });
  }
});
app.get("/api/customers", (req, res) => {
  db.all("SELECT * FROM customers ORDER BY name ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ message: "Error.", errorDetail: err.message });
    res.json(rows);
  });
});
app.get("/api/customers/:id", (req, res) => {
  db.get("SELECT * FROM customers WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ message: "Error.", errorDetail: err.message });
    if (!row) return res.status(404).json({ message: "Cliente no encontrado." });
    res.json(row);
  });
});
app.put("/api/customers/:id", (req, res) => {
  const { id } = req.params;
  const { name, address, phone, email, contact_person, business_type, notes } = req.body;
  if (!name) return res.status(400).json({ message: "El nombre es requerido." });
  const processedEmail = email ? email.toLowerCase() : null;
  if (processedEmail) {
    db.get("SELECT id FROM customers WHERE email = ? AND id != ?", [processedEmail, id], (err, row) => {
      if (err) return res.status(500).json({ message: "Error.", errorDetail: err.message });
      if (row) return res.status(400).json({ message: `El email '${email}' ya está registrado.` });
      executeUpdate();
    });
  } else {
    executeUpdate();
  }
  function executeUpdate() {
    const sql = `UPDATE customers SET name = ?, address = ?, phone = ?, email = ?, contact_person = ?, business_type = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    const params = [name, address, phone, processedEmail, contact_person, business_type, notes, id];
    db.run(sql, params, function (err) {
      if (err) return res.status(500).json({ message: "Error.", errorDetail: err.message });
      if (this.changes === 0) return res.status(404).json({ message: "Cliente no encontrado." });
      res.json({ message: "Cliente actualizado." });
    });
  }
});
app.delete("/api/customers/:id", (req, res) => {
  db.run("DELETE FROM customers WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ message: "Error.", errorDetail: err.message });
    if (this.changes === 0) return res.status(404).json({ message: "Cliente no encontrado." });
    res.json({ message: "Cliente eliminado." });
  });
});
app.get("/api/customers/:customerId/orders", (req, res) => {
    db.all("SELECT * FROM orders WHERE customer_id = ? ORDER BY order_date DESC", [req.params.customerId], (err, rows) => {
        if (err) return res.status(500).json({ message: "Error.", errorDetail: err.message });
        res.json(rows);
    });
});
app.get("/api/customers/:customerId/prices", (req, res) => {
  const { customerId } = req.params;
  const sql = `SELECT cp.product_id, p.name as product_name, cp.special_price FROM customer_prices cp JOIN products p ON cp.product_id = p.id WHERE cp.customer_id = ?`;
  db.all(sql, [customerId], (err, rows) => {
    if (err) return res.status(500).json({ message: "Error al obtener precios especiales.", errorDetail: err.message });
    res.json(rows);
  });
});
app.post("/api/customers/:customerId/prices", (req, res) => {
  const { customerId } = req.params;
  const { productId, specialPrice } = req.body;
  if (!productId || specialPrice === undefined) return res.status(400).json({ message: "Se requiere productId y specialPrice." });
  const sql = "INSERT OR REPLACE INTO customer_prices (customer_id, product_id, special_price) VALUES (?, ?, ?)";
  db.run(sql, [customerId, productId, specialPrice], function(err) {
    if (err) return res.status(500).json({ message: "Error al guardar el precio especial.", errorDetail: err.message });
    res.status(201).json({ message: "Precio especial guardado." });
  });
});
app.delete("/api/customers/:customerId/prices/:productId", (req, res) => {
  const { customerId, productId } = req.params;
  const sql = "DELETE FROM customer_prices WHERE customer_id = ? AND product_id = ?";
  db.run(sql, [customerId, productId], function(err) {
    if (err) return res.status(500).json({ message: "Error al eliminar el precio especial.", errorDetail: err.message });
    if (this.changes === 0) return res.status(404).json({ message: "Precio especial no encontrado." });
    res.json({ message: "Precio especial eliminado." });
  });
});
app.post("/api/orders", (req, res) => {
  const { customer_id, items, total_amount, status } = req.body;
  if (!items || items.length === 0 || total_amount === undefined) return res.status(400).json({ message: "Datos del pedido incompletos." });
  db.serialize(() => {
    db.run("BEGIN TRANSACTION;");
    const sqlOrder = `INSERT INTO orders (customer_id, total_amount, status, order_date) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`;
    db.run(sqlOrder, [customer_id || null, total_amount, status || 'Pendiente'], function (err) {
      if (err) { db.run("ROLLBACK;"); return res.status(500).json({ message: "Error DB creando pedido.", errorDetail: err.message }); }
      const orderId = this.lastID;
      const sqlItem = `INSERT INTO order_items (order_id, product_id, product_name, quantity, price_per_unit) VALUES (?, ?, ?, ?, ?)`;
      const stockPromises = items.map(item => new Promise((resolve, reject) => {
          db.run(sqlItem, [orderId, item.product_id, item.product_name, item.quantity, item.price_per_unit], (itemErr) => {
            if (itemErr) return reject(itemErr);
            db.run("UPDATE stock SET quantity = quantity - ? WHERE product_id = ? AND quantity >= ?", [item.quantity, item.product_id, item.quantity], function (stockErr) {
              if (stockErr) return reject(stockErr);
              if (this.changes === 0) return reject(new Error(`Stock insuficiente para producto ID ${item.product_id}`));
              resolve();
            });
          });
      }));
      Promise.all(stockPromises)
        .then(() => { db.run("COMMIT;"); res.status(201).json({ order_id: orderId, message: "Pedido creado y stock actualizado." }); })
        .catch(error => { db.run("ROLLBACK;"); res.status(500).json({ message: "Error procesando ítems o stock.", errorDetail: error.message }); });
    });
  });
});
app.get("/api/orders", (req, res) => {
  const sql = `SELECT o.*, c.name as customer_name FROM orders o LEFT JOIN customers c ON o.customer_id = c.id ORDER BY o.order_date DESC`;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ message: "Error.", errorDetail: err.message });
    res.json(rows);
  });
});
app.get("/api/orders/:id", (req, res) => {
  let orderDetails = {};
  const sqlOrder = `SELECT o.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone, c.address as customer_address FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE o.id = ?`;
  db.get(sqlOrder, [req.params.id], (err, orderRow) => {
    if (err) return res.status(500).json({ message: "Error.", errorDetail: err.message });
    if (!orderRow) return res.status(404).json({ message: "Pedido no encontrado." });
    orderDetails = orderRow;
    db.all("SELECT * FROM order_items WHERE order_id = ?", [req.params.id], (itemErr, itemRows) => {
      if (itemErr) return res.status(500).json({ message: "Error.", errorDetail: itemErr.message });
      orderDetails.items = itemRows || [];
      res.json(orderDetails);
    });
  });
});
app.put("/api/orders/:id/status", (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ message: "El estado es requerido." });
  db.run("UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [status, req.params.id], function (err) {
    if (err) return res.status(500).json({ message: "Error.", errorDetail: err.message });
    if (this.changes === 0) return res.status(404).json({ message: "Pedido no encontrado." });
    res.json({ message: "Estado del pedido actualizado." });
  });
});
app.post("/api/salespeople", (req, res) => {
  const { name } = req.body;
  if (!name || name.trim() === "") return res.status(400).json({ message: "Nombre del vendedor es requerido." });
  db.run("INSERT INTO salespeople (name) VALUES (?)", [name.trim()], function(err) {
    if (err) { if (err.message.includes("UNIQUE constraint failed")) return res.status(400).json({ message: "Ya existe un vendedor con ese nombre." }); return res.status(500).json({ message: "Error DB.", errorDetail: err.message }); }
    res.status(201).json({ id: this.lastID, name: name.trim() });
  });
});
app.get("/api/salespeople", (req, res) => {
  db.all("SELECT * FROM salespeople ORDER BY name ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ message: "Error.", errorDetail: err.message });
    res.json(rows);
  });
});
app.post("/api/salesrecords", async (req, res) => {
  const { salesperson_id, customer_id, customer_name_manual, notes, items } = req.body;
  if (!salesperson_id || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "ID de vendedor y una lista de ítems son requeridos." });
  }
  let totalAmount = 0;
  let validatedItems;
  try {
    const productDataPromises = items.map(item => {
      if (!item.productId || !item.quantity || item.quantity <= 0) throw new Error("Cada ítem debe tener productId y una cantidad válida.");
      return new Promise((resolve, reject) => {
        const sql = "SELECT p.name, p.price, s.quantity as stock FROM products p JOIN stock s ON p.id = s.product_id WHERE p.id = ?";
        db.get(sql, [item.productId], (err, row) => {
          if (err) return reject(new Error("Error de base de datos al validar producto."));
          if (!row) return reject(new Error(`Producto con ID ${item.productId} no encontrado.`));
          if (row.stock < item.quantity) return reject(new Error(`Stock insuficiente para ${row.name}. Disponible: ${row.stock}, Pedido: ${item.quantity}`));
          resolve({ productId: item.productId, quantity: item.quantity, price: row.price, name: row.name });
        });
      });
    });
    validatedItems = await Promise.all(productDataPromises);
    validatedItems.forEach(item => { totalAmount += item.price * item.quantity; });
  } catch (error) {
    return res.status(400).json({ message: "Error de validación de ítems", errorDetail: error.message });
  }
  const commission_rate = 0.05;
  const commission_amount = totalAmount * commission_rate;
  db.serialize(() => {
    db.run("BEGIN TRANSACTION;");
    const sqlSale = `INSERT INTO sales_records (salesperson_id, customer_id, customer_name_manual, sale_amount, commission_rate, commission_amount, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(sqlSale, [salesperson_id, customer_id || null, customer_name_manual || null, totalAmount, commission_rate, commission_amount, notes || null], function (err) {
      if (err) { db.run("ROLLBACK"); return res.status(500).json({ message: "Error DB creando registro de venta.", errorDetail: err.message }); }
      const salesRecordId = this.lastID;
      const sqlItem = `INSERT INTO sales_record_items (sales_record_id, product_id, product_name, quantity, price_per_unit) VALUES (?, ?, ?, ?, ?)`;
      const stockPromises = validatedItems.map(item => new Promise((resolve, reject) => {
          db.run(sqlItem, [salesRecordId, item.productId, item.name, item.quantity, item.price], (itemErr) => {
            if (itemErr) return reject(itemErr);
            db.run("UPDATE stock SET quantity = quantity - ? WHERE product_id = ?", [item.quantity, item.productId], (stockErr) => {
              if (stockErr) return reject(stockErr);
              resolve();
            });
          });
      }));
      Promise.all(stockPromises)
        .then(() => { db.run("COMMIT;"); res.status(201).json({ sales_record_id: salesRecordId, message: "Venta registrada y stock actualizado." }); })
        .catch(error => { db.run("ROLLBACK;"); res.status(500).json({ message: "Error procesando ítems de venta o stock.", errorDetail: error.message }); });
    });
  });
});
app.get("/api/salesrecords", (req, res) => {
  const { salespersonId } = req.query;
  let sql = `SELECT sr.*, s.name as salesperson_name, c.name as customer_name FROM sales_records sr JOIN salespeople s ON sr.salesperson_id = s.id LEFT JOIN customers c ON sr.customer_id = c.id`;
  const queryParams = [];
  if (salespersonId) { sql += " WHERE sr.salesperson_id = ?"; queryParams.push(salespersonId); }
  sql += " ORDER BY sr.sale_date DESC";
  db.all(sql, queryParams, (err, rows) => {
    if (err) return res.status(500).json({ message: "Error DB al obtener registros de ventas.", errorDetail: err.message });
    const records = rows.map(r => ({ ...r, customer_display_name: r.customer_id ? r.customer_name : (r.customer_name_manual || 'N/A') }));
    res.json(records);
  });
});

app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});