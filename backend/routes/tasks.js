const express = require('express');
const { getDb } = require('../db/db');

const { authenticate, isAdmin } = require('../middleware/auth');

const router = express.Router();

// API Эндпоинт GET tasks with filters
router.get('/', authenticate, async (req, res) => {
    const { project_id, status, assigned_to } = req.query;
    const db = getDb();

    let query = 
    `SELECT t.*, p.name as project_name, u.username as assigned_name 
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    LEFT JOIN users u ON t.assigned_to = u.id
    WHERE 1=1`;
    const params = [];

    if (project_id) {
        query += ' AND t.project_id = ?';
        params.push(project_id);
    }
    if (status) {
        query += ' AND t.status = ?';
        params.push(status);
    }
    if (assigned_to) {
        query += ' AND t.assigned_to = ?';
        params.push(assigned_to);
    }
    query += ' ORDER BY t.created_at DESC';
    const [rows] = await db.query(query, params);
    res.json(rows);
});

// API Эндпоинт POST create task
router.post('/', authenticate, async (req, res) => {
    const { title, description, status, project_id, assigned_to, due_date } = req.body;
    if (!title || !project_id) {
        return res.status(400).json({ error: "Название и индекс проекта обязательны" });
    }

    const db = getDb();
    const [proj] = await db.query('SELECT * FROM projects WHERE id = ?', [project_id]);
    if (proj.length === 0) {
        return res.status(404).json({ error: "Проект не найден" });
    }

    const [member] = await db.query(
        'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?',
        [project_id, req.user.id]
    );
    
    if (req.user.role !== 'admin' && proj[0].owner_id !== req.user.id && member.length === 0) {
        return res.status(403).json({ error: "Доступ запрещен" });
    }

    const [result] = await db.query(
        `INSERT INTO tasks (title, description, status, project_id, assigned_to, created_by, due_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [title, description || '', status || 'todo', project_id, assigned_to || null, req.user.id, due_date || null]
    );
    res.status(201).json({ id: result.insertId, title, description, status, project_id, assigned_to, due_date });
});

// API Эндпоинт PUT update task
router.put('/:id', authenticate, async (req, res) => {
    taskId = req.params.id;
    const { title, description, status, assigned_to, due_date } = req.body;
    const db = getDb();

    const [taskRows] = await db.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (taskRows.length === 0) {
        return res.status(404).json({ error: "Задача не найдена" });
    }
    const task = taskRows[0];

    const [proj] = await db.query('SELECT * FROM projects WHERE id = ?', [task.project_id]);
    if (proj.length === 0) {
        return res.status(404).json({ error: "Проект не найден" });
    }

    if (req.user.role !== 'admin' && proj[0].owner_id !== req.user.id && task.created_by !== req.user.id) {
        return res.status(403).json({ error: "В разрешении отказано" });
    }

    await db.query(
        `UPDATE tasks t SET title = COALESCE(?, title), description = COALESCE(?, description),
        status = COALESCE(?, status), assigned_to = ?, due_date = ? WHERE id = ?`,
        [title || t.title, description || '', status || 'todo', assigned_to, due_date, taskId]
    );
    res.json({ message: 'Задача обновлена' });
});

// API Эндпоинт DELETE task
router.delete('/:id', authenticate, async (req, res) => {
    const taskId = req.params.id;
    const db = getDb();

    const [taskRows] = await db.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (taskRows.length === 0) {
        return res.status(404).json({ error: "Задача не найдена" });
    }
    const task = taskRows[0];

    const [proj] = await db.query('SELECT * FROM projects WHERE id = ?', [task.project_id]);
    if (proj.length === 0) {
        return res.status(404).json({ error: "Проект не найден" });
    }

    if (req.user.role !== 'admin' && proj[0].owner_id !== req.user.id && task.created_by !== req.user.id) {
        return res.status(403).json({ error: "В разрешении отказано" });
    }

    await db.query('DELETE FROM tasks WHERE id = ?', [taskId]);
    res.json({ message: 'Задача удалена' });
});

module.exports = router;