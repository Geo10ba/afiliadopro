import React, { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './ForgotPasswordPage.css';

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`, // We might need a reset password page later, but usually supabase handles the link logic or sends a magic link.
                // Actually, for a simple implementation, just sending the email is enough. The user clicks and is logged in (magic link) or redirected to a password reset form.
                // For now, let's assume standard magic link behavior.
            });

            if (error) throw error;

            setMessage({ type: 'success', text: 'Email de recuperação enviado! Verifique sua caixa de entrada.' });
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Erro ao enviar email: ' + error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-password-container">
            <div className="forgot-password-card card-premium">
                <div className="forgot-header">
                    <img src="/logo.png" alt="Afiliado Pro" style={{ height: '50px', marginBottom: '1rem' }} />
                    <h2>Recuperar Senha</h2>
                    <p>Digite seu email para receber as instruções.</p>
                </div>

                {message && (
                    <div className={`message-alert ${message.type}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="forgot-form">
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

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Enviando...' : 'Enviar Email'}
                    </button>

                    <div className="forgot-footer">
                        <Link to="/login" className="back-link">
                            <ArrowLeft size={16} /> Voltar para Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
