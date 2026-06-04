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
    const [showForm, setShowForm] = useState(false);

    // Стейт для модал. окна добавления участников
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
    const [currentProjectId, setCurrentProjectId] = useState(null);
    const [allUsers, setAllUsers] = useState([]);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');
            // const data = Array.isArray(res.data) ? res.data : (res.data.projects || []);
            setProjects(res.data.projects || res.data);
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
            setShowForm(false);
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

    // Открытие модалки для добавления участников
    const openMemberModal = async (projectId) => {
        setCurrentProjectId(projectId);
        setIsMemberModalOpen(true);
        try {
            const res = await api.get("/users/all");
            setAllUsers(res.data);
        } catch (err) {
            setError('Ошибка открытия модального окна и получения всех пользователей');
        }
    };

    // Добавление участников в проект
    const addMemberToProject = async (userId) => {
        if (!currentProjectId) return;
        try {
            await api.post(`/projects/${currentProjectId}/members`, { user_id: userId });
            alert("Участник добавлен");
            fetchProjects();
        } catch (err) {
            setError('Ошибка добавления участников в проект');
        }
    };

    return (
        <div className="container-project">
            <h1>Проекты</h1>
            <p>Все проекты, созданные Вашей командой.</p>
            <hr />
            {error && <p className="error-msg">{error}</p>}

            {!showForm && (
                <button onClick={() => setShowForm(!showForm)} className="btn-show-form">Создать новый проект</button> )}

            {showForm && (
                <section className="container-form">
                    <form onSubmit={createProject} className="create-project-form">
                        <section className="inputs">
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Название проекта"
                                required
                            />
                            <input
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Описание"
                            />
                        </section>
                        <section className="btns">
                            <button type='button' onClick={() => setShowForm(false)} className="btn-cancel">Отмена</button>
                            <button type='submit' className="btn-save">Создать</button>
                        </section>
                    </form>
                </section>
            )}

            {/* Сетка проектов */}
            <section className="projects-mine">
                <h3>Последние проекты</h3>
                <div className="projects-grid">
                    {projects.map(project => (
                        <ProjectCard 
                            key={project.id}
                            project={project}
                            onDelete={deleteProject}
                            onAddMember={() => openMemberModal(project.id)}
                            onUpdate={updateProject}
                        />
                    ))}
                </div>

                <section className="projects-modal-add">
                    {isMemberModalOpen && (
                        <AddMemberModal
                            users={allUsers}
                            onClose={() => setIsMemberModalOpen(false)}
                            onAdd={addMemberToProject}
                            currentUserId={user?.id}
                        />
                    )}
                </section>
            </section>
        </div>
    );
}

// Компонент одной карточки
function ProjectCard({ project, onDelete, onAddMember, onUpdate }) {
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
                    <button onClick={() => onDelete(project.id)} className="btn-del">×</button>
                    <section className="project-info">
                        <h3>{project.name}</h3>
                        <p>{project.description || 'Нет описания'}</p>
                    </section>

                    <section className="members-meta">
                        <div className="meta-item">
                            <span>Основатель:</span>
                            <strong>{project.owner_name || "Неизвестно"}</strong>
                        </div>
                        {project.member_names && (
                            <div className="meta-item">
                                <span>Команда:</span>
                                <strong>{project.member_names}</strong>
                            </div>
                        )}
                    </section>

                    <section className="project-actions">
                        <Link to={`/projects/${project.id}/tasks`} className="link-tasks">Задачи проекта</Link>
                    </section>

                    <hr />

                    <div className="project-settings">
                        <button onClick={onAddMember} className="btn-add">Добавить участников</button>
                        <button onClick={() => setIsEditing(true)} className="btn-change">Изменить</button>
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
                    <div className="project-settings">
                        <button onClick={handleSave} className="btn-change" style={{ background: '#2ecc71' }}>OK</button>
                        <button onClick={() => setIsEditing(false)} className="btn-del" style={{ background: '#95a5a6' }}>X</button>
                    </div>
                </div>
            )}
        </div>
    );
}

function AddMemberModal({ users, onClose, onAdd, currentUserId }) {
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Выбрать участника</h3>
                <section className="user-list">
                    {users.map(u => {
                        u.id !== currentUserId && (
                            <div key={u.id} className="user-item" onClick={onAdd(u.id)}>
                                <span>{u.username}</span>
                                <span className="user-role">{u.role}</span>
                            </div>
                        )
                    })}
                </section>
                <button type="button" onClick={onClose} className="btn-cancel">Сохранить</button>
            </div>
        </div>
    );
}

export default Projects;