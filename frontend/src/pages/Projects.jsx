import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function Projects() {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');
            const data = Array.isArray(res.data) ? res.data : (res.data.projects || []);
            setProjects(data);
        } catch (err) {
            setError('Ошибка загрузки проектов');
        }
    };

    const createProject = async (e) => {
        e.preventDefault();
        try {
            await api.post('/projects', { name, description });
            setName('');
            setDescription('');
            fetchProjects();
        } catch (err) {
            setError('Ошибка создания проекта');
        }
    };

    const updateProject = async (id, data) => {
        try {
            await api.put(`/projects/${id}`, data);
            fetchProjects();
        } catch (err) {
            setError('Ошибка обновления проекта');
        }
    };

    const deleteProject = async (id) => {
        if (!window.confirm('Удалить проект?')) return;
        try {
            await api.delete(`/projects/${id}`);
            fetchProjects();
        } catch (err) {
            setError('Ошибка удаления проекта');
        }
    };

    return (
        <div className="container-project">
            <h1>Проекты</h1>
            {error && <p className="error-msg">{error}</p>}

            <section className="container-form" style={{ marginBottom: '30px' }}>
                <form onSubmit={createProject} className="create-project-form" style={{ display: 'flex', gap: '10px' }}>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Название проекта"
                        required
                        style={{ padding: '10px', borderRadius: '8px', border: 'none' }}
                    />
                    <input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Описание"
                        style={{ padding: '10px', borderRadius: '8px', border: 'none' }}
                    />
                    <button type="submit" style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#4a90e2', color: 'white', cursor: 'pointer' }}>
                        Создать
                    </button>
                </form>
            </section>

            {/* Сетка проектов */}
            <div className="projects-grid">
                {projects.map(project => (
                    <ProjectCard 
                        key={project.id} 
                        project={project} 
                        onDelete={deleteProject} 
                        onUpdate={updateProject} 
                    />
                ))}
            </div>
        </div>
    );
}

// Компонент одной карточки
function ProjectCard({ project, onDelete, onUpdate }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(project.name);
    const [editDesc, setEditDesc] = useState(project.description);

    const handleSave = () => {
        onUpdate(project.id, { name: editName, description: editDesc });
        setIsEditing(false);
    };

    return (
        <div className="project-card">
            {!isEditing ? (
                <>
                    <div className="project-info">
                        <h3>{project.name}</h3>
                        <p>{project.description || 'Нет описания'}</p>
                    </div>
                    
                    <div className="project-actions">
                        <Link to={`/projects/${project.id}/tasks`} className="link-tasks">
                            📂 Задачи проекта
                        </Link>
                        
                        <div className="admin-controls">
                            <button onClick={() => setIsEditing(true)} className="btn-change">
                                ✏️ Изм.
                            </button>
                            <button onClick={() => onDelete(project.id)} className="btn-del">
                                🗑
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="edit-mode">
                    <input 
                        className="edit-input"
                        value={editName} 
                        onChange={(e) => setEditName(e.target.value)} 
                        placeholder="Название"
                    />
                    <input 
                        className="edit-input"
                        value={editDesc} 
                        onChange={(e) => setEditDesc(e.target.value)} 
                        placeholder="Описание"
                    />
                    <div className="admin-controls">
                        <button onClick={handleSave} className="btn-change" style={{ background: '#2ecc71' }}>OK</button>
                        <button onClick={() => setIsEditing(false)} className="btn-del" style={{ background: '#95a5a6' }}>X</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Projects;