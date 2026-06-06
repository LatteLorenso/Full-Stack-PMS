import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Projects from '../pages/Projects';
import NotificationBell from './NotificationBell';
import './NotificationBell.css';

function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    useEffect(() => {
        console.log("Рендер");
    });

    return (
        <nav>
            <section className="container-nav">
                <section className="navLinks">
                    <Link to="/home" className="links-home">Home</Link>
                    <Link to="/dashboard" className="links-dashboard">Dashboard</Link>
                    <Link to="/projects" className="links-projects">Projects</Link>
                    <Link to="/tasks" className="links-tasks">Tasks</Link>
                </section>
                <section className="container-user">
                    <div className="notification-btn">
                        <NotificationBell />
                    </div>
                    <span>{user?.username} ({user?.role})</span>
                    <button onClick={handleLogout} className="btn-logout">Logout</button>
                </section>
            </section>
        </nav>
    );
}

export default Navbar;