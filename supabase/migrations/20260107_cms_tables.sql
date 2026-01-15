-- Create site_settings table (Singleton pattern)
CREATE TABLE IF NOT EXISTS public.site_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1), -- Ensure only one row exists
    hero_title TEXT DEFAULT 'Domine o Mercado Digital com <span class="text-gold">Poder Total</span>',
    hero_subtitle TEXT DEFAULT 'Acesse produtos exclusivos de alta conversão, receba comissões instantâneas e escale suas vendas com nossa tecnologia de ponta.',
    video_url TEXT DEFAULT 'https://www.youtube.com/embed/dQw4w9WgXcQ', -- Placeholder
    cta_link TEXT DEFAULT '/register',
    dropshipping_title TEXT DEFAULT 'Venda sem Estoque / Marketplace',
    dropshipping_text TEXT DEFAULT 'Além de vender diretamente, você pode oferecer nossos produtos em marketplaces (Shopee, Mercado Livre, Amazon). Nós cuidamos de todo o estoque e logística de envio para você.',
    footer_links JSONB DEFAULT '{"facebook": "#", "instagram": "#", "youtube": "#", "terms": "#", "privacy": "#", "support": "#"}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insert default row if not exists
INSERT INTO public.site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on site_settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Policies for site_settings
CREATE POLICY "Public read access for site_settings" ON public.site_settings
    FOR SELECT USING (true);

CREATE POLICY "Admin update access for site_settings" ON public.site_settings
    FOR UPDATE USING (public.is_admin());

-- Create site_assets table for carousel images and banners
CREATE TABLE IF NOT EXISTS public.site_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('financial_result', 'banner', 'product_carousel')),
    url TEXT NOT NULL,
    title TEXT, -- Optional caption
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on site_assets
ALTER TABLE public.site_assets ENABLE ROW LEVEL SECURITY;

-- Policies for site_assets
CREATE POLICY "Public read access for site_assets" ON public.site_assets
    FOR SELECT USING (true);

CREATE POLICY "Admin all access for site_assets" ON public.site_assets
    FOR ALL USING (public.is_admin());

-- Grant permissions
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;

GRANT SELECT ON public.site_assets TO anon, authenticated;
GRANT ALL ON public.site_assets TO service_role;
