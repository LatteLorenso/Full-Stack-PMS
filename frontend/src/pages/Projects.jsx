import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ProjectDetail from '../components/ProjectDetail';

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
            setProjects(Array.isArray(res.data.projects) ? res.data.projects : []);
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
        try{
            await api.put(`/projects/${id}`, data);
            fetchProjects();
        } catch (err) {
            setError('Ошибка обновления проекта');
        }

    };

    const deleteProject = async (id) => {
        try {
            await api.delete(`/projects/${id}`);
            fetchProjects();
        } catch (err) {
            setError('Ошибка удаления проекта');
        }
    };

    return (
        <div class="container-project">
            <h1>Проекты</h1>

            {error && <p>{error}</p>}

            <form onSubmit={createProject} class="create-project-form">
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Название проекта"
                />

                <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Описание"
                />
                
                <button type="submit">Создать</button>
            </form>

            <div className="projects-grid">
                {projects.map(project => (
                    <div key={project.id} className="project-card">
                        <div className="card-header">
                            <h2>{project.name}</h2>
                            <span className="badge">{project.owner_id === user?.id ? 'Владелец' : 'Участник'}</span>
                        </div>
                        
                        <p className="card-desc">{project.description || 'Нет описания'}</p>
                        
                        <div className="card-actions">
                            <Link to={`/projects/${project.id}/tasks`} className="btn-primary">Задачи</Link>
                            
                            <ProjectDetail
                                project={project}
                                onDelete={deleteProject}
                                onUpdate={updateProject}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Projects;