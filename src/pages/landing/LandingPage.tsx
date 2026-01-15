import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, DollarSign, ArrowRight, Star, Zap, Globe, CheckCircle, Package } from 'lucide-react';
import './LandingPage.css';
import { supabase } from '../../lib/supabase';

const LandingPage: React.FC = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [settings, setSettings] = useState<any>(null);
    const [financialResults, setFinancialResults] = useState<any[]>([]);

    useEffect(() => {
        fetchFeaturedProducts();
        fetchSiteSettings();
        fetchFinancialResults();
    }, []);

    const fetchSiteSettings = async () => {
        const { data } = await supabase.from('site_settings').select('*').single();
        if (data) setSettings(data);
    };

    const fetchFinancialResults = async () => {
        const { data } = await supabase
            .from('site_assets')
            .select('*')
            .eq('type', 'financial_result')
            .order('created_at', { ascending: false });
        if (data) setFinancialResults(data);
    };

    const fetchFeaturedProducts = async () => {
        const { data } = await supabase
            .from('products')
            .select('*')
            .limit(8);

        if (data) setProducts(data);
    };

    // Default values if settings not loaded yet
    const heroTitle = settings?.hero_title || 'Domine o Mercado Digital com <span class="text-gold">Poder Total</span>';
    const heroSubtitle = settings?.hero_subtitle || 'Acesse produtos exclusivos de alta conversão, receba comissões instantâneas e escale suas vendas com nossa tecnologia de ponta.';
    const videoUrl = settings?.video_url || '';
    const ctaLink = settings?.cta_link || '/register';
    const dropshippingTitle = settings?.dropshipping_title || 'Venda sem Estoque / Marketplace';
    const dropshippingText = settings?.dropshipping_text || 'Além de vender diretamente, você pode oferecer nossos produtos em marketplaces (Shopee, Mercado Livre, Amazon). Nós cuidamos de todo o estoque e logística de envio para você.';
    const footerLinks = settings?.footer_links || {};

    return (
        <div className="landing-container">
            {/* Navigation */}
            <nav className="landing-nav">
                <div className="nav-logo">
                    <img src="/logo.png" alt="Afiliado Pro" />
                </div>
                <div className="nav-links">
                    <Link to="/login" className="btn-login">Entrar</Link>
                    <Link to={ctaLink} className="btn-register">Começar Agora</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="hero-section">
                <div className="hero-grid">
                    <div className="hero-content">
                        <span className="hero-badge">🚀 Plataforma #1 para Afiliados</span>
                        <h1 className="hero-title" dangerouslySetInnerHTML={{ __html: heroTitle }}></h1>
                        <p className="hero-subtitle">{heroSubtitle}</p>
                        <div className="hero-actions">
                            <Link to={ctaLink} className="btn-hero-primary">
                                Criar Conta Grátis <ArrowRight size={20} />
                            </Link>
                            <a href="#video" className="btn-hero-secondary">
                                <Play size={20} fill="currentColor" /> Ver Demo
                            </a>
                        </div>
                    </div>

                    <div className="hero-visual">
                        <div className="hero-card-mockup">
                            {/* Abstract UI Mockup */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                                <div style={{ fontWeight: 'bold', color: '#fff' }}>Painel de Controle</div>
                                <div style={{ color: '#4ade80' }}>● Online</div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#888' }}>Vendas Hoje</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>R$ 1.250,00</div>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#888' }}>Comissões</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#FFD700' }}>R$ 625,00</div>
                                </div>
                            </div>
                            <div style={{ height: '100px', background: 'linear-gradient(90deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.05) 100%)', borderRadius: '12px', display: 'flex', alignItems: 'flex-end', padding: '10px', gap: '5px' }}>
                                {[40, 60, 45, 70, 50, 80, 65, 90].map((h, i) => (
                                    <div key={i} style={{ flex: 1, height: `${h}%`, background: '#FFD700', borderRadius: '4px', opacity: 0.8 }}></div>
                                ))}
                            </div>
                        </div>

                        {/* Floating Stat */}
                        <div className="hero-stat-floating">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ background: '#4ade80', padding: '8px', borderRadius: '50%' }}>
                                    <CheckCircle size={16} color="#000" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: '#ccc' }}>Nova Venda</div>
                                    <div style={{ fontWeight: 'bold', color: '#fff' }}>+ R$ 197,00</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Stats Strip */}
            <div className="stats-strip">
                <div className="stat-item">
                    <span className="stat-number text-gold">50%</span>
                    <span className="stat-label">Comissão Média</span>
                </div>
                <div className="stat-item">
                    <span className="stat-number text-gold">24h</span>
                    <span className="stat-label">Saque Rápido</span>
                </div>
                <div className="stat-item">
                    <span className="stat-number text-gold">10k+</span>
                    <span className="stat-label">Afiliados Ativos</span>
                </div>
            </div>

            {/* Features Section */}
            <section className="features-section">
                <div className="section-header">
                    <h2 className="section-title">Por que escolher a <span className="text-gold">Afiliado Pro</span>?</h2>
                    <p className="section-subtitle">Ferramentas profissionais projetadas para maximizar seus resultados.</p>
                </div>

                <div className="features-grid">
                    <div className="feature-card glass-card">
                        <div className="feature-icon-wrapper">
                            <DollarSign size={32} />
                        </div>
                        <h3 className="feature-title">Comissões Agressivas</h3>
                        <p className="feature-desc">
                            Ganhe até 80% de comissão em lançamentos exclusivos. Nosso sistema de tracking é infalível.
                        </p>
                    </div>
                    <div className="feature-card glass-card">
                        <div className="feature-icon-wrapper">
                            <Zap size={32} />
                        </div>
                        <h3 className="feature-title">Tecnologia de Ponta</h3>
                        <p className="feature-desc">
                            Dashboard em tempo real, pixels de conversão inteligentes e relatórios detalhados para otimização.
                        </p>
                    </div>
                    <div className="feature-card glass-card">
                        <div className="feature-icon-wrapper">
                            <Globe size={32} />
                        </div>
                        <h3 className="feature-title">Produtos Globais</h3>
                        <p className="feature-desc">
                            Venda para o mundo todo com nosso checkout multi-moeda e páginas traduzidas automaticamente.
                        </p>
                    </div>
                    {/* Dropshipping / Marketplace Feature */}
                    <div className="feature-card glass-card" style={{ gridColumn: '1 / -1', background: 'linear-gradient(145deg, rgba(255,215,0,0.05), rgba(0,0,0,0.4))' }}>
                        <div className="feature-icon-wrapper">
                            <Package size={32} />
                        </div>
                        <h3 className="feature-title">{dropshippingTitle}</h3>
                        <p className="feature-desc">
                            {dropshippingText}
                        </p>
                    </div>
                </div>
            </section>

            {/* Financial Results Carousel */}
            {financialResults.length > 0 && (
                <section className="carousel-section" style={{ background: '#0a0a0a' }}>
                    <div className="section-header">
                        <h2 className="section-title">Resultados de <span className="text-gold">Afiliados</span></h2>
                        <p className="section-subtitle">Veja o que nossos parceiros estão conquistando.</p>
                    </div>
                    <div className="carousel-container">
                        <div className="carousel-track">
                            {[...financialResults, ...financialResults].map((result, index) => (
                                <div key={`${result.id}-${index}`} className="product-card-premium" style={{ width: '300px', height: 'auto' }}>
                                    <img
                                        src={result.url}
                                        alt="Resultado Financeiro"
                                        style={{ width: '100%', borderRadius: '12px', border: '1px solid #333' }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Video Section */}
            <section id="video" className="video-section">
                <div className="section-header">
                    <h2 className="section-title">Veja a Plataforma em Ação</h2>
                </div>
                <div className="video-frame">
                    <div className="video-content">
                        {videoUrl ? (
                            <iframe
                                width="100%"
                                height="100%"
                                src={videoUrl}
                                title="Video de Apresentação"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        ) : (
                            <>
                                <div className="play-button-wrapper">
                                    <Play size={32} color="#000" fill="#000" style={{ marginLeft: '4px' }} />
                                </div>
                                <div style={{ position: 'absolute', bottom: '20px', color: '#fff', opacity: 0.7 }}>
                                    Vídeo de Apresentação (Configure no Admin)
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Carousel Section */}
            <section className="carousel-section">
                <div className="section-header">
                    <h2 className="section-title">Marketplace <span className="text-gold">Premium</span></h2>
                    <p className="section-subtitle">Produtos validados prontos para você vender hoje.</p>
                </div>

                <div className="carousel-container">
                    <div className="carousel-track">
                        {[...products, ...products].map((product, index) => (
                            <div key={`${product.id}-${index}`} className="product-card-premium">
                                <div className="product-img-wrapper">
                                    <img
                                        src={product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop'}
                                        alt={product.name}
                                    />
                                    <div className="product-overlay">
                                        <span className="commission-badge">{product.commission_rate}% Comissão</span>
                                    </div>
                                </div>
                                <div className="product-info-premium">
                                    <h4 className="product-title-premium">{product.name}</h4>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span className="product-price-premium">Preço: R$ {product.final_price?.toFixed(2)}</span>
                                        <div style={{ display: 'flex', gap: '2px' }}>
                                            {[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} fill="#FFD700" color="#FFD700" />)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {products.length === 0 && (
                            <div style={{ color: '#666', textAlign: 'center', width: '100%' }}>Carregando produtos...</div>
                        )}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="nav-logo" style={{ marginBottom: '2rem', display: 'inline-block' }}>
                    <img src="/logo.png" alt="Afiliado Pro" style={{ height: '40px', filter: 'grayscale(100%)', opacity: 0.5 }} />
                </div>
                <div className="footer-links">
                    {footerLinks.terms && <Link to={footerLinks.terms} className="footer-link">Termos de Uso</Link>}
                    {footerLinks.privacy && <Link to={footerLinks.privacy} className="footer-link">Privacidade</Link>}
                    {footerLinks.support && <Link to={footerLinks.support} className="footer-link">Suporte</Link>}
                    {footerLinks.instagram && <a href={footerLinks.instagram} target="_blank" rel="noopener noreferrer" className="footer-link">Instagram</a>}
                    {footerLinks.facebook && <a href={footerLinks.facebook} target="_blank" rel="noopener noreferrer" className="footer-link">Facebook</a>}
                </div>
                <p style={{ color: '#444', fontSize: '0.9rem' }}>&copy; {new Date().getFullYear()} Afiliado Pro. Todos os direitos reservados.</p>
            </footer >
        </div >
    );
};

export default LandingPage;
