import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Check } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import './LoginPage.css';
import { supabase } from '../../lib/supabase';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);



    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            navigate('/dashboard');
        } catch (error: any) {
            console.error('Error logging in:', error);
            alert(error.message || 'Erro ao fazer login. Verifique suas credenciais.');
        }
    };

    const handleGoogleLogin = () => {
        // TODO: Implement Google auth
        // console.log('Google Login');
    };

    return (
        <div className="login-container">
            <div className="login-card card-premium">
                <div className="login-header">
                    <img src="/logo.png" alt="Afiliado Pro" style={{ height: '80px', marginBottom: '1rem' }} />
                    <p className="login-subtitle">Entre para gerenciar seus negócios</p>
                </div>

                <form onSubmit={handleLogin} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <div className="input-wrapper">
                            <Mail className="input-icon" size={20} />
                            <input
                                type="email"
                                id="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Senha</label>
                        <div className="input-wrapper">
                            <Lock className="input-icon" size={20} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="form-options">
                        <label className="checkbox-container">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            <span className="checkmark">
                                <Check size={12} />
                            </span>
                            <span className="checkbox-label">Lembrar de mim</span>
                        </label>
                        <a href="#" className="forgot-password">Esqueceu a senha?</a>
                    </div>

                    <button type="submit" className="btn-primary">
                        Entrar
                    </button>

                    <div className="divider">
                        <span>ou continue com</span>
                    </div>

                    <button type="button" className="btn-google" onClick={handleGoogleLogin}>
                        <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                            <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Google
                    </button>

                    <div className="register-footer" style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                        <p>Não tem uma conta? <Link to="/register" style={{ color: 'var(--color-text-gold)', textDecoration: 'none' }}>Cadastre-se</Link></p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
