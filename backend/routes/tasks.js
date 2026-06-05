const express = require('express');
const { getDb } = require('../db/db');

const { authenticate, isAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

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
    const taskId = req.params.id;
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
        [title || task.title, description || '', status || 'todo', assigned_to, due_date, taskId]
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

// API Эндпоинт POST загрузка файлов
router.post('/:taskId/files', authenticate, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Файл не выбран" });
        }

        const taskId = req.params.taskId;
        const db = getDb();

        await db.query(
            'INSERT INTO task_files (task_id, filename) VALUES (?, ?)',
            [taskId, req.file.filename]
        );
        res.json({ message: "Файл загружен", file: req.file });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Ошибка загрузки файла" });
    }
});

// API Эндпоинт GET список файлов задачи
router.get('/:taskId/files', authenticate, async (req, res) => {
    try {
        const taskId = req.params.taskId;
        const db = getDb();
        
        const [files] = await db.query(
            'SELECT * FROM task_files WHERE task_id = ?', [taskId]
        );
        res.json(files);
    } catch (err) {
        res.status(500).json({ error: "Ошибка получения файлов" });
    }
});

// API Эндпоинт DELETE - Удалить файл
router.delete('/files/:fileId', authenticate, async (req, res) => {
    try {
        const fileId = req.params.fileId;
        const db = getDb();
        const pathModule = require('path');
        const fs = require('fs');

        const [rows] = await db.query(
            'SELECT filename FROM task_files WHERE id = ?', [fileId]
        );
        if (rows.length > 0) {
            const filename = rows[0].filename;
            const rootDir = process.cwd();
            let filePath;
            
            if (rootDir.endsWith('backend')) {
                filePath = pathModule.join(rootDir, '..', 'uploads', filename);
            } else {
                filePath = pathModule.join(rootDir, 'uploads', filename);
            }

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            } else {
                console.warn("Файл не найден");
            }
        }
        await db.query('DELETE FROM task_files WHERE id = ?', [fileId]);
        res.json({ message: "Файл удален" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Ошибка удаления файла" });
    }
}); 

module.exports = router;