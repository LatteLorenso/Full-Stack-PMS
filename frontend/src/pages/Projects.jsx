import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { create } from 'axios';

function Register() {
    const [projects, setProjects] = useState([]);
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const { token } = useAuth();
    const navigate = useNavigate();

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
            await api.post('/projects', { name });
            setName('');
            fetchProjects();
        } catch (err) {
            setError('Ошибка создания проекта');
        }
    };

    const updateProject = async (id, name) => {
        await api.post(`/projects/${id}`, { name });
        fetchProjects();
    };

    const deleteProject = async (id) => {
        await api.post(`/projects/${id}`);
        fetchProjects();
    };

    return (
        <div>
            <h1>Проекты</h1>

            {error && <p>{error}</p>}

            <form onSubmit={createProject}>
                <input
                    value={name}
                    onChange={(e) => setName(e.target.name)}
                    placeholder="Название проекта"
                />

                <div>
                    <button
                        type="submit"
                        value="Создать"
                    />
                </div>
            </form>

            <ul>
                {projects.map((project) => {
                    <div key={project.id}>
                        <span>{project.name}</span>

                        <button onClick={() => deleteProject(project.id)}>
                            Удалить
                        </button>

                        <button onClick={() => updateProject(project.id, "Новое имя")}>
                            Изменить
                        </button>
                    </div>
                })}
            </ul>
        </div>
    );
}

export default Projects;