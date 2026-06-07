const express = require('express');
const { getDb } = require('../db/db');
const { authenticate, isAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const pathModule = require('path');
const fs = require('fs');

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

    const activityDescription = `Пользователь ${req.user.username} создал задачу: "${title.trim()}"`;

    // Запись в ленту активности
    const dbForLog = getDb();
    await dbForLog.query(
        'INSERT INTO activity_log (user_id, action_type, target_id, description) VALUES (?, ?, ?, ?)',
        [req.user.id, 'create_task', result.insertId, activityDescription]
    );

    // Уведомление через сокет
    const io = req.app.get('io');
    if (io) {
        io.to(project_id.toString()).emit('new_task', {
            id: result.insertId,
            logDescription: activityDescription, // Для ленты
            title: title,                        // Для списка задач
            status: status || 'todo',
            description: description || '',
            assigned_to: assigned_to || null,
            due_date: due_date || null,
            user_id: req.user.id,
            username: req.user.username
        });
    }

    res.status(201).json({ id: result.insertId, title, description, status, project_id, assigned_to, created_by_name: req.user.username, due_date });
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
    const projectId = proj[0].id;

    if (req.user.role !== 'admin' && proj[0].owner_id !== req.user.id && task.created_by !== req.user.id) {
        return res.status(403).json({ error: "В разрешении отказано" });
    }

    await db.query(
        `UPDATE tasks t SET title = COALESCE(?, title), description = COALESCE(?, description),
        status = COALESCE(?, status), assigned_to = ?, due_date = ? WHERE id = ?`,
        [title || task.title, description || '', status || 'todo', assigned_to || null, due_date || null, taskId]
    );

    // Логика формирования описания изменений
    const changes = [];
    if (title && title !== task.title) changes.push(`название на "${title.trim()}"`);
    
    if (status && status !== task.status) {
        const statusName = { 'todo': 'К выполнению', 'in_progress': 'В работе', 'done': 'Готово' };
        const oldS = statusName[task.status] || task.status;
        const newS = statusName[status] || status;
        changes.push(`статус с "${oldS}" на "${newS}"`);
    }

    const newAssigned = assigned_to === "" ? null : assigned_to;
    if (assigned_to !== undefined && newAssigned !== task.assigned_to) {
        changes.push(`назначен за (ID: "${newAssigned || 'не назначен'}")`);
    }

    if (due_date !== undefined && due_date !== task.due_date) {
        const oldDate = task.due_date ? new Date(task.due_date).toLocaleDateString('ru-RU') : 'не был указан';
        const newDate = due_date ? new Date(due_date).toLocaleDateString('ru-RU') : 'убран';
        changes.push(`срок сдачи (было: ${oldDate}, стало: ${newDate})`);
    }

    let activityDescription = "";
    if (changes.length > 0) {
        activityDescription = `Задача "${task.title.trim()}": обновлено ${changes.join(', ')}`;
    } else {
        activityDescription = `Задача "${task.title.trim()}" была обновлена`;
    }

    // Запись в ленту активности
    const dbForLog = getDb();
    await dbForLog.query(
        'INSERT INTO activity_log (user_id, action_type, target_id, description) VALUES (?, ?, ?, ?)',
        [req.user.id, 'update_task', taskId, activityDescription]
    );

    // Уведомление через сокет
    const io = req.app.get('io');
    if (io) {
        io.to(projectId.toString()).emit('task_updated', {
            id: parseInt(taskId),
            logDescription: activityDescription, // Для ленты
            title: title || task.title,          // Для карточки
            status: status || task.status,
            assigned_to: assigned_to !== undefined ? assigned_to : task.assigned_to,
            due_date: due_date !== undefined ? due_date : task.due_date,
            description: description !== undefined ? description : task.description,
            user_id: req.user.id,
            username: req.user.username
        });
    }

    res.json({ message: 'Задача обновлена' });
});

