const express = require('express');
const { getDb } = require('../db/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// API Эндпоинт GET comments for a task
router.get('/task/:taskId', authenticate, async (req, res) => {
    const { taskId } = req.params;
    const db = getDb();

    try {
        const [rows] = await db.query(
                `SELECT c.*, u.username FROM comments c
                JOIN users u ON c.user_id = u.id
                WHERE c.task_id = ? ORDER BY c.created_at ASC`,
                [taskId]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Ошибка получения комментариев" });
    }
});

// API Эндпоинт POST comment
router.post('/', authenticate, async (req, res) => {
    const { content, taskId } = req.body;

    if (!content || !taskId) {
        return res.status(400).json({ error: "Контент и идентификатор задачи обязательны" });
    }

    const db = getDb();

    try {
        // Проверить задачу на существование и доступ пользователя к задаче
        const [taskRows] = await db.query('SELECT project_id FROM tasks WHERE id = ?', [taskId]);
        if (taskRows.length === 0) {
            return res.status(404).json({ error: "Задача не найдена" });
        }
    
        const projectId = taskRows[0].project_id;
    
        const [member] = await db.query(
            'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?',
            [projectId, req.user.id]
        );
    
        const [proj] = await db.query('SELECT owner_id FROM projects WHERE id = ?', [projectId]);
    
        if (req.user.role !== 'admin' && proj[0].owner_id !== req.user.id && member.length === 0) {
            return res.status(403).json({ error: "Вы не можете создать комментарий если не связаны с проектом в качестве участника/владельца/админа" });
        }
    
        const [result] = await db.query(
            'INSERT INTO comments (content, task_id, user_id) VALUES (?, ?, ?)',
            [content, taskId, req.user.id]
        );
    
        // WebSocket уведомление о комментарии
        const io = req.app.get('io');
        if (io) {
            io.to(projectId.toString()).emit('new_comment', {
                taskId: parseInt(taskId),
                username: req.user.username,
                content: content,
                message: `${req.user.username} оставил комментарий к задаче`
            });
        }
    
        res.status(201).json({ id: result.insertId, content, task_id: taskId, user_id: req.user.id, username: req.user.username });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Ошибка создания комментария" });
    }
});

module.exports = router;