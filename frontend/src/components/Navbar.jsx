import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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
        <nav style={{ position: "fixed", top: "0", height: "100vh", padding: "0.625rem", color: "white", background: "#1e3a8a", borderBottom: "1px solid #ccc" }}>
            <section style={{ display: "flex", justifyContent: 'space-between', alignItems: 'center' }}>
                <section style={{ display: "flex", gap: "1rem" }}>
                    <Link to="/" style={{  color: "white", textDecoration: "none" }}>Home</Link>
                    <Link to="/dashboard" style={{  color: "white", textDecoration: "none" }}>Dashboard</Link>
                    <Link to="/projects" style={{  color: "white", textDecoration: "none" }}>Projects</Link>
                    <Link to="/tasks" style={{  color: "white", textDecoration: "none" }}>Tasks</Link>
                </section>
                <section>
                    <span style={{ marginRight: "1rem" }}>{user?.username} ({user?.role})</span>
                    <button onClick={handleLogout} style={{ marginLeft: "auto" }}>Logout</button>
                </section>
            </section>
        </nav>
    );
}

export default Navbar;