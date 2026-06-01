import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

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
            setProjects(res.data);
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
        await api.put(`/projects/${id}`, data);
        fetchProjects();
    };

    const deleteProject = async (id) => {
        await api.delete(`/projects/${id}`);
        fetchProjects();
    };

    return (
        <div>
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

            <ul>
                {projects.map(project => (
                    <div key={project.id}>
                        <span>{project.name}</span>

                        <button onClick={() => deleteProject(project.id)}>
                            Удалить
                        </button>

                        <button onClick={() => updateProject(project.id)}>
                            Изменить
                        </button>
                    </div>
                ))}
            </ul>
        </div>
    );
}

export default Projects;