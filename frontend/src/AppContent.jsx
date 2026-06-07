import React from 'react';
import { Route, Routes, Navigate, Link } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

import Home from './pages/Home';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import TaskComments from './components/TaskComments';
import TaskFiles from './components/TaskFiles';

const PrivateRoute = ({ children }) => {
    const { token, loading } = useAuth();

    console.log('loading:', loading);
    console.log('token:', token);

    if (loading) return <div>Loading...</div>;

    return token ? children : <Navigate to="/login" />;
};

function AppContent() {
    const { token, loading } = useAuth();

    return (
        <>
            {!loading && token && <Navbar />}

            <Routes>
                <Route path='/login' element={<Login />} />
                <Route path='/register' element={<Register />} />

                <Route
                    path='/home'
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
                    path='/projects/:id/tasks'
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