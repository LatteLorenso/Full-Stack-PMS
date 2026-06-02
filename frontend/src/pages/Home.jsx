import React from 'react';
import { Route, Routes, Navigate, Link } from 'react-router-dom';

function Home() {
    return (
        <div class="container-hero">
            <section class="section-hero-text">
                <h1 class="home-text">Project Management App</h1>
                <p>Управляй своими проектами</p>
            </section>
        </div>
    );
}

export default Home;