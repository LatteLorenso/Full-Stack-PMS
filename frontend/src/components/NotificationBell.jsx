import React, { useState, useEffect } from 'react';
import { socket } from '../services/socket';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell as solidBell } from '@fortawesome/free-solid-svg-icons';
import { faBell as regularBell } from '@fortawesome/free-regular-svg-icons';

function NotificationBell() {
    const [count, setCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    
    useEffect(() => {
        // Слушатель новой задачи
        const handleNewTask = (data) => {
            setCount(prev => prev + 1);
            setNotifications(prev => [{
                id: Date.now(),
                message: data.logDescription || `Новая задача: "${data.title}"`,
                time: new Date().toLocaleTimeString()
            }, ...prev]);
        };

        // Слушатель ОБНОВЛЕНИЯ задачи
        const handleTaskUpdated = (data) => {
            setCount(prev => prev + 1);
            setNotifications(prev => [{
                id: Date.now(),
                message: data.logDescription || `Задача: "${data.title}" обновлена`,
                time: new Date().toLocaleTimeString()
            }, ...prev]);
        };

        // Слушатель УДАЛЕНИЯ задачи 
        const handleTaskDeleted = (data) => {
            setCount(prev => prev + 1);
            setNotifications(prev => [{
                id: Date.now(),
                message: data.logDescription || `Задача: "${data.title}" удалена`,
                time: new Date().toLocaleTimeString()
            }, ...prev]);
        };

        // Слушатель ДОБАВЛЕНИЯ файла в задаче
        const handleTaskFileAdded = (data) => {
            setCount(prev => prev + 1);
            setNotifications(prev => [{
                id: Date.now(),
                message: data.logDescription || `Задача: "${data.title}" дополнилась файлом`,
                time: new Date().toLocaleTimeString()
            }, ...prev]);
        };

        // Слушатель УДАЛЕНИЯ файла в задаче
        const handleTaskFileRemoved = (data) => {
            setCount(prev => prev + 1);
            setNotifications(prev => [{
                id: Date.now(),
                message: data.logDescription || `В задаче: "${data.title}" удалился файл`,
                time: new Date().toLocaleTimeString()
            }, ...prev]);
        };

        // Подключаем оба слушателя
        socket.on('new_task', handleNewTask);
        socket.on('task_updated', handleTaskUpdated);
        socket.on('task_deleted', handleTaskDeleted);
        socket.on('task_file_added', handleTaskFileAdded);
        socket.on('task_file_deleted', handleTaskFileRemoved);

        // Очистка
        return () => {
            socket.off('new_task', handleNewTask);
            socket.off('task_updated', handleTaskUpdated);
            socket.off('task_deleted', handleTaskDeleted);
            socket.off('task_file_added', handleTaskFileAdded);
            socket.off('task_file_deleted', handleTaskFileRemoved);
        };
    }, []);

    const handleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setCount(0);
        }
    };
    
    return (
        <section className="icon-notification">
            <span onClick={handleOpen} className="btn-open">
                {count === 0 ? 
                    <span className="icon-regular"><FontAwesomeIcon icon={regularBell} style={{ fontSize: "1.6rem" }} /></span> : 
                    <span className="icon-solid"><FontAwesomeIcon icon={solidBell} style={{ fontSize: "1.6rem" }} /></span>
                }
                {count > 0 && (
                    <span className="btn-count">{count}</span>
                )}
            </span>
    
            {isOpen && (
                <section className="menu-notification">
                    <div className="container-notification">
                        <h3 className="menu-header">Уведомления</h3>
                        {notifications.length === 0 ? (
                            <p className="notification-null">Нет новых уведомлений</p>
                        ) : (
                            notifications.map(note => (
                                <div key={note.id} className="notification">
                                    <p className="notification-message">{note.message}</p>
                                    <p className="notification-time">{note.time}</p>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            )}
        </section>
    );
}

export default NotificationBell;