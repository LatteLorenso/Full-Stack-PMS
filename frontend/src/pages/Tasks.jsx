import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function Tasks({ projectId }) {
    const [tasks, setTasks] = useState([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [status, setStatus] = useState('todo');
    const [dueDate, setDueDate] = useState('');
    const [error, setError] = useState('');
    const { token } = useAuth();

    useEffect(() => {
        fetchTasks();
    }, [projectId]);

    const fetchTasks = async () => {
        try {
            const res = await api.get(`/tasks?projectId=${projectId}`);
            setTasks(res.data);
        } catch (err) {
            setError('Ошибка загрузки задач');
        }
    };

    const createTask = async (e) => {
        e.preventDefault();
        try {
            await api.post('/tasks', { title, description, assigned_to: assignedTo, status, due_date: dueDate, projectId: projectId });

            setTasks(prev => [...prev, res.data]);

            setTitle('');
            setDescription('');
            setAssignedTo('');
            setStatus('todo');
            setDueDate('');
        } catch (err) {
            setError('Ошибка создания задачи');
        }
    };

    const updateTask = async (id, newStatus) => {
        try {
            await api.put(`/tasks/${id}`, { newStatus });

            setTasks(prev =>
                prev.map(task =>
                    task.id === id ? { ...task, status: newStatus } : task
                )
            );
        } catch (err) {
            setError('Ошибка обновления задачи');
        }
    };

    const deleteTask = async (id) => {
        try {
            await api.delete(`/tasks/${id}`);

            setTasks(prev => prev.filter(task => task.id !== id));
        } catch (err) {
            setError('Ошибка удаления задачи');
        }
    };

    return (
        <div>
            <h1>Tasks</h1>

            {error && <p>{error}</p>}

            <form onSubmit={createTask}>
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder='Title'
                />

                <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder='Description'
                />

                <input
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    placeholder='Assigned to'
                />

                <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    placeholder='Description'
                />

                <button type='submit'>Create Task</button>
            </form>

            {tasks.map(task => {
                <div key={task.id}>
                    <h3>{task.title}</h3>
                    <p>{task.description}</p>

                    <p>Status: {task.status}</p>
                    <p>Assigned: {task.assigned_to}</p>

                    <button onClick={() => updateStatus(task.id, 'todo')}>Todo</button>
                    <button onClick={() => updateStatus(task.id, 'in_progress')}>In Progress</button>
                    <button onClick={() => updateStatus(task.id, 'done')}>Done</button>

                    <button onClick={() => deleteTask(task.id)}>Delete</button>
                </div>
            })}
        </div>
    );
}

export default Tasks;