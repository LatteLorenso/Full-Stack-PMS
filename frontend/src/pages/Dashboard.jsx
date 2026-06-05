import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import '../Dashboard.css';

// Регистрируем компоненты Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/dashboard/stats'); // Убедись, что роут подключен в server.js как /api/dashboard/stats
            setStats(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Загрузка статистики...</div>;
    if (!stats) return <div className="error">Не удалось загрузить данные</div>;

    // Подготовка данных для Pie Chart (Статусы задач)
    const pieData = {
        labels: stats.tasksByStatus.map(t => t.status === 'todo' ? 'К выполнению' : t.status === 'in_progress' ? 'В работе' : 'Готово'),
        datasets: [{
            data: stats.tasksByStatus.map(t => t.count),
            backgroundColor: ['#f39c12', '#3498db', '#2ecc71'],
            borderWidth: 0,
        }],
    };

    // Подготовка данных для Bar Chart (Проекты по месяцам)
    const barData = {
        labels: stats.monthlyProjects.map(m => m.month),
        datasets: [{
            label: 'Новых проектов',
            data: stats.monthlyProjects.map(m => m.count),
            backgroundColor: '#4a90e2',
            borderRadius: 5,
        }],
    };

    return (
        <div className="dashboard-container">
            <h1>Панель управления</h1>
            
            {/* Карточка с общим числом */}
            <div className="stat-card main-stat">
                <h2>{stats.totalProjects}</h2>
                <p>Всего проектов</p>
            </div>

            <div className="charts-grid">
                {/* Диаграмма задач */}
                <div className="chart-box">
                    <h3>Распределение задач</h3>
                    <div className="chart-wrapper">
                        <Pie data={pieData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>

                {/* График активности */}
                <div className="chart-box">
                    <h3>Активность (последние 6 мес.)</h3>
                    <div className="chart-wrapper">
                        <Bar data={barData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;