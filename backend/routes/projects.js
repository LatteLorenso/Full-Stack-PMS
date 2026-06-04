const express = require('express');
const { getDb } = require('../db/db');

const { authenticate, isAdmin } = require('../middleware/auth');

const router = express.Router();

// API Эндпоинт GET all users FROM users
router.get('/users/all', authenticate, async (req, res) => {
    const db = getDb();
    const [rows] = await db.query('SELECT id, username, role FROM users');
    res.json(rows);
});

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

    const query =
        `SELECT p.*, u.username as owner_name,
        GROUP_CONCAT(DISTINCT u_mem.username SEPARATOR ', ') as member_names 
        FROM projects p
        JOIN users u ON p.owner_id = u.id
        LEFT JOIN project_members pm_members ON p.id = pm_members.project_id
        LEFT JOIN users u_mem ON pm_members.user_id = u_mem.id
        ${join}
        ${where}
        GROUP BY p.id
        ORDER BY p.created_at DESC, p.id DESC LIMIT ?`;

    const [rows] = await db.query(query, [...params, limit + 1]);

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
                        'INSERT IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)',
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

// API Эндпоинт GET project by id with tasks AND members
router.get('/:id', authenticate, async (req, res) => {
    const projectId = req.params.id;
    const db = getDb();

    const [projectRows] = await db.query('SELECT * FROM projects WHERE id = ?', [projectId]);
    if (projectRows.length === 0) {
        return res.status(404).json({ error: "Проект не найден" });
    }
    const project = projectRows[0];

    const [membersRows] = await db.query(
        'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, req.user.id]
    );
    if (req.user.role !== 'admin' && project.owner_id !== req.user.id && membersRows.length === 0) {
        return res.status(403).json({ error: "Доступ запрещен" });
    }

    const [members] = await db.query(
        `SELECT u.id, u.username, u.role
        FROM project_members pm
        JOIN users u ON pm.user_id = u.id
        WHERE pm.project_id = ?`, [projectId]
    );

    const [ownerData] = await db.query('SELECT id, username, role FROM users WHERE id = ?', [project.owner_id]);

    const teamMap = new Map();

    members.forEach(m => {
        teamMap.set(m.id, { ...m, isOwner: false });
    });

    if (ownerData.length > 0) {
        teamMap.set(ownerData[0].id, { ...ownerData[0], isOwner: true });
    }

    const fullTeam = Array.from(teamMap.values());

    const [tasks] = await db.query(
        `SELECT t.*, u.username as assigned_name
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.project_id = ?`, [projectId]
    );

    res.json({ ...project, tasks, members: fullTeam });
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
        [name || project.name, description || project.description, projectId]
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

router.post('/:id/members', authenticate, async (req, res) => {
    const db = getDb();
    const { id: projectId } = req.params;
    const { user_id } = req.body;

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

    await db.query('INSERT IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)', [projectId, user_id]);
    res.json({ message: "Участник добавлен" });
});

router.delete('/:id/members/:userId', authenticate, async (req, res) => {
    const db = getDb();
    const { id: projectId, userId } = req.params;

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

    await db.query('DELETE FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, userId]);
    res.json({ message: "Участник удален" });
});

module.exports = router;