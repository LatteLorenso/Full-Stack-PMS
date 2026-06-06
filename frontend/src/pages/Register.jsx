import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../Reg-Log.css';

function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const { register, token } = useAuth();
    const navigate = useNavigate();

    if (token) {
        return <Link to='/home' replace />
    }

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await register(email, password, username);
        navigate('/pages/Home');
      } catch (err) {
        setError(err.response?.data?.error || "Ошибка регистрации");
      }
    };

    return (
        <section className="container-register">
            <section className="register-window">
                <h1 className="header-text">Регистрация в системе</h1>
    
                {error && <p>{error}</p>}
    
                <form onSubmit={handleSubmit} className="form">
                    <div className="field">
                        <label>Эл.почта</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
    
                    <div className="field">
                        <label>Имя пользователя</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="input-field"
                            required
                        />
                    </div>
    
                    <div className="container-btn-submit">
                        <button type="submit">Зарегистрироваться</button>
                    </div>
                </form>

                <div className="text-hint">
                    <p>
                        Есть аккаунт? <Link to="/login">Войти в систему</Link>
                    </p>
                </div>
            </section>
        </section>
    );
}

export default Register;