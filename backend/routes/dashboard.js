const express = require('express');
const { getDb } = require('../db/db');

const { authenticate, isAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', authenticate, async (req, res) => {
    const db = getDb();
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    // Считаем количество всех проектов
    let projQuery;
    let projParams;

    if (isAdmin) {
        projQuery = 'SELECT COUNT(*) as count FROM projects';
        projParams = [];
    } else {
        projQuery = 
        `SELECT COUNT(DISTINCT p.id) as count
        FROM projects p
        LEFT JOIN project_members pm ON p.id = pm.project_id
        WHERE p.owner_id = ? OR pm.user_id = ?`;
        projParams = [userId, userId];
    }
    const [projCount] = await db.query(projQuery, projParams);

    // Считаем количество всех задач по статусу
    let taskQuery;
    let taskParams;

    if (isAdmin) {
        taskQuery = `SELECT status, COUNT(*) as count FROM tasks GROUP BY status`;
        taskParams = [];
    } else {
        taskQuery = 
        `SELECT t.status, COUNT(DISTINCT t.id) as count
        FROM tasks t
        JOIN projects p ON t.project_id = p.id
        LEFT JOIN project_members pm ON p.id = pm.project_id
        WHERE p.owner_id = ? OR pm.user_id = ?
        GROUP BY t.status`;
        taskParams = [userId, userId];
    }
    const [taskStatus] = await db.query(taskQuery, taskParams);

    // Проекты созданные в течение месяца (последние 6 месяцев)
    let monthQuery;
    
    if (isAdmin) {
        monthQuery = 
        `SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count
        FROM projects
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY month ORDER BY month`;
    } else {
        monthQuery = 
        `SELECT DATE_FORMAT(p.created_at, '%Y-%m') as month, COUNT(*) as count
        FROM projects p
        WHERE (p.created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY month ORDER BY month`;
    }
    const monthParams = isAdmin ? [] : [userId, userId];
    const [monthly] = await db.query(monthQuery, monthParams);

    res.json({
        totalProjects: projCount[0].count,
        tasksByStatus: taskStatus,
        monthlyProjects: monthly,
    });
});

module.exports = router;