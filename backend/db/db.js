const mysql = require('mysql2/promise');

let pool = null;

const initDb = async () => {
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
    dateStrings: true,
    supportBigNumbers: true,
    waitForConnections: true,
    connectionLimit: 10
  });
  // Test connection
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
  console.log('MySQL подключен, порт:', process.env.DB_PORT || 3306);
};

const getDb = () => {
  if (!pool) throw new Error('База данных не инициализирована');
  return pool;
};

module.exports = { initDb, getDb };