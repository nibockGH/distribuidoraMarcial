const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// Conexión a la base de datos
const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error("Error al conectar con la base de datos:", err.message);
  } else {
    console.log("Conectado a la base de datos SQLite.");
  }
});

// Función para cargar productos desde productsData.json si la tabla está vacía
function cargarProductosIniciales() {
  db.all("SELECT COUNT(*) as total FROM products", [], (err, rows) => {
    if (err) {
      console.error("Error al contar productos:", err.message);
      return;
    }
    const total = rows[0].total;
    if (total === 0) {
      try {
        const data = fs.readFileSync("./productsData.json", "utf8");
        const products = JSON.parse(data);

        const insert = db.prepare("INSERT INTO products (name, price) VALUES (?, ?)");
        products.forEach((p) => {
          insert.run(p.name, p.price);
        });
        insert.finalize();

        console.log("Productos iniciales cargados en la base de datos.");
      } catch (err) {
        console.error("Error al leer productsData.json:", err.message);
      }
    }
  });
}

// Crear tabla si no existe y luego cargar productos iniciales
db.run(
  `CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL
  )`,
  (err) => {
    if (err) {
      console.error("Error al crear la tabla:", err.message);
    } else {
      cargarProductosIniciales();
    }
  }
);

// Obtener productos
app.get("/api/products", (req, res) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Agregar producto
app.post("/api/products", (req, res) => {
  const { name, price } = req.body;
  if (!name || !price) {
    res.status(400).json({ error: "Nombre y precio requeridos" });
    return;
  }
  db.run(
    "INSERT INTO products (name, price) VALUES (?, ?)",
    [name, price],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({ id: this.lastID, name, price });
    }
  );
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
