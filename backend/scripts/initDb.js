require('dotenv').config({ path: './.env' });
const mysql = require('mysql2/promise');
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

async function init() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        multipleStatements: true,
    });

    const sql = fs.readFileSync(path.join(__dirname, "../db/init.sql"), 'utf-8');
    await connection.query(sql);
    console.log("Таблица создана");

    // Создаем админа
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await connection.query(
        `INSERT INTO users (username, email, password, role)
        VALUES ('admin', 'admin@example.com', ?, 'admin')
        ON DUPLICATE KEY UPDATE id=id`,
        [hashedPassword]
    );

    console.log("Тестовый админ создан: admin / admin123");    
    await connection.end();
    console.log('Инициализация базы данных выполнена');
}

init().catch(console.error);

console.log('🔎 DB_USER:', process.env.DB_USER);
console.log('🔎 DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'UNDEFINED');
console.log('🔎 DB_HOST:', process.env.DB_HOST);