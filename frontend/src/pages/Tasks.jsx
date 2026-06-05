import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useParams, Link } from 'react-router-dom';
import '../Tasks.css';
import TaskFiles from '../components/TaskFiles';
import io from 'socket.io-client';

const socket = io();

function Tasks() {
    const { id } = useParams();
    const [tasks, setTasks] = useState([]);
    
    // Состояние для формы создания
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('todo');
    const [assignedTo, setAssignedTo] = useState('');
    const [dueDate, setDueDate] = useState('');
    
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);

    // Первая загрузка ВСЕХ задач проекта
    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const res = await api.get('/tasks', { params: { project_id: id } });
                setTasks(res.data);
            } catch (err) {
                setError('Ошибка загрузки задач');
            }
        };
        fetchTasks();
    }, [id]);

    //  Подписка на НОВЫЕ задачи проекта
    useEffect(() => {
        if (!id) return;

        socket.emit('join_project', id);

        // 1. Новая задача
        socket.on('new_task', (data) => {
            setTasks(prev => [{
                id: data.id,
                title: data.title,
                description: "",
                status: "todo",
                project_id: id,
                created_at: new Date().toISOString()
            }, ...prev]);
        });

        // 2. 🔥 Обновление задачи
        socket.on('task_updated', (updatedData) => {
            setTasks(prev => prev.map(task => 
                task.id === updatedData.id ? { ...task, ...updatedData } : task
            ));
        });

        // 3. 🔥 Удаление задачи
        socket.on('task_deleted', (data) => {
            setTasks(prev => prev.filter(task => task.id !== data.id));
        });

        return () => {
            socket.off('new_task');
            socket.off('task_updated');   // 👈 Не забываем чистить
            socket.off('task_deleted');   // 👈 И этот тоже
        };
    }, [id]);

    const createTask = async (e) => {
        e.preventDefault();
        if (!id) return;
        try {
            await api.post('/tasks', { 
                title, description, status, 
                project_id: id, 
                assigned_to: assignedTo || null, 
                due_date: dueDate || null 
            });
            
            setTitle('');
            setDescription('');
            setAssignedTo('');
            setStatus('todo');
            setDueDate('');
            setShowForm(false);
        } catch (err) {
            console.error("Полная ошибка:", err);
            if (err.response) {
                setError(`Ошибка сервера: ${err.response.status} - ${JSON.stringify(err.response.data)}`);
            } else {
                setError('Ошибка сети или создание задачи');
            }
        }
    };

    const updateTask = async (taskId, updatedData) => {
        try {
            await api.put(`/tasks/${taskId}`, updatedData);
        } catch (err) {
            setError('Ошибка обновления задачи');
        }
    };

    const deleteTask = async (taskId) => {
        if (!window.confirm('Удалить задачу?')) return;
        try {
            await api.delete(`/tasks/${taskId}`);
        } catch (err) {
            setError('Ошибка удаления задачи');
        }
    };

    return (
        <div className="container-task">
            <section className="header-page">
                <Link to={`/projects`} className="back-link">← Назад к проекту</Link>
                <h1>Задачи проекта</h1>
            </section>
            
            <hr className="divider" />
            {error && <p className="error-msg">{error}</p>}

            {!showForm && (
                <button onClick={() => setShowForm(true)} className="btn-show-task-form">Создать новую задачу</button>
            )}

            {showForm && (
                <div className="form-container">
                    <form onSubmit={createTask}>
                        <div className="form-row">
                            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder='Название' required className={`${title ? 'has-value' : ''}`}/>
                            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder='Описание' className={`${description ? 'has-value' : ''}`}/>
                            <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${status ? 'has-value' : ''}`}>
                                <option value="todo">К выполнению</option>
                                <option value="in_progress">В работе</option>
                                <option value="done">Готово</option>
                            </select>
                            <input type="number" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder='ID исполнителя' className={`${assignedTo ? 'has-value' : ''}`}/>
                            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={`${dueDate ? 'has-value' : ''}`}/>
                        </div>
                        <div className="form-actions">
                            <button type='button' onClick={() => setShowForm(false)} className="btn-cancel">Отмена</button>
                            <button type='submit' className="btn-save">Создать</button>
                        </div>
                    </form>
                </div>
            )}
            <hr />

            <section className="tasks-mine">
                <div className="tasks-grid">
                    {tasks.map(task => (
                        <TaskItem 
                            key={task.id} 
                            task={task} 
                            onDelete={deleteTask} 
                            onUpdate={updateTask} 
                        />
                    ))}
                </div>
            </section>
        </div>
    );
}

// Внутренний компонент для одной карточки задачи
function TaskItem({ task, onDelete, onUpdate }) {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description);
    const [status, setStatus] = useState(task.status);
    const [assignedTo, setAssignedTo] = useState(task.assigned_to || '');
    const [dueDate, setDueDate] = useState(task.due_date ? task.due_date.split('T')[0] : '');

    useEffect(() => {
        setTitle(task.title);
        setDescription(task.description);
        setStatus(task.status);
        setAssignedTo(task.assigned_to || '');
        setDueDate(task.due_date ? task.due_date.split('T')[0] : '');
    }, [task]);

    const handleUpdate = () => {
        onUpdate(task.id, { title, description, status, assigned_to: assignedTo, due_date: dueDate });
        setIsEditing(false);
    };

    const formattedDate = task.due_date ? new Date(task.due_date).toLocaleDateString('ru-RU') : 'Не указана';

    return (
        <div className="task-card">
            {!isEditing ? (
                <>
                <button onClick={() => onDelete(task.id)} className="btn-del">×</button>
                    <div className="task-header">
                        <section className="sec-badge">
                            <span className={`status-badge ${task.status}`}>
                                {task.status === 'todo' && 'К выполнению'}
                                {task.status === 'in_progress' && 'В работе'}
                                {task.status === 'done' && 'Готово'}
                            </span>
                        </section>
                        <h3>{task.title}</h3>
                    </div>
                    <p className="task-desc">{task.description || 'Нет описания'}</p>
                    <div className="task-meta">
                        <div className="meta-item"><span>Исполнитель:</span> <strong>{task.assigned_to || 'Не назначен'}</strong></div>
                        <div className="meta-item"><span>Срок:</span> <strong>{formattedDate}</strong></div>
                    </div>
                    <div className="task-actions">
                        <button onClick={() => setIsEditing(true)} className="btn-edit">Изменить</button>
                    </div>
                    <section className="task-details">
                        <TaskFiles taskId={task.id} />
                    </section>
                </>
            ) : (
                <div className="edit-mode">
                    <input className="edit-input task" value={title} onChange={(e) => setTitle(e.target.value)} placeholder='Название' />
                    <input className="edit-input task" value={description} onChange={(e) => setDescription(e.target.value)} placeholder='Описание' />
                    <select className="edit-input task" value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="todo">К выполнению</option>
                        <option value="in_progress">В работе</option>
                        <option value="done">Готово</option>
                    </select>
                    <input className="edit-input task" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="ID исполнителя" />
                    <input className="edit-input task" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                    <div className="task-actions">
                        <button onClick={() => setIsEditing(false)} className="btn-cancel">Отмена</button>
                        <button onClick={handleUpdate} className="btn-save">Сохранить</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Tasks;