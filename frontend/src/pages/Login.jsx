import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../Reg-Log.css';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, token } = useAuth();
    const navigate = useNavigate();

    if (token) {
        return <Link to='/home' replace />
    }

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await login(username, password);
        navigate('/home');
      } catch (err) {
        setError(err.response?.data?.error || "Ошибка входа");
      }
    };

    return (
        <section className="container-log">
            <section className="login-window">
                <h1 className="header-text">Вход в систему</h1>
    
                {error && <p>{error}</p>}
    
                <form onSubmit={handleSubmit} className="form">
                    <div className="field">
                        <label>Логин</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="input-field"
                            required
                        />
                    </div>
    
                    <div className="field">
                        <label>Пароль</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field"
                            required
                        />
                    </div>
    
                    <div className="container-btn-submit">
                        <button type="submit">Войти</button>
                    </div>
                </form>
    
                <div className="text-hint">
                    <p>
                        Нет аккаунта? <Link to="/register">Регистрация в системе</Link>
                    </p>
                </div>
            </section>
        </section>
    );
}

export default Login;