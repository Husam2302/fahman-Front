import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { useTranslation } from '../../contexts/TranslationContext';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/button/Button';
import { LogIn, Loader2 } from 'lucide-react';
import './login.css';

const LoginScreen = () => {
    const { t, language } = useTranslation();
    const { login, isLoading, isLoggedIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

  
    useEffect(() => {
        if (!isLoggedIn) {
            setEmail('');
            setPassword('');
            setError('');
        }
    }, [isLoggedIn]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        const result = await login(email, password, rememberMe);

        if (!result.success) {
            setError(result.message);
        }
    };

    return (
        <div dir={language === 'ar' ? 'rtl' : 'ltr'} className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <p className="login-title">{t('login.title')}</p>
                    <p className="login-description">{t('login.description')}</p>
                </div>

                <form onSubmit={handleLogin} className="login-form">
                    <div className="login-form-group">
                        <label htmlFor="email" className="login-label">{t('login.email')}</label>
                        <div className="login-input-wrapper">
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('login.emailPlaceholder')}
                                className="login-input"
                                required
                                disabled={isLoading}
                            />
                            <FileText className="login-icon" />
                        </div>
                    </div>

                    <div className="login-form-group">
                        <label htmlFor="password" className="login-label">{t('login.password')}</label>
                        <div className="login-input-wrapper">
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={t('login.passwordPlaceholder')}
                                className="login-input"
                                required
                                disabled={isLoading}
                            />
                            <LogIn className="login-icon" />
                        </div>
                    </div>

                    <div className="login-remember-me">
                        <input
                            id="rememberMe"
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            disabled={isLoading}
                            className="login-checkbox"
                        />
                        <label htmlFor="rememberMe" className="login-checkbox-label">
                            {t('login.rememberMe')}
                        </label>
                    </div>

                    {error && (
                        <p className="login-error">{error}</p>
                    )}

                    <Button
                        type="submit"
                        disabled={isLoading}
                        loading={isLoading}
                        icon={LogIn}
                        loadingIcon={Loader2}
                    >
                        {isLoading ? t('login.loggingIn') : t('login.loginButton')}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default LoginScreen;
