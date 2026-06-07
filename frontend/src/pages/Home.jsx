import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder as solFolder } from '@fortawesome/free-solid-svg-icons';
import { faSquareCheck as solSquareCheck } from '@fortawesome/free-solid-svg-icons';
import { faMagnifyingGlass as solMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import '../Home.css';

function Home() {
    const [activities, setActivities] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Имитация загрузки недавней активности (позже подключим реальный API)
    useEffect(() => {
        // Здесь будет запрос к API за лентой активности
        const mockActivities = [
            { id: 1, text: "Вы создали проект 'Новый Сайт'", time: "2 часа назад" },
            { id: 2, text: "Пользователь Alex добавил комментарий к задаче #42", time: "5 часов назад" },
            { id: 3, text: "Задача 'Дизайн главной' перемещена в 'Готово'", time: "Вчера" },
        ];
        setActivities(mockActivities);
    }, []);

    return (
        <div className="home-container">
            {/* Секция Приветствия и Поиска */}
            <header className="home-header">
                <h1>Чем займемся сегодня?</h1>
                <div className="search-bar">
                    <input 
                        type="text" 
                        placeholder="Поиск проектов или задач..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button><span className="search"><FontAwesomeIcon icon={solMagnifyingGlass} /></span></button>
                </div>
            </header>

            {/* Секция Быстрого Старта */}
            <section className="quick-actions">
                <Link to="/projects" className="action-card primary">
                    <span className="icon"><FontAwesomeIcon icon={solFolder} style={{color: "rgb(255, 212, 59)"}} /></span>
                    <h2>Создать проект</h2>
                    <p>Начни что-то новое</p>
                </Link>
                
                <Link to="/tasks" className="action-card secondary">
                    <span className="icon"><FontAwesomeIcon icon={solSquareCheck} style={{color: "#23b879"}} /></span>
                    <h2>Мои задачи</h2>
                    <p>Посмотреть список дел</p>
                </Link>
            </section>

            {/* Секция Недавней Активности */}
            <section className="recent-activity">
                <h3>Недавняя активность</h3>
                <div className="activity-list">
                    {activities.map(item => (
                        <div key={item.id} className="activity-item">
                            <div className="activity-dot"></div>
                            <div className="activity-content">
                                <p>{item.text}</p>
                                <span className="activity-time">{item.time}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

export default Home;