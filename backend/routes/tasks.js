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

    // Существует ли проект?
    const db = getDb();
    const [proj] = await db.query('SELECT * FROM projects WHERE id = ?', [project_id]);
    if (proj.length === 0) {
        return res.status(404).json({ error: "Проект не найден" });
    }

    // Есть ли текущий пользователь в участниках проекта?
    const [member] = await db.query(
        'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?',
        [project_id, req.user.id]
    );
    
    // Проверка доступа для создания задачи
    if (req.user.role !== 'admin' && proj[0].owner_id !== req.user.id && member.length === 0) {
        return res.status(403).json({ error: "Доступ запрещен" });
    }

    // Добавляем задачу в БД
    const [result] = await db.query(
        `INSERT INTO tasks (title, description, status, project_id, assigned_to, created_by, due_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [title, description || '', status || 'todo', project_id, assigned_to || null, req.user.id, due_date || null]
    );

    // Запись в ленту активности
    const dbForLog = getDb();
    await dbForLog.query(
        'INSERT INTO activity_log (user_id, action_type, target_id, description) VALUES (?, ?, ?, ?)',
        [req.user.id, 'create_task', result.insertId, `Пользователь ${req.user.username} cоздал задачу: "${title.trim()}"`]
    );

    // Уведомление для участника о создании задачи
    const io = req.app.get('io'); // Достает io из server.js - из app
    if (io) {
        io.to(project_id.toString()).emit('new_task', {
            id: result.insertId,
            title: title,
            message: `Пользователь ${req.user.username} создал новую задачу!`
        });
        console.log(`Создание задачи ${project_id}`);
    }

    // Отправляем ответ на клиент
    res.status(201).json({ id: result.insertId, title, description, status, project_id, assigned_to, due_date });
});

// API Эндпоинт PUT update task
router.put('/:id', authenticate, async (req, res) => {
    const taskId = req.params.id;
    const { title, description, status, assigned_to, due_date } = req.body;
    const db = getDb();

    // Существует ли задача?
    const [taskRows] = await db.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (taskRows.length === 0) {
        return res.status(404).json({ error: "Задача не найдена" });
    }
    const task = taskRows[0];

    // Существует ли проект?
    const [proj] = await db.query('SELECT * FROM projects WHERE id = ?', [task.project_id]);
    if (proj.length === 0) {
        return res.status(404).json({ error: "Проект не найден" });
    }
    const projectId = proj[0].id;

    // Проверка доступа для обновления задачи
    if (req.user.role !== 'admin' && proj[0].owner_id !== req.user.id && task.created_by !== req.user.id) {
        return res.status(403).json({ error: "В разрешении отказано" });
    }

    // Обновляем задачу в БД
    await db.query(
        `UPDATE tasks t SET title = COALESCE(?, title), description = COALESCE(?, description),
        status = COALESCE(?, status), assigned_to = ?, due_date = ? WHERE id = ?`,
        [title || task.title, description || '', status || 'todo', assigned_to || null, due_date || null, taskId]
    );

    // Запись в ленту активности
    const dbForLog = getDb();
    await dbForLog.query(
        'INSERT INTO activity_log (user_id, action_type, target_id, description) VALUES (?, ?, ?, ?)',
        [req.user.id, 'update_task', taskId, `Пользователь ${req.user.username} обновил задачу "${title.trim()}. Статус: ${status}"`]
    );

    // Уведомление для участника о обновлении задачи
    const io = req.app.get('io'); // Достает io из server.js - из app
    if (io) {
        io.to(projectId.toString()).emit('task_updated', {
            id: parseInt(taskId),
            title, description, status, assigned_to, due_date
        });
        console.log(`Обновление задачи ${projectId}`);
    }

    // Отправляем ответ на клиент
    res.json({ message: 'Задача обновлена' });
});

// API Эндпоинт DELETE remove task
router.delete('/:id', authenticate, async (req, res) => {
    const db = getDb();
    const taskId = req.params.id;
    const pathModule = require('path');
    const fs = require('fs');

    try {
        // Существует ли задача?
        const [taskRows] = await db.query('SELECT project_id, title, status FROM tasks WHERE id = ?', [taskId]);
        if (taskRows.length === 0) return res.status(404).json({ error: "Задача не найдена" });

        const projectId = taskRows[0].project_id;
        const taskTitle = taskRows[0].title;
        const taskStatus = taskRows[0].status;

        // Берем все файлы задачи
        const [files] = await db.query('SELECT filename FROM task_files WHERE task_id = ?', [taskId]);
        const rootDir = process.cwd();

        // Удаляем каждый файл задачи из диска
        files.forEach(file => {
            const filePath = pathModule.join(rootDir, '..', 'uploads', file.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            } else {
                console.warn("Файл не найден");
            }
        });

        // Удаляем файлы задачи из БД
        await db.query('DELETE FROM task_files WHERE task_id = ?', [taskId]);
        // Удаляем задачу из БД
        await db.query('DELETE FROM tasks WHERE id = ?', [taskId]);

        // Запись в ленту активности
        const dbForLog = getDb();
        await dbForLog.query(
            'INSERT INTO activity_log (user_id, action_type, target_id, description) VALUES (?, ?, ?, ?)',
            [req.user.id, 'delete_task', taskId, `Пользователь ${req.user.username} удалил задачу "${taskTitle.trim()}. Статус: ${taskStatus}"`]
        );

        // Уведомление для пользователя о удалении задачи
        const io = req.app.get('io');  // Достает io из server.js - из app
        if (io) {
            io.to(projectId.toString()).emit('task_deleted', { id: parseInt(taskId) });
            console.log(`Удаление задачи ${projectId}`);
        }
        
        // Отправляем ответ на клиент
        res.json({ message: 'Задача и файлы удалены' });
    } catch (err) {
        console.error("Ошибка при удалении:", err);
        res.status(500).json({ error: "Ошибка сервера при удалении" });
    }
});

// API Эндпоинт POST загрузка файла
router.post('/:taskId/files', authenticate, upload.single('file'), async (req, res) => {
    try {
        // Выбран ли файл?
        if (!req.file) {
            return res.status(400).json({ error: "Файл не выбран" });
        }

        const taskId = req.params.taskId;
        const db = getDb();

        // Существует ли задача?
        const [taskRows] = await db.query('SELECT title, status FROM tasks WHERE id = ?', [taskId]);
        if (taskRows.length === 0) {
            const fs = require('fs');
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ error: "Задача не найдена" });
        }
        
        const taskTitle = taskRows[0].title;
        const taskStatus = taskRows[0].status;

        // Добавляем файл в БД
        await db.query(
            'INSERT INTO task_files (task_id, filename) VALUES (?, ?)',
            [taskId, req.file.filename]
        );

        // Запись в ленту активности
        const dbForLog = getDb();
        await dbForLog.query(
            'INSERT INTO activity_log (user_id, action_type, target_id, description) VALUES (?, ?, ?, ?)',
            [req.user.id, 'new_task_file', taskId, `Пользователь ${req.user.username} добавил файл к задаче "${taskTitle.trim()}. Статус: ${taskStatus}"`]
        );

        // Отправляем ответ на клиент
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

        // Отправляем ответ на клиент
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

        // Ищем имя файла, id задачи, title и status в БД
        const [taskRows] = await db.query(
            `SELECT tf.filename, tf.task_id, t.title as task_title, t.status as task_status
            FROM task_files tf
            JOIN tasks t ON tf.task_id = t.id
            WHERE tf.id = ?`, [fileId]
        );
        if (taskRows.length === 0) {
            return res.status(404).json({ error: "Файл не найден" });
        }

        const filename = taskRows[0].filename;
        const taskId = taskRows[0].task_id;
        const taskTitle = taskRows[0].task_title;
        const taskStatus = taskRows[0].task_status;

        const rootDir = process.cwd();
        let filePath = rootDir.endsWith('backend')
            ? pathModule.join(rootDir, '..', 'uploads', filename)
            : pathModule.join(rootDir, 'uploads', filename);
        
        // Удаляем файл задачи из диска
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        } else {
            console.warn("Файл не найден на диске, удаляем только запись файла из БД");
        }

        // Удаляем файл из БД
        await db.query('DELETE FROM task_files WHERE id = ?', [fileId]);

        // Запись в ленту активности
        const dbForLog = getDb();
        await dbForLog.query(
            'INSERT INTO activity_log (user_id, action_type, target_id, description) VALUES (?, ?, ?, ?)',
            [req.user.id, 'delete_task_file', taskId, `Пользователь ${req.user.username} удалил файл ${fileId} - "${taskTitle.trim()}. Статус: ${taskStatus}"`]
        );

        // Отправляем ответ на клиент
        res.json({ message: "Файл удален" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Ошибка удаления файла" });
    }
});

module.exports = router;