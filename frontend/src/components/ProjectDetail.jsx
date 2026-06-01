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
        <div style={{ border: '1px solid #ccc', padding: '0.625rem', marginBottom: '0.625rem' }}>
            
            {!isEditing ? (
                <>
                    <h3>{project.name}</h3>
                    <p>{project.description}</p>
    
                    <button onClick={() => setIsEditing(true)}>Изменить</button>
                    <button onClick={() => onDelete(project.id)}>Удалить</button>
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