import React, { useState } from 'react';

function TaskDetail({ task, onDelete, onUpdate }) {
    const [isEditing, setIsEditing] = useState(false);
    
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description);
    const [status, setStatus] = useState(task.status);
    const [assignedTo, setAssignedTo] = useState(task.assigned_to);
    const [dueDate, setDueDate] = useState(task.due_date);

    const handleUpdate = () => {
        onUpdate(task.id, {
            title,
            description,
            status,
            assigned_to: assignedTo,
            due_date: dueDate
        });

        setIsEditing(false);
    };

    return (
        <div style={{ border: '1px solid #ccc', padding: '0.625rem', marginBottom: '0.625rem' }}>

            {!isEditing ? (
                <>
                    <h3>{task.name}</h3>
                    <p>{task.description}</p>

                    <p>Status: {task.status}</p>
                    <p>Assigned: {task.assigned_to}</p>
                    <p>Due: {task.due_date}</p>

                    <button onClick={() => setIsEditing(true)}>Изменить</button>
                    <button onClick={() => onDelete(task.id)}>Удалить</button>
                </>
            ) : (
                <>
                    <input
                        value={title}
                        onChange={(e) => setName(e.target.value)}
                    />
    
                    <input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
    
                    <input
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                    />
    
                    <input
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                    />
    
                    <input
                        type='date'
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                    />

                    <button onClick={handleUpdate}>Сохранить</button>
                    <button onClick={() => setIsEditing(false)}>Отмена</button>
                </>
            )}
        </div>
    );
}

export default TaskDetail;