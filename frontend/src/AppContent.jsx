import React from 'react';
import { Route, Routes, Navigate, Link } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

import Home from './pages/Home';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './components/ProjectDetail';
import Tasks from './pages/Tasks';
import TaskDetail from './components/TaskDetail';

const PrivateRoute = ({ children }) => {
    const { token } = useAuth();
    return token ? children : <Navigate to="/login" />;
};

function AppContent() {
    const { token } = useAuth();

    return (
        <>
            {token && <Navbar />}

            <Routes>
                <Route path='/login' element={<Login />} />
                <Route path='/register' element={<Register />} />

                <Route
                    path='/'
                    element={
                        <PrivateRoute>
                            <Home />
                        </PrivateRoute>
                    }
                />

                <Route
                    path='/dashboard'
                    element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    }
                />

                <Route
                    path='/projects'
                    element={
                        <PrivateRoute>
                            <Projects />
                        </PrivateRoute>
                    }
                />

                <Route
                    path='/tasks'
                    element={
                        <PrivateRoute>
                            <Tasks />
                        </PrivateRoute>
                    }
                />

                <Route path='*' element={<Navigate to='/login' />} />
            </Routes>
        </>
    );
}

export default AppContent;