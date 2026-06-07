require('dotenv').config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projects");
const taskRoutes = require("./routes/tasks");
const path = require("path");
const dashboardRoutes = require("./routes/dashboard");
const commentsRoutes = require("./routes/comments");
const activityRoutes = require("./routes/activity");
const { initDb, getDb } = require("./db/db");
const { createClient } = require("redis");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET, POST"]
    }
});

const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.set("io", io);

const redisClient = createClient({ url: 'redis://localhost:6379' });
redisClient.on("error", (err) => console.log('Redis Client Error', err));

(async () => {
    try {
        await initDb();
        await redisClient.connect();
        console.log('Сервер запустился на:', process.env.PORT);
        console.log('Redis подключен, порт:', 6379);

        // API Эндпоинты
        app.use('/api/auth', authRoutes);
        app.use('/api/projects', projectRoutes(redisClient));
        app.use('/api/tasks', taskRoutes);
        app.use('/api/dashboard', dashboardRoutes);
        app.use('/api/comments', commentsRoutes);
        app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
        app.use('/api/activity', activityRoutes);

        // Логика WebSocket: что делать, когда кто-то подключается
        io.on('connection', (socket) => {
            console.log('Пользователь подключился:', socket.id);
            
            // Когда пользователь заходит в проект, он подписывается на его комнату
            socket.on('join_project', (projectId) => {
                socket.join(projectId);
                console.log(`User ${socket.id} joined project ${projectId}`);
            });

            socket.on('disconnect', () => {
                console.log('Пользователь отключился:', socket.id);
            });
        });

        server.listen(process.env.PORT);
    } catch (err) {
        console.error('Ошибка подключения к БД:', err.message);
        process.exit(1);
    }
})();

module.exports = app;