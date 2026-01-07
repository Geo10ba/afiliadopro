import { Menu, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import './MobileHeader.css';

import NotificationsPopover from '../notifications/NotificationsPopover';

interface MobileHeaderProps {
    onMenuClick: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuClick }) => {
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    useEffect(() => {
        fetchAvatar();
    }, []);

    const fetchAvatar = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).single();
                if (data?.avatar_url) {
                    const { data: imageData } = await supabase.storage.from('avatars').download(data.avatar_url);
                    if (imageData) {
                        setAvatarUrl(URL.createObjectURL(imageData));
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching avatar:', error);
        }
    };

    return (
        <header className="mobile-header glass-header">
            <button className="menu-button" onClick={onMenuClick}>
                <Menu size={24} color="var(--color-text-primary)" />
            </button>
            <div className="mobile-logo">
                <img src="/logo.png" alt="Afiliado Pro" style={{ height: '40px' }} />
            </div>
            <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {avatarUrl && (
                    <img
                        src={avatarUrl}
                        alt="Avatar"
                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--color-gold)' }}
                    />
                )}
                <NotificationsPopover />
            </div>
        </header>
    );
};

export default MobileHeader;
