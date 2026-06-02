import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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
        <div className="login-page">
            <h1>Вход в систему</h1>

            {error && <p>{error}</p>}

            <form onSubmit={handleSubmit}>
                <div>
                    <label>Логин</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label>Пароль</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <button type="submit">Войти</button>
                </div>
            </form>

            <p>
                Нет аккаунта? <Link to="/register">Регистрация в системе</Link>
            </p>
        </div>
    );
}

export default Login;