// createAdmin.js (Versión 2 - A prueba de fallos)
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

// --- Configuración ---
const dbPath = path.resolve(__dirname, "database.db");
const adminUsername = 'admin';
const adminPassword = '123'; // ¡Recuerda cambiar esto por una contraseña segura!
const saltRounds = 10;
// --------------------


console.log("--- Iniciando script de creación de admin ---");

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        return console.error("Error FATAL al conectar con la base de datos:", err.message);
    }
    console.log("Conexión con la base de datos establecida.");
});

// Usamos db.serialize para asegurar que los comandos se ejecutan en orden
db.serialize(() => {
    // 1. Crear la tabla de usuarios si no existe
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        salesperson_id INTEGER UNIQUE,
        FOREIGN KEY (salesperson_id) REFERENCES salespeople(id) ON DELETE SET NULL
    )`, (err) => {
        if (err) {
            console.error("Error al intentar crear la tabla 'users':", err.message);
            db.close(); // Cerramos la conexión si hay un error
            return;
        }
        console.log("Tabla 'users' verificada/creada correctamente.");

        // 2. Intentar insertar el usuario administrador
        bcrypt.hash(adminPassword, saltRounds, (err, hashedPassword) => {
            if (err) {
                console.error("Error al encriptar la contraseña:", err);
                db.close();
                return;
            }

            const insertSql = `INSERT INTO users (username, password, role) VALUES (?, ?, 'admin')`;
            db.run(insertSql, [adminUsername, hashedPassword], function(err) {
                if (err) {
                    if (err.message.includes("UNIQUE constraint failed")) {
                        console.log(`✅ El usuario administrador '${adminUsername}' ya existe. No se necesita ninguna acción.`);
                    } else {
                        console.error("Error al insertar el usuario admin:", err.message);
                    }
                } else {
                    console.log(`✅ ¡Éxito! Usuario administrador '${adminUsername}' fue creado con ID: ${this.lastID}`);
                }

                // 3. Cerrar la conexión con la base de datos
                db.close((err) => {
                    if (err) {
                        return console.error("Error al cerrar la conexión con la DB:", err.message);
                    }
                    console.log("Conexión con la base de datos cerrada.");
                    console.log("--- Script finalizado ---");
                });
            });
        });
    });
});