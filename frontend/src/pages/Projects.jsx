import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ProjectDetail from '../components/ProjectDetail';

function Projects() {
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

            <form onSubmit={createProject}>
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

                <div>
                    <button type="submit">Создать</button>
                </div>
            </form>

            <div class="projects-list">
                {projects.map(project => (
                    <div key={project.id} style={{  }}>
                        <Link to={`/projects/${project.id}/tasks`}>Открыть задачи этого проекта</Link>

                        <ProjectDetail
                            project={project}
                            onDelete={deleteProject}
                            onUpdate={updateProject}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Projects;