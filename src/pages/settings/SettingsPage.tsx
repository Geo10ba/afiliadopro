import React, { useState, useEffect } from 'react';
import { User, Lock, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import AvatarUpload from '../../components/settings/AvatarUpload';
import './SettingsPage.css';

const SettingsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Profile State
    const [profile, setProfile] = useState({
        full_name: '',
        email: '',
        phone: '',
        avatar_url: ''
    });

    // Password State
    const [passwords, setPasswords] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            setProfile({
                full_name: data.full_name || '',
                email: user.email || '',
                phone: data.phone || '',
                avatar_url: data.avatar_url || ''
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: profile.full_name,
                    avatar_url: profile.avatar_url,
                    updated_at: new Date()
                })
                .eq('id', user.id);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Erro ao atualizar perfil: ' + error.message });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        if (passwords.newPassword !== passwords.confirmPassword) {
            setMessage({ type: 'error', text: 'As senhas não coincidem.' });
            setLoading(false);
            return;
        }

        if (passwords.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres.' });
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: passwords.newPassword
            });

            if (error) throw error;

            setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
            setPasswords({ newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Erro ao alterar senha: ' + error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="settings-page">
            <div className="settings-header">
                <h1 className="text-gold">Configurações</h1>
                <p>Gerencie seus dados e segurança</p>
            </div>

            <div className="settings-container card-premium">
                <div className="settings-tabs">
                    <button
                        className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        <User size={18} /> Perfil
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
                        onClick={() => setActiveTab('security')}
                    >
                        <Lock size={18} /> Segurança
                    </button>
                </div>

                <div className="settings-content">
                    {message && (
                        <div className={`message-alert ${message.type}`}>
                            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                            {message.text}
                        </div>
                    )}

                    {activeTab === 'profile' ? (
                        <div className="profile-section">
                            <AvatarUpload
                                url={profile.avatar_url}
                                onUpload={(url) => {
                                    setProfile({ ...profile, avatar_url: url });
                                    // Trigger immediate save for avatar
                                    supabase.from('profiles').update({ avatar_url: url }).eq('id', supabase.auth.getUser().then(({ data }) => data.user?.id));
                                }}
                            />
                            <form onSubmit={handleProfileUpdate} className="settings-form">
                                <div className="form-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        value={profile.email}
                                        disabled
                                        className="input-field disabled"
                                    />
                                    <span className="help-text">O email não pode ser alterado.</span>
                                </div>

                                <div className="form-group">
                                    <label>Nome Completo</label>
                                    <input
                                        type="text"
                                        value={profile.full_name}
                                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                        className="input-field"
                                        placeholder="Seu nome completo"
                                    />
                                </div>

                                {/* 
                            <div className="form-group">
                                <label>Telefone / WhatsApp</label>
                                <input 
                                    type="text" 
                                    value={profile.phone} 
                                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                    className="input-field"
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                            */}

                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? 'Salvando...' : <><Save size={18} /> Salvar Alterações</>}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <form onSubmit={handlePasswordUpdate} className="settings-form">
                            <div className="form-group">
                                <label>Nova Senha</label>
                                <input
                                    type="password"
                                    value={passwords.newPassword}
                                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                    className="input-field"
                                    placeholder="Digite a nova senha"
                                />
                            </div>

                            <div className="form-group">
                                <label>Confirmar Nova Senha</label>
                                <input
                                    type="password"
                                    value={passwords.confirmPassword}
                                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                    className="input-field"
                                    placeholder="Confirme a nova senha"
                                />
                            </div>

                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Alterando...' : <><Lock size={18} /> Alterar Senha</>}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