// API Эндпоинт DELETE remove task
router.delete('/:id', authenticate, async (req, res) => {
    const db = getDb();
    const taskId = req.params.id;

    try {
        const [taskRows] = await db.query('SELECT project_id, title, status FROM tasks WHERE id = ?', [taskId]);
        if (taskRows.length === 0) return res.status(404).json({ error: "Задача не найдена" });

        const projectId = taskRows[0].project_id;
        const taskTitle = taskRows[0].title;
        
        // Удаляем файлы с диска и из БД
        const [files] = await db.query('SELECT filename FROM task_files WHERE task_id = ?', [taskId]);
        const rootDir = process.cwd();

        files.forEach(file => {
            const filePath = pathModule.join(rootDir, '..', 'uploads', file.filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });

        await db.query('DELETE FROM task_files WHERE task_id = ?', [taskId]);
        await db.query('DELETE FROM tasks WHERE id = ?', [taskId]);

        const activityDescription = `Пользователь ${req.user.username} удалил задачу "${taskTitle}"`;

        // Запись в ленту активности
        const dbForLog = getDb();
        await dbForLog.query(
            'INSERT INTO activity_log (user_id, action_type, target_id, description) VALUES (?, ?, ?, ?)',
            [req.user.id, 'delete_task', taskId, activityDescription]
        );

        // Уведомление через сокет
        const io = req.app.get('io');
        if (io) {
            io.to(projectId.toString()).emit('task_deleted', {
                id: parseInt(taskId),
                logDescription: activityDescription, // Для ленты
                title: taskTitle                     // Для информации
            });
        }
        
        res.json({ message: 'Задача и файлы удалены' });
    } catch (err) {
        console.error("Ошибка при удалении:", err);
        res.status(500).json({ error: "Ошибка сервера при удалении" });
    }
});

// API Эндпоинт POST загрузка файла
router.post('/:taskId/files', authenticate, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Файл не выбран" });
        }

        const taskId = req.params.taskId;
        const db = getDb();

        const [taskRows] = await db.query('SELECT project_id, title FROM tasks WHERE id = ?', [taskId]);
        if (taskRows.length === 0) {
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ error: "Задача не найдена" });
        }
        
        const projectId = taskRows[0].project_id;
        const taskTitle = taskRows[0].title;

        await db.query(
            'INSERT INTO task_files (task_id, filename) VALUES (?, ?)',
            [taskId, req.file.filename]
        );

        const activityDescription = `Пользователь ${req.user.username} добавил файл к задаче "${taskTitle.trim()}"`;

        // Запись в ленту активности
        const dbForLog = getDb();
        await dbForLog.query(
            'INSERT INTO activity_log (user_id, action_type, target_id, description) VALUES (?, ?, ?, ?)',
            [req.user.id, 'new_task_file', taskId, activityDescription]
        );

        // Уведомление через сокет
        const io = req.app.get('io');
        if (io) {
            io.to(projectId.toString()).emit('task_file_added', {
                taskId: parseInt(taskId),
                logDescription: activityDescription,
                filename: req.file.filename,
                user_id: req.user.id,
                username: req.user.username
            });
        }

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
        const [files] = await db.query('SELECT * FROM task_files WHERE task_id = ?', [taskId]);
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

        const [taskRows] = await db.query(
            `SELECT tf.filename, tf.task_id, t.project_id, t.title as task_title
            FROM task_files tf
            JOIN tasks t ON tf.task_id = t.id
            WHERE tf.id = ?`, [fileId]
        );
        if (taskRows.length === 0) {
            return res.status(404).json({ error: "Файл не найден" });
        }

        const filename = taskRows[0].filename;
        const taskId = taskRows[0].task_id;
        const projectId = taskRows[0].project_id;
        const taskTitle = taskRows[0].task_title;

        const rootDir = process.cwd();
        let filePath = rootDir.endsWith('backend')
            ? pathModule.join(rootDir, '..', 'uploads', filename)
            : pathModule.join(rootDir, 'uploads', filename);
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await db.query('DELETE FROM task_files WHERE id = ?', [fileId]);

        const activityDescription = `Пользователь ${req.user.username} удалил файл из задачи "${taskTitle.trim()}"`;

        // Запись в ленту активности
        const dbForLog = getDb();
        await dbForLog.query(
            'INSERT INTO activity_log (user_id, action_type, target_id, description) VALUES (?, ?, ?, ?)',
            [req.user.id, 'delete_task_file', taskId, activityDescription]
        );

        // Уведомление через сокет
        const io = req.app.get('io');
        if (io) {
            io.to(projectId.toString()).emit('task_file_deleted', {
                taskId: parseInt(taskId),
                logDescription: activityDescription,
                user_id: req.user.id,
                username: req.user.username
            });
        }

        res.json({ message: "Файл удален" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Ошибка удаления файла" });
    }
});

module.exports = router;