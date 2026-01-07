import React, { useState } from 'react';
import { User, Phone, Mail, Lock, Eye, EyeOff, Check } from 'lucide-react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import './RegisterPage.css';
import { supabase } from '../../lib/supabase';
import { maskCpfCnpj, maskPhone } from '../../utils/masks';
import { validateCpfCnpj } from '../../utils/validators';

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [searchParams] = useSearchParams();
    const referralCode = searchParams.get('ref');

    const [formData, setFormData] = useState({
        name: '',
        cpfCnpj: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
        termsAccepted: false
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;

        let finalValue = value;
        if (name === 'cpfCnpj') {
            finalValue = maskCpfCnpj(value);
        } else if (name === 'phone') {
            finalValue = maskPhone(value);
        }

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : finalValue
        }));
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert("As senhas não coincidem!");
            return;
        }
        if (!formData.termsAccepted) {
            alert("Você precisa aceitar os termos!");
            return;
        }

        if (!validateCpfCnpj(formData.cpfCnpj)) {
            alert("CPF ou CNPJ inválido!");
            return;
        }

        try {
            const { data: { user }, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.name,
                        phone: formData.phone,
                        cpf_cnpj: formData.cpfCnpj,
                        role: 'affiliate',
                        referred_by_code: referralCode // Pass referral code to metadata
                    }
                }
            });

            if (error) throw error;

            if (user) {
                alert('Conta criada com sucesso! Faça login para continuar.');
                navigate('/login');
            }
        } catch (error: any) {
            console.error('Error registering:', error);
            alert(error.message || 'Erro ao criar conta.');
        }
    };

    return (
        <div className="register-container">
            <div className="register-card card-premium">
                <div className="register-header">
                    <img src="/logo.png" alt="Afiliado Pro" style={{ height: '60px', marginBottom: '1rem' }} />
                    <p className="register-subtitle">Crie sua conta e comece agora</p>
                    {referralCode && (
                        <div className="referral-badge" style={{
                            background: 'rgba(255, 215, 0, 0.1)',
                            color: '#FFD700',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.9rem',
                            marginTop: '0.5rem',
                            border: '1px solid rgba(255, 215, 0, 0.3)'
                        }}>
                            Você foi indicado! Código: <strong>{referralCode}</strong>
                        </div>
                    )}
                </div>

                <form onSubmit={handleRegister} className="register-form">
                    <div className="form-group">
                        <label htmlFor="name">Nome Completo</label>
                        <div className="input-wrapper">
                            <User className="input-icon" size={20} />
                            <input
                                type="text"
                                id="name"
                                name="name"
                                placeholder="Seu nome completo"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="cpfCnpj">CPF / CNPJ</label>
                        <div className="input-wrapper">
                            <User className="input-icon" size={20} />
                            <input
                                type="text"
                                id="cpfCnpj"
                                name="cpfCnpj"
                                placeholder="000.000.000-00"
                                value={formData.cpfCnpj}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="phone">Telefone</label>
                        <div className="input-wrapper">
                            <Phone className="input-icon" size={20} />
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                placeholder="(00) 00000-0000"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <div className="input-wrapper">
                            <Mail className="input-icon" size={20} />
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="seu@email.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="password">Senha</label>
                            <div className="input-wrapper">
                                <Lock className="input-icon" size={20} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
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

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Repetir Senha</label>
                            <div className="input-wrapper">
                                <Lock className="input-icon" size={20} />
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="form-options">
                        <label className="checkbox-container">
                            <input
                                type="checkbox"
                                name="termsAccepted"
                                checked={formData.termsAccepted}
                                onChange={handleChange}
                                required
                            />
                            <span className="checkmark">
                                <Check size={12} />
                            </span>
                            <span className="checkbox-label">
                                Li e aceito os <a href="#" className="terms-link">Termos de Uso</a>
                            </span>
                        </label>
                    </div>

                    <button type="submit" className="btn-primary">
                        Criar Conta
                    </button>
                </form>

                <div className="register-footer">
                    <p>Já tem uma conta? <Link to="/login">Fazer Login</Link></p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
