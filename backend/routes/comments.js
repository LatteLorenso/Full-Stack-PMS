const express = require('express');
const { getDb } = require('../db/db');

const { authenticate, isAdmin } = require('../middleware/auth');

const router = express.Router();

// API Эндпоинт GET comments for a task
router.get('/task/:taskId', authenticate, async (req, res) => {
    const taskId = req.params.id;
    const db = getDb();
    const [rows] = await db.query(
            `SELECT c.*, u.username FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.task_id = ? ORDER BY c.created_at ASC`,
            [taskId]
    );
    res.json(rows);
});

// API Эндпоинт POST comment
router.post('/', authenticate, async (req, res) => {
    const { content, taskId } = req.body;

    if (!content || !task_id) {
        return res.status(400).json({ error: "Контент и идентификатор задачи обязательны" });
    }

    const db = getDb();

    // Проверить задачу на существование и доступ пользователя к задаче
    const [taskRows] = await db.query('SELECT project_id FROM tasks WHERE id = ?', [taskId]);
    if (taskRows.lenght === 0) {
        return res.status(404).json({ error: "Задача не найдена" });
    }

    const project_id = taskRows[0].project_id;

    const [member] = await db.query(
        'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?',
        [project_id, req.user.id]
    );

    const [proj] = await db.query('SELECT owner_id FROM projects WHERE id = ?', [project_id]);

    if (req.user.role !== 'admin' && proj[0].owner_id !== req.user.id && member.lenght === 0) {
        return res.status(403).json({ error: "Доступ запрещен" });
    }

    const [result] = await db.query(
        'INSERT INTO comments (content, task_id, user_id) VALUES (?, ?, ?)',
        [content, task_id, req.user.id]
    );
    res.status(201).json({ id: result.insertId, content, task_id, user_id: req.user.id });
});

module.exports = router;