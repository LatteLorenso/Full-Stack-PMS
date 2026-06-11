import React, { useState, useEffect } from 'react';
import api from '../services/api'; // Убедись, что путь к api верный
import { socket } from '../services/socket';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsis as faEllipsis } from "@fortawesome/free-solid-svg-icons";
import './TaskComments.css';

function TaskComments({ taskId }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [isOptionsOpen, setIsOptionsOpen] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState('');
    
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
                        id: data.id,
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

    const startEditing = (comment) => {
        console.log("Начало редактирования:", comment);
        if (!comment.id) {
            alert("У коммента нет ID");
            return;
        }
        setEditingId(comment.id);
        setEditText(comment.content);
        setIsOptionsOpen(null);
    };

    const saveEdit = async (commentId) => {
        console.log("Попытка сохранить ID:", commentId);
        if (!commentId) {
            alert("ID коммента потерян");
            return;
        }
        if (!editText.trim()) return;
        try {
            await api.put(`/comments/${commentId}`, { content: editText });

            setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: editText } : c));

            setEditingId(null);
        } catch (err) {
            console.error('Не удалось сохранить изменения', err);
        }
    };

    const deleteComment = async (commentId) => {
        if (!window.confirm("Удалить комментарий?")) return;
        try {
            await api.delete(`/comments/${commentId}`);
            setComments(prev => prev.filter(c => c.id !== commentId));
            setIsOptionsOpen(null);
        } catch (err) {
            console.error('Не удалось удалить комментарий', err);
        }
    };

    return (
        <div className="comments-section">
            <button className="btn-toggle-comments" onClick={() => setIsCommentsOpen(!isCommentsOpen)}>
                {isCommentsOpen ? "Скрыть комментарии" : `Комментарии (${comments.length})`}
            </button>
            
            {isCommentsOpen && (
                <section className="container-comments">
                    <div className="comments-list">
                        {comments.map(comment => (
                            <div key={comment.id} className="comment-item">
                                <div className="comment-header">
                                    <strong>{comment.username}</strong>
                                    <div className="comment-options">
                                        <small>{new Date(comment.created_at).toLocaleString()}</small>
                                        <span className="options-icon" onClick={(e) => { e.stopPropagation(); setIsOptionsOpen(isOptionsOpen === comment.id ? null : comment.id); }}>
                                            <FontAwesomeIcon icon={faEllipsis} /></span>

                                        {/* <div className={isOptionsOpen ? "options-action active" : "options-action"}> */}
                                            {isOptionsOpen === comment.id && (
                                                <section className="comment-mini-menu">
                                                    <button className="menu-item" onClick={() => startEditing(comment)}>Изменить</button>
                                                    <button className="menu-item" onClick={() => deleteComment(comment.id)}>Удалить</button>
                                                </section>
                                            )}
                                        {/* </div> */}
                                    </div>
                                </div>

                                {editingId === comment.id ? (
                                    <section className="edit-area">
                                        <textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="edit-textarea" rows="3"/>
                                        <section className="edit-actions">
                                            <button onClick={() => setEditingId(null)} className="edit-btn-cancel">Отменить</button>
                                            <button onClick={() => saveEdit(comment.id)} className="edit-btn-save">Сохранить</button>
                                        </section>
                                    </section>
                                ) : ( 
                                    <p className="comment-text">{comment.content}</p>
                                )}
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
                        <div className="comment-actions">
                            <button type="submit">Отправить</button>
                        </div>
                    </form>
                </section>
            )}
        </div>
    );
}

export default TaskComments;