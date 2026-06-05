require('dotenv').config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projects");
const taskRoutes = require("./routes/tasks");
const path = require("path");
const dashboardRoutes = require("./routes/dashboard");
const commentsRoutes = require("./routes/comments");
const { initDb, getDb } = require("./db/db");

const { createClient } = require("redis");
const redisClient = createClient({ url: 'redis://localhost:6379' });
redisClient.on("error", (err) => console.log('Redis Client Error', err));
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

(async () => {
    await redisClient.connect();
    console.log('Redis подключен, порт:', 6379);
})();

(async () => {
    try {
        await initDb();
        console.log('Сервер запустился на:', process.env.PORT);

        // API Эндпоинты
        app.use('/api/auth', authRoutes);
        app.use('/api/projects', projectRoutes(redisClient));
        app.use('/api/tasks', taskRoutes);
        app.use('/api/dashboard', dashboardRoutes);
        app.use('/api/comments', commentsRoutes);
        app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

        app.listen(process.env.PORT);
    } catch (err) {
        console.error('Ошибка подключения к БД:', err.message);
        process.exit(1);
    }
})();