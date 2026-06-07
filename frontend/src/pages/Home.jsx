import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { socket } from '../services/socket';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder as solFolder, faSquareCheck as solSquareCheck, faMagnifyingGlass as solMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import '../Home.css';

function Home() {
    const [activities, setActivities] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        // 1. Инициализация: Загрузка данных и подписка на проекты
        const initHome = async () => {
            try {
                // Загружаем историю и список проектов параллельно
                const [actRes, projRes] = await Promise.all([
                    api.get('/activity'),
                    api.get('/projects')
                ]);

                if (!isMounted) return;

                // Устанавливаем начальную ленту активности
                setActivities(actRes.data);

                // Подписываемся на комнаты всех наших проектов
                let projectsList = [];
                if (Array.isArray(projRes.data)) projectsList = projRes.data;
                else if (projRes.data?.projects) projectsList = projRes.data.projects;

                console.log("Home: Подписываюсь на проекты:", projectsList.map(p => p.id));
                projectsList.forEach(project => {
                    socket.emit('join_project', project.id);
                });

            } catch (err) {
                console.error(err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        initHome();

        // 2. Слушатель событий
        const handleNewTask = (data) => {
            const newActivity = {
                id: Date.now(),
                description: data.logDescription || `Задача "${data.title}" создана`,
                created_at: new Date().toISOString()
            };
            setActivities(prev => [newActivity, ...prev]);
        };

        // 3. Слушатель ОБНОВЛЕНИЯ задачи
        const handleTaskUpdated = (data) => {
            const newActivity = {
                id: Date.now(),
                description: data.logDescription || `Задача "${data.title}" обновлена`,
                user_id: data.user_id,
                created_at: new Date().toISOString()
            };
            setActivities(prev => [newActivity, ...prev]);
        };

        // 4. Слушатель УДАЛЕНИЯ задачи 
        const handleTaskDeleted = (data) => {
            const newActivity = {
                id: Date.now(),
                description: data.logDescription || `Задача "${data.title}" удалена`,
                user_id: data.user_id,
                created_at: new Date().toISOString()
            };
            setActivities(prev => [newActivity, ...prev]);
        };

        // 5. Слушатель ДОБАВЛЕНИЯ файла в задаче
        const handleTaskFileAdded = (data) => {
            const newActivity = {
                id: Date.now(),
                description: data.logDescription || `Задача "${data.title}" была дополнена файлом`,
                user_id: data.user_id,
                created_at: new Date().toISOString()
            };
            setActivities(prev => [newActivity, ...prev]);
        };

        // 6. Слушатель УДАЛЕНИЯ файла в задаче
        const handleTaskFileRemoved = (data) => {
            const newActivity = {
                id: Date.now(),
                description: data.logDescription || `Из задачи "${data.title}" был удален файл`,
                user_id: data.user_id,
                created_at: new Date().toISOString()
            };
            setActivities(prev => [newActivity, ...prev]);
        };

        // Подключаем оба слушателя
        socket.on('new_task', handleNewTask);
        socket.on('task_updated', handleTaskUpdated);
        socket.on('task_deleted', handleTaskDeleted);
        socket.on('task_file_added', handleTaskFileAdded);
        socket.on('task_file_deleted', handleTaskFileRemoved);

        // Очистка
        return () => {
            isMounted = false;
            socket.off('new_task', handleNewTask);
            socket.off('task_updated', handleTaskUpdated);
            socket.off('task_deleted', handleTaskDeleted);
            socket.off('task_file_added', handleTaskFileAdded);
            socket.off('task_file_deleted', handleTaskFileRemoved);
        };
    }, []);

    // Форматирование времени (например: "5 мин. назад")
    const getTimeAgo = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        if (seconds < 60) return 'только что';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} мин. назад`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} ч. назад`;
        return `${Math.floor(hours / 24)} дн. назад`;
    };

    return (
        <div className="home-container">
            <header className="home-header">
                <h1>Чем займемся сегодня?</h1>
                <div className="search-bar">
                    <input 
                        type="text" 
                        placeholder="Поиск проектов или задач..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button><span className="search"><FontAwesomeIcon icon={solMagnifyingGlass} style={{color: "#125ed1"}} /></span></button>
                </div>
            </header>

            <section className="quick-actions">
                <Link to="/projects/new" className="action-card primary">
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

            <section className="recent-activity">
                <h3>Недавняя активность</h3>
                
                {loading ? (
                    <p style={{ textAlign: 'center', color: '#888' }}>Загрузка истории...</p>
                ) : (
                    <div className="activity-list">
                        {activities.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#888' }}>Активности пока нет.</p>
                        ) : (
                            activities.map(item => (
                                <div key={item.id} className="activity-item">
                                    <div className="activity-dot"></div>
                                    <div className="activity-content">
                                        <p>{item.description || item.text}</p>
                                        <span className="activity-time">
                                            {item.time || getTimeAgo(item.created_at)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </section>
        </div>
    );
}

export default Home;