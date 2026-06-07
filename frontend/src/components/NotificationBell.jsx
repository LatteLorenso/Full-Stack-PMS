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
        const handleNewTask = (data) => {
            setCount(prev => prev + 1);
            setNotifications(prev => [{
                id: Date.now(),
                message: data.message || `Новая задача ${data.title}`,
                time: new Date().toLocaleTimeString()
            }, ...prev]);
        };

        socket.on('new_task', handleNewTask); // Включаем слушатель

        return () => {
            socket.off('new_task', handleNewTask); // Отключаем слушатель
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