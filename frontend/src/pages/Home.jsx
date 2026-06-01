import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
    return (
        <div>
            <h1>Project Management App</h1>

            <Link to="/dashboard">Dashboard</Link>
            <Link to="/projects">Projects</Link>
            <Link to="/tasks">Tasks</Link>
        </div>
    );
}

export default Home;