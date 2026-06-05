import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Projects from '../pages/Projects';
import NotificationBell from './NotificationBell';

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
            <section class="container-nav">
                <section class="navLinks">
                    <Link to="/home" class="links-home">Home</Link>
                    <Link to="/dashboard" class="links-dashboard">Dashboard</Link>
                    <Link to="/projects" class="links-projects">Projects</Link>
                    <Link to="/tasks" class="links-tasks">Tasks</Link>
                </section>
                <section class="container-user">
                    <NotificationBell />
                    <Link to="/profile">Профиль</Link>
                    <span>{user?.username} ({user?.role})</span>
                    <button onClick={handleLogout} class="btn-logout">Logout</button>
                </section>
            </section>
        </nav>
    );
}

export default Navbar;