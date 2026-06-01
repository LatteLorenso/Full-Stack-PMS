import React, { useEffect, useState } from 'react';
import api from '../services/api';

function Dashboard() {
    const [stats, setStats] = useState({
        projects: 0,
        tasks: 0,
        todo: 0,
        in_progress: 0,
        done: 0
    });

    const [error, setError] = useState('');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
        const res = await api.get('/dashboard');
        setStats(res.data);
        } catch (err) {
            setError('Ошибка загрузки статистики');
        }
    };
    
    return (
        <div>
            <h1>Dashboard</h1>

            {error && <p>{error}</p>}

            <div>
                <h3>Projects: {stats.projects}</h3>
                <h3>Tasks: {stats.Tasks}</h3>
            </div>

            <div>
                <p>Todo: {stats.todo}</p>
                <p>In Progress: {stats.in_progress}</p>
                <p>Done: {stats.done}</p>
            </div>
        </div>
    );
}

export default Dashboard;