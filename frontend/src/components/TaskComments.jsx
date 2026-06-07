import React, { useState, useEffect } from 'react';
import api from '../services/api'; // Убедись, что путь к api верный
import { socket } from '../services/socket';
import './TaskComments.css';

function TaskComments({ taskId }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');

    console.warn(taskId);
    
    // Загрузка комментариев
    const fetchComments = async () => {
        console.log(taskId);
        try {
            const res = await api.get(`/comments/task/${taskId}`);

            const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
            
            setComments(data);
            console.log(data);
        } catch (err) {
            console.error("Ошибка загрузки комментариев", err);
        }
    };

    useEffect(() => {
        if (taskId) {
            fetchComments();

            // Слушаем новые комментарии через сокет
            const handleNewComment = (data) => {
                // Проверяем, что комментарий относится именно к этой задаче
                if (data.taskId === parseInt(taskId)) {
                    setComments(prev => [...prev, {
                        id: data.id || Date.now(), // Используем ID с бэка, если он пришел
                        content: data.content,
                        username: data.username,
                        created_at: new Date().toISOString()
                    }]);
                }
            };

            socket.on('new_comment', handleNewComment);
            
            // Очистка слушателя при размонтировании или смене taskId
            return () => socket.off('new_comment', handleNewComment);
        }
    }, [taskId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            await api.post('/comments', { content: newComment, taskId });
            setNewComment('');
            // Данные обновятся автоматически через socket.on('new_comment')
        } catch (err) {
            console.error(err);
            alert("Не удалось отправить комментарий");
        }
    };

    return (
        <div className="comments-section">
            <h3>Комментарии ({comments.length})</h3>
            
            <div className="comments-list">
                {comments.map(comment => (
                    <div key={comment.id} className="comment-item">
                        <div className="comment-header">
                            <strong>{comment.username}</strong>
                            <small>{new Date(comment.created_at).toLocaleString()}</small>
                        </div>
                        <p className="comment-text">{comment.content}</p>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="comment-form">
                <textarea 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Напишите комментарий..."
                    rows="2"
                    required
                />
                <button type="submit">Отправить</button>
            </form>
        </div>
    );
}

export default TaskComments;