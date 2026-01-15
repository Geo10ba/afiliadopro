import React, { useState, useEffect } from 'react';
import { Save, Layout, Image, Link as LinkIcon, Type, Video } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import './AdminSettingsPage.css';

interface SiteSettings {
    hero_title: string;
    hero_subtitle: string;
    video_url: string;
    cta_link: string;
    dropshipping_title: string;
    dropshipping_text: string;
    footer_links: {
        facebook: string;
        instagram: string;
        youtube: string;
        terms: string;
        privacy: string;
        support: string;
    };
}

const AdminSettingsPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<SiteSettings>({
        hero_title: '',
        hero_subtitle: '',
        video_url: '',
        cta_link: '',
        dropshipping_title: '',
        dropshipping_text: '',
        footer_links: {
            facebook: '',
            instagram: '',
            youtube: '',
            terms: '',
            privacy: '',
            support: ''
        }
    });

    // Assets state
    const [assets, setAssets] = useState<any[]>([]);
    const [newAssetUrl, setNewAssetUrl] = useState('');
    const [newAssetType, setNewAssetType] = useState('financial_result');

    useEffect(() => {
        fetchSettings();
        fetchAssets();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('site_settings')
                .select('*')
                .single();

            if (error) {
                // If error is "Row not found", we might need to insert default
                if (error.code === 'PGRST116') {
                    // Default values will be used from state
                } else {
                    console.error('Error fetching settings:', error);
                    toast.error('Erro ao carregar configurações.');
                }
            } else if (data) {
                setSettings(data);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAssets = async () => {
        const { data } = await supabase
            .from('site_assets')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setAssets(data);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleFooterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({
            ...prev,
            footer_links: {
                ...prev.footer_links,
                [name]: value
            }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('site_settings')
                .upsert({ id: 1, ...settings });

            if (error) throw error;
            toast.success('Configurações salvas com sucesso!');
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Erro ao salvar configurações.');
        } finally {
            setSaving(false);
        }
    };

    const handleAddAsset = async () => {
        if (!newAssetUrl) return;

        try {
            const { error } = await supabase
                .from('site_assets')
                .insert([{ type: newAssetType, url: newAssetUrl }]);

            if (error) throw error;

            toast.success('Imagem adicionada!');
            setNewAssetUrl('');
            fetchAssets();
        } catch (error) {
            toast.error('Erro ao adicionar imagem.');
        }
    };

    const handleDeleteAsset = async (id: string) => {
        try {
            const { error } = await supabase
                .from('site_assets')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Imagem removida!');
            fetchAssets();
        } catch (error) {
            toast.error('Erro ao remover imagem.');
        }
    };

    if (loading) return <div className="p-8">Carregando...</div>;

    return (
        <div className="admin-settings-container">
            <div className="page-header">
                <h1 className="page-title">Configurações do Site</h1>
                <p className="page-subtitle">Gerencie o conteúdo da Landing Page.</p>
            </div>

            <div className="settings-grid">
                {/* Hero Section */}
                <div className="settings-card">
                    <div className="card-header">
                        <Layout className="card-icon" />
                        <h3>Hero & Banner</h3>
                    </div>
                    <div className="form-group">
                        <label>Título Principal (HTML permitido)</label>
                        <input
                            type="text"
                            name="hero_title"
                            value={settings.hero_title}
                            onChange={handleChange}
                            className="form-input"
                        />
                    </div>
                    <div className="form-group">
                        <label>Subtítulo</label>
                        <textarea
                            name="hero_subtitle"
                            value={settings.hero_subtitle}
                            onChange={handleChange}
                            className="form-textarea"
                            rows={3}
                        />
                    </div>
                    <div className="form-group">
                        <label>Link do Botão (CTA)</label>
                        <div className="input-with-icon">
                            <LinkIcon size={16} />
                            <input
                                type="text"
                                name="cta_link"
                                value={settings.cta_link}
                                onChange={handleChange}
                                className="form-input"
                            />
                        </div>
                    </div>
                </div>

                {/* Video Section */}
                <div className="settings-card">
                    <div className="card-header">
                        <Video className="card-icon" />
                        <h3>Vídeo de Apresentação</h3>
                    </div>
                    <div className="form-group">
                        <label>URL do Vídeo (Embed)</label>
                        <input
                            type="text"
                            name="video_url"
                            value={settings.video_url}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="https://www.youtube.com/embed/..."
                        />
                    </div>
                </div>

                {/* Dropshipping Section */}
                <div className="settings-card">
                    <div className="card-header">
                        <Type className="card-icon" />
                        <h3>Seção Dropshipping</h3>
                    </div>
                    <div className="form-group">
                        <label>Título</label>
                        <input
                            type="text"
                            name="dropshipping_title"
                            value={settings.dropshipping_title}
                            onChange={handleChange}
                            className="form-input"
                        />
                    </div>
                    <div className="form-group">
                        <label>Texto Descritivo</label>
                        <textarea
                            name="dropshipping_text"
                            value={settings.dropshipping_text}
                            onChange={handleChange}
                            className="form-textarea"
                            rows={4}
                        />
                    </div>
                </div>

                {/* Footer Links */}
                <div className="settings-card">
                    <div className="card-header">
                        <LinkIcon className="card-icon" />
                        <h3>Links do Rodapé</h3>
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label>Instagram</label>
                            <input
                                type="text"
                                name="instagram"
                                value={settings.footer_links?.instagram || ''}
                                onChange={handleFooterChange}
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label>Facebook</label>
                            <input
                                type="text"
                                name="facebook"
                                value={settings.footer_links?.facebook || ''}
                                onChange={handleFooterChange}
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label>YouTube</label>
                            <input
                                type="text"
                                name="youtube"
                                value={settings.footer_links?.youtube || ''}
                                onChange={handleFooterChange}
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label>Suporte (WhatsApp)</label>
                            <input
                                type="text"
                                name="support"
                                value={settings.footer_links?.support || ''}
                                onChange={handleFooterChange}
                                className="form-input"
                            />
                        </div>
                    </div>
                </div>

                {/* Assets Manager */}
                <div className="settings-card full-width">
                    <div className="card-header">
                        <Image className="card-icon" />
                        <h3>Galeria de Imagens</h3>
                    </div>

                    <div className="add-asset-form">
                        <select
                            value={newAssetType}
                            onChange={(e) => setNewAssetType(e.target.value)}
                            className="form-select"
                        >
                            <option value="financial_result">Resultado Financeiro</option>
                            <option value="banner">Banner</option>
                        </select>
                        <input
                            type="text"
                            value={newAssetUrl}
                            onChange={(e) => setNewAssetUrl(e.target.value)}
                            placeholder="URL da imagem..."
                            className="form-input"
                        />
                        <button onClick={handleAddAsset} className="btn-secondary">Adicionar</button>
                    </div>

                    <div className="assets-grid">
                        {assets.map(asset => (
                            <div key={asset.id} className="asset-item">
                                <img src={asset.url} alt={asset.type} />
                                <div className="asset-info">
                                    <span className="asset-tag">{asset.type === 'financial_result' ? 'Resultado' : 'Banner'}</span>
                                    <button
                                        onClick={() => handleDeleteAsset(asset.id)}
                                        className="btn-delete-icon"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        ))}
                        {assets.length === 0 && <p className="text-muted">Nenhuma imagem adicionada.</p>}
                    </div>
                </div>
            </div>

            <div className="settings-actions">
                <button onClick={handleSave} className="btn-primary" disabled={saving}>
                    <Save size={20} />
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>
        </div>
    );
};

export default AdminSettingsPage;
