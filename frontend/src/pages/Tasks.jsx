import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useParams } from 'react-router-dom';
import TaskDetail from '../components/TaskDetail';

function Tasks() {
    const { id } = useParams();
    const [tasks, setTasks] = useState([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('todo');
    const [assignedTo, setAssignedTo] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [error, setError] = useState('');
    const { token } = useAuth();

    useEffect(() => {
        fetchTasks();
    }, [id]);

    const fetchTasks = async () => {
        try {
            const res = await api.get('/tasks', {
                params: {
                    project_id: id
                }
            });
            setTasks(res.data);
            console.log(res.data);
        } catch (err) {
            setError('Ошибка загрузки задач');
        }
    };

    const createTask = async (e) => {
        e.preventDefault();
        if (!id) return;

        try {
            const res = await api.post('/tasks', { title, description, status, project_id: id, assigned_to: assignedTo || null, due_date: dueDate || null });

            setTasks(prev => [...prev, res.data]);

            setTitle('');
            setDescription('');
            setAssignedTo('');
            setStatus('todo');
            setDueDate('');

            fetchTasks();
        } catch (err) {
            setError('Ошибка создания задачи');
        }
    };

    const updateTask = async (id, newStatus) => {
        try {
            await api.put(`/tasks/${id}`, { status: newStatus });

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
        <div class="container-task">
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

                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="todo">К выполнению</option>
                    <option value="in_progress">В работе</option>
                    <option value="done">Готово</option>
                </select>

                <button type='submit'>Create Task</button>
            </form>

            <section class="tasks-list">
                {tasks.map(task => (
                    <TaskDetail
                        key={task.id}
                        task={task}
                        onDelete={deleteTask}
                        onUpdate={updateTask}
                    />
                ))}
            </section>
        </div>
    );
}

export default Tasks;