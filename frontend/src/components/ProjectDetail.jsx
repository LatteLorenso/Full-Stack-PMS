import React, { useState } from 'react';

function ProjectDetail({ project, onDelete, onUpdate }) {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(project.name);
    const [description, setDescription] = useState(project.description);

    const handleUpdate = () => {
        onUpdate(project.id, {
            name,
            description
        });

        setIsEditing(false);
    };

    return (
        <div class="projects-info">
            {!isEditing ? (
                <>
                    <section class="info">
                        <h3>{project.name}</h3>
                        <p>{project.description}</p>
                    </section>
    
                    <section class="btns">
                        <button onClick={() => setIsEditing(true)} class="btn-change">Изменить</button>
                        <button onClick={() => onDelete(project.id)} class="btn-del">Удалить</button>
                    </section>
                </>
            ) : (
                <>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
    
                    <input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
    
                    <button onClick={handleUpdate}>Сохранить</button>
                    <button onClick={() => setIsEditing(false)}>Отмена</button>
                </>
            )}
        </div>
    );
}

export default ProjectDetail;