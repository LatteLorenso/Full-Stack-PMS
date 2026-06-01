import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        } else {
            delete api.defaults.headers.common['Authorization'];
        }
    }, [token, user]);

    const login = async (username, password) => {
        const res = await api.post('/auth/login', { username, password });
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        return res.data;
    };

    const register = async (email, password, username) => {
        const res = await api.post('/auth/register', { email, password, username });
        return res.data;
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ token, user, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};