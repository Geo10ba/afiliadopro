import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const useImpersonation = () => {
    const [impersonatedId, setImpersonatedId] = useState<string | null>(null);
    const [isImpersonating, setIsImpersonating] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        checkImpersonation();
    }, []);

    const checkImpersonation = async () => {
        try {
            const storedId = localStorage.getItem('impersonatedUserId');
            if (storedId) {
                // Verify if real user is admin to prevent unauthorized impersonation
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', user.id)
                        .single();

                    if (profile?.role === 'admin') {
                        setImpersonatedId(storedId);
                        setIsImpersonating(true);
                    } else {
                        // If not admin, clear storage
                        localStorage.removeItem('impersonatedUserId');
                    }
                }
            }
        } catch (error) {
            console.error('Error checking impersonation:', error);
        } finally {
            setLoading(false);
        }
    };

    const startImpersonation = (userId: string) => {
        localStorage.setItem('impersonatedUserId', userId);
        setImpersonatedId(userId);
        setIsImpersonating(true);
        toast.success('Acessando escritório do afiliado...');
        // Use window.location.href to force a full page reload and navigation
        // This ensures App.tsx re-runs its role check logic correctly
        window.location.href = '/dashboard';
    };

    const stopImpersonation = () => {
        localStorage.removeItem('impersonatedUserId');
        setImpersonatedId(null);
        setIsImpersonating(false);
        toast.info('Voltando para o painel de administrador...');
        navigate('/admin/users');
        window.location.reload(); // Reload to clear state
    };

    return {
        impersonatedId,
        isImpersonating,
        startImpersonation,
        stopImpersonation,
        loading
    };
};
