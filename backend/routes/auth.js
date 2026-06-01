const express = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db/db');

// Импорт первичной валидации данных и логики токена
const { validate } = require('../middleware/validate');
const { authenticate, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Унификация валидации
const registerRules = [
    body('email').isEmail().withMessage('Некорректный email').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Длина пароля не менее 6 символов'),
    body('username').optional().isLength({ min: 3, max: 50 }).withMessage('Длина имени не менее 3 символов')
];

const loginRules = [
    body('username').notEmpty().withMessage('Некорректный логин: Проверьте правильность ввода имени'),
    body('password').notEmpty().withMessage('Пароль обязателен: Проверьте правильность ввода пароля')
];

// API Эндпоинт регистрации
router.post('/register', registerRules, validate, async (req, res) => {
    try {
        const { email, password, username } = req.body;
        const db = getDb();

        const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: "Пользователь уже существует" });
        }

        const hashedPassword = new bcrypt.hash(password, 10);

        const [result] = await db.query(
            "INSERT INTO users (email, password, username, role) VALUES (?, ?, ?, ?)",
            [email, hashedPassword, username || null, "user"]
        );

        const token = jwt.sign(
            { id: result.insertId, email, role: "user" },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(201).json({
            success: true,
            message: "Регистрация успешна",
            data: {
                token,
                user: { id: result.insertId, email, username: username || null, role: "user" }
            }
        });

    } catch (err) {
        console.error("Ошибка регистрации:", err);
        return res.status(500).json({ success: false, message: "Ошибка сервера" });
    }
});

// API Эндпоинт логина
router.post('/login', loginRules, validate, async (req, res) => {
    try {
        const { username, password } = req.body;
        const db = getDb();

        const [users] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: "Неверный логин" });
        }
        const user = users[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Неверный пароль" });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            success: true,
            message: "Вход выполнен",
            data: {
                token,
                user: { id: user.id, username: user.username, role: user.role }
            }
        });

    } catch (err) {
        console.error("Ошибка входа:", err);
        return res.status(500).json({ success: false, message: "Ошибка сервера" });
    }
});

module.exports = router;