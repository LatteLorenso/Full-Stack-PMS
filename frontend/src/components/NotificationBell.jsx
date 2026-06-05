import React, { useState, useEffect, useEffectEvent } from 'react';
import io from 'socket.io-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell as solidBell } from '@fortawesome/free-solid-svg-icons';
import { faBell as regularBell } from '@fortawesome/free-regular-svg-icons';

// Подключение к бэкенду
const socket = io('http://localhost:5000');

function NotificationBell() {
    const [count, setCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    
    useEffect(() => {
        socket.on('new_task', (data) => {
            setCount(prev => prev + 1);

            setNotifications(prev => [{
                id: Date.now(),
                message: data.message || `Новая задача ${data.title}`,
                time: new Date().toLocaleTimeString()
            }, ...prev]);
        });

        // Очистка слушателя при выходе из страницы
        return () => socket.off('new_task');
    }, []);


    const handleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setCount(0); // При открытии сбрасывается счетчик уведомлений
        }
    };
    
    return (
        <section className="container-notification">
            <span onClick={handleOpen} className="btn-open">
                {count === 0 ? <FontAwesomeIcon icon={regularBell} style={{ color: "#008cff", fontSize: "1.7rem" }} /> : <FontAwesomeIcon icon={solidBell} style={{ color: "#008cff", fontSize: "1.7rem" }} />}
                {count > 0 && (
                    <span className="btn-count">
                        {count}
                    </span>
                )}
            </span>
    
            {isOpen && (
                <section className="menu-notification">
                    <h3 className="menu-header">
                        Уведомления
                    </h3>
                    {notifications.length === 0 ? (
                        <p className="notification-null">
                            Нет новых уведомлений
                        </p>
                    ) : (
                        notification.map(note => (
                            <div key={note.id} className="notification">
                                <p>{note.message}</p>
                                <p className="notification-time">{note.time}</p>
                            </div>
                        ))
                    )}
                </section>
            )}
        </section>
    );
}

export default NotificationBell;