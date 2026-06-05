import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import "../Projects.css";
import ProjectPdf from '../components/ProjectPdf';
import html2pdf from 'html2pdf.js';

function Projects() {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);

    // Стейт для модал. окна добавления/удаления участников
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
    const [currentProjectId, setCurrentProjectId] = useState(null);
    const [currentProjectData, setCurrentProjectData] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);

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
            const usersRes = await api.get("/projects/users/all");
            setAllUsers(usersRes.data);

            const projectsRes = await api.get(`/projects/${projectId}`);
            setCurrentProjectData(projectsRes.data);
        } catch (err) {
            setError('Ошибка загрузки данных');
            setIsMemberModalOpen(false);
        }
    };
    
    const handleSelectMember = (id) => {
        setSelectedUserId(id === selectedUserId ? null : id);
    };

    // Добавление участников в проект
    const handleAcceptMember = async () => {
        if (!selectedUserId || !currentProjectId) return;

        try {
            await api.post(`/projects/${currentProjectId}/members`, { user_id: selectedUserId });
            console.log("Участник добавлен");
            setIsMemberModalOpen(false);
            setSelectedUserId(null);
            fetchProjects();
        } catch (err) {
            setError('Ошибка добавления участника');
        }
    };

    const handleRemoveMember = async (userId) => {
        if (!currentProjectId || !userId || !window.confirm("Удалить участника из проекта?")) return;

        try {
            await api.delete(`/projects/${currentProjectId}/members/${userId}`);

            const projectsRes = await api.get(`/projects/${currentProjectId}`);
            setCurrentProjectData(projectsRes.data);
            setSelectedUserId(null);

            fetchProjects();
        } catch (err) {
            setError('Ошибка удаления участника');
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
                    {isMemberModalOpen && currentProjectData && (
                        <AddMemberModal
                            users={allUsers}
                            projectMembers={currentProjectData.members}
                            ownerId={currentProjectData.owner_id}
                            projectId={currentProjectId}
                            onClose={() => {setIsMemberModalOpen(false); setSelectedUserId(null);}}
                            selectedUserId={selectedUserId}
                            onSelect={handleSelectMember}
                            onAccept={handleAcceptMember}
                            onRemove={handleRemoveMember}
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
                        <button onClick={() => {
                            const element = document.getElementById(`pdf-content-${project.id}`);
                            if (element) {
                                html2pdf().from(element).save(`project-${project.name}.pdf`);
                            } else {
                                console.error("Элемент для PDF не найден");
                            }
                        }} className="btn-pdf">Скачать PDF</button>
                    </div>

                    <section className="section-pdf visually-hidden">
                        <section id={`pdf-content-${project.id}`}>
                            <section className="pdf-info">
                                <h1>{project.name}</h1>
                                <p><strong>Описание:</strong> {project.description}</p>
                                <p><strong>Основатель:</strong> {project.owner_name}</p>
                                <hr />
                                <p><em>Отчет сгенерирован автоматически</em></p>
                            </section>
                        </section>
                    </section>
                </>
            ) : (
                <div className="edit-mode">
                    <input
                        className="edit-input project"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Название"
                    />
                    <input
                        className="edit-input project"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="Описание"
                    />
                    <div className="task-actions">
                        <button onClick={() => setIsEditing(false)} className="btn-cancel">Отмена</button>
                        <button onClick={handleSave} className="btn-save">Сохранить</button>
                    </div>
                </div>
            )}
        </div>
    );
}

function AddMemberModal({ users, projectMembers, ownerId, onClose, selectedUserId, onSelect, onAccept, onRemove, currentUserId }) {
    
    // Получаем список ID тех, кто уже в проекте
    const memberIds = projectMembers.map(m => m.id);
    
    const isCurrentMember = selectedUserId && memberIds.includes(selectedUserId);

    const selectedUser = [...projectMembers, ...users].find(u => u.id === selectedUserId);
    const isOwner = selectedUser?.isOwner;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Команда проекта</h3>
                    <button onClick={onClose} className="btn-del">×</button>
                </div>
                
                {/* Секция 1: Текущие участники */}
                <div className="modal-section">
                    <h4>В проекте:</h4>
                    <div className="user-list">
                        {projectMembers.map(member => (
                            
                            <div key={member.id}
                                className={`user-item current-member ${selectedUserId === member.id ? 'selected' : ''}`} onClick={() => onSelect(member.id)}>
                                <div className="member-info">
                                    <span>{member.username}</span>
                                    {member.isOwner && <span className="user-role owner">Owner</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <hr className="modal-divider" />

                {/* Секция 2: Добавить новых */}
                <div className="modal-section">
                    <h4>Добавить участника:</h4>
                    <section className="user-list">
                        {users.map(u => {
                            // Если пользователь уже в проекте — не показываем его здесь
                            if (memberIds.includes(u.id)) return null;
                            const isSelected = u.id === selectedUserId;
                            
                            return (
                                <div 
                                    key={u.id} 
                                    className={`user-item ${isSelected ? 'selected' : ''}`} 
                                    onClick={() => onSelect(u.id)}
                                >
                                    <span>{u.username}</span>
                                    <span className={`user-role ${u.role}`}>{u.role}</span>
                                </div>
                            );
                        })}
                    </section>
                    
                    <button
                        type="button"
                        className={`btn-action ${isCurrentMember ? 'btn-remove' : 'btn-accept'}`}
                        disabled={!selectedUserId || isOwner}
                        onClick={() => {
                            if (isCurrentMember) {
                                onRemove(selectedUserId);
                            } else {
                                onAccept();
                            }
                        }}
                    >
                        {isCurrentMember ? "Удалить выбранного" : "Добавить выбранного"}
                        
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Projects;