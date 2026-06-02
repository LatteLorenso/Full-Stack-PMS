const express = require('express');
const { getDb } = require('../db/db');

const { authenticate, isAdmin } = require('../middleware/auth');

const router = express.Router();

// API Эндпоинт GET api/projects?page=1&limit=10
router.get('/', authenticate, async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const cursor = req.query.cursor ? parseInt(req.query.cursor) : null;
    const db = getDb();
    const { id: userId, role } = req.user;

    const conditions = role !== 'admin' ? ['(pm.user_Id = ? OR p.owner_id = ?)'] : [];
    const params = role !== 'admin' ? [userId, userId] : [];
    if (cursor) { conditions.push('p.id < ?'); params.push(cursor) }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const join = role !== 'admin' ? 'JOIN project_members pm ON p.id = pm.project_id' : '';

    const [rows] = await db.query(
        `SELECT p.*, u.username as owner_name FROM projects p
        JOIN users u ON p.owner_id = u.id ${join} ${where}
        ORDER BY p.created_at DESC, p.id DESC LIMIT ?`,
        [...params, limit + 1]
    );

    const hasMore = rows.length > limit;
    if (hasMore) rows.pop();
    res.json({ projects: rows, nextCursor: hasMore ? rows[rows.length - 1]?.id : null, hasMore });
});

// API Эндпоинт POST create project
router.post('/', authenticate, async (req, res) => {
    const { name, description, membersIds } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).json({ error: "Имя проекта обязательно" });
    }

    const db = getDb();
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Создание нового проекта
        const [result] = await connection.query(
            'INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)',
            [name.trim(), description || '', req.user.id]
        );

        // Берем идентификатор созданного проекта в переменную
        const projectId = result.insertId;

        // Автоматическое добавление владельца проекта в список участников
        await connection.query(
            'INSERT INTO project_members (project_id, user_id) VALUES (?, ?)',
            [projectId, req.user.id]
        );

        // Добавление новых лиц в список участников
        if (membersIds && Array.isArray(membersIds)) {
            for (const uid of membersIds) {
                if (uid !== req.user.id) {
                    await connection.query(
                        'INSERT INTO project_members (project_id, user_id) VALUES (?, ?)',
                        [projectId, uid]
                    )
                }
            }
        }

        // Сохраняем внесенные изменения
        await connection.commit();
        res.status(201).json({ id: projectId, name, description, owner_id: req.user.id });

    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ error: "Ошибка сервера" });
    } finally {
        connection.release();
    }
});

// API Эндпоинт GET project by id with tasks
router.get('/:id', authenticate, async (req, res) => {
    const projectId = req.params.id;
    const db = getDb();
    const [projectRows] = await db.query(
        'SELECT * FROM projects WHERE id = ?', [projectId]
    );

    if (projectRows.length === 0) {
        return res.status(404).json({ error: "Проект не найден" });
    }

    const project = projectRows[0];

    const [membersRows] = await db.query(
        'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?',
        [projectId, req.user.id]
    );

    if (req.user.role !== 'admin' && project.owner_id !== req.user.id && membersRows.length === 0) {
        return res.status(403).json({ error: "Доступ запрещен" });
    }

    const [tasks] = await db.query(
        `SELECT t.*, u.username as assigned_name
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.project_id = ?`,
        [projectId]
    );
    res.json({ ...project, tasks });
});

// API Эндпоинт PUT update project
router.put('/:id', authenticate, async (req, res) => {
    const projectId = req.params.id;
    const { name, description } = req.body;
    const db = getDb();
    const [projectRows] = await db.query(
        'SELECT * FROM projects WHERE id = ?', [projectId]
    );

    if (projectRows.length === 0) {
        return res.status(404).json({ error: "Проект не найден" });
    }

    const project = projectRows[0];

    if (req.user.role !== 'admin' && project.owner_id !== req.user.id) {
        return res.status(403).json({ error: "Редактировать может только админ или владелец" });
    }

    await db.query(
        'UPDATE projects p SET name = ?, description = ? WHERE id = ?',
        [name || p.name, description || p.description, projectId]
    );
    res.json({ message: 'Проект обновлен' });
});

// API Эндпоинт DELETE project
router.delete('/:id', authenticate, async (req, res) => {
    const projectId = req.params.id;
    const db = getDb();
    const [projectRows] = await db.query(
        'SELECT * FROM projects WHERE id = ?', [projectId]
    );

    if (projectRows.length === 0) {
        return res.status(404).json({ error: "Проект не найден" });
    }

    const project = projectRows[0];

    if (req.user.role !== 'admin' && project.owner_id !== req.user.id) {
        return res.status(403).json({ error: "В разрешении отказано" });
    }

    await db.query(
        'DELETE FROM projects WHERE id = ?', [projectId]
    );
    res.json({ message: 'Проект удален' });
});

module.exports = router;