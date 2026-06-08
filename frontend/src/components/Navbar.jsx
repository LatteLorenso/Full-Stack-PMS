import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Projects from '../pages/Projects';
import NotificationBell from './NotificationBell';
import './NotificationBell.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars as faBars } from '@fortawesome/free-solid-svg-icons';

function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    return (
        <nav className="navbar">
            <section className="container-navbar">

                <section className="menu-icon" onClick={toggleMenu}>
                    <FontAwesomeIcon icon={faBars} />
                </section>

                <ul className={isOpen ? "nav-menu active" : "nav menu"}>
                    <li className="nav-item">
                        <Link to="/home" className="links-home" onClick={() => setIsOpen(false)}>Home</Link>
                    </li>
                    <li className="nav-item">
                        <Link to="/dashboard" className="links-dashboard" onClick={() => setIsOpen(false)}>Dashboard</Link>
                    </li>
                    <li className="nav-item">
                        <Link to="/projects" className="links-projects" onClick={() => setIsOpen(false)}>Projects</Link>
                    </li>
                </ul>
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