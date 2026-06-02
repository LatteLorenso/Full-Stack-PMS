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
            const data = Array.isArray(res.data.projects) ? res.data.projects : [];
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
        try{
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
        <div class="container-project">
            <h1>Проекты</h1>

            {error && <p>{error}</p>}

            <section class="container-form">
                <form onSubmit={createProject} class="create-project-form">
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Название"
                    />
    
                    <input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Описание"
                    />
                    
                    <button type="submit">Создать</button>
                </form>
            </section>

            <div class="projects-list">
                {projects.map(project => (
                    <div key={project.id}>
                        <section class="info">
                            <h3>{project.name}</h3>
                            <p>{project.description}</p>
                        </section>
                        
                        <section class="btns">
                            <Link to={`/projects/${project.id}/tasks`} class="link">Задачи</Link>
                            <button onClick={() => updateProject(project.id, { name: prompt('Новое имя:', project.name) })} class="btn-change">Изменить</button>
                            <button onClick={() => deleteProject(project.id)} class="btn-del">Удалить</button>
                        </section>

                        {/* <ProjectDetail
                            project={project}
                            onDelete={deleteProject}
                            onUpdate={updateProject}
                        /> */}
                        
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Projects;