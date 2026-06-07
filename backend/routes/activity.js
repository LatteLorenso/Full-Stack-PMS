const express = require('express');
const { getDb } = require('../db/db');
const { authenticate, isAdmin } = require('../middleware/auth');

const router = express.Router();

// API Эндпоинт GET последние действия
router.get('/', authenticate, async (req, res) => {
    const db = getDb();
    const limit = 10;

    try {
        const [rows] = await db.query(
            `SELECT a.*, u.username
            FROM activity_log a
            JOIN users u ON a.user_id = u.id
            ORDER BY a.created_at DESC
            LIMIT ?`, [limit]
        );

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка получения ленты активности' });
    }
});

// API Эндпоинт POST запись события (внутренняя или для админов)
router.post('/', authenticate, async (req, res) => {
    const { action_type, target_id, description } = req.body;
    const db = getDb();

    try {
        await db.query(
            'INSERT INTO activity_log (user_id, action_type, target_id, description) VALUES (?, ?, ?, ?)',
            [req.user.id, action_type, target_id || null, description]
        );

        res.status(201).json({ message: 'Событие записано' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка записи события' });
    }
});

module.exports = router;