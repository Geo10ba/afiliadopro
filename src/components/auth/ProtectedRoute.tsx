import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
// import { toast } from 'sonner';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const location = useLocation();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                setAuthenticated(false);
                setLoading(false);
                return;
            }

            setAuthenticated(true);

            // If roles are specified, check user role
            if (allowedRoles && allowedRoles.length > 0) {
                // Check for impersonation first
                const impersonatedUserId = localStorage.getItem('impersonatedUserId');

                if (impersonatedUserId) {
                    // If impersonating, we are effectively an affiliate (unless we want to allow impersonating admins, which is rare)
                    // For safety, if impersonating, we generally assume 'affiliate' role context
                    // So if route requires 'admin', and we are impersonating, we deny access
                    if (allowedRoles.includes('admin')) {
                        setIsAuthorized(false);
                    } else {
                        // If route allows affiliate, we are good
                        // But technically we should check the impersonated user's role if we want to be 100% correct
                        // For now, let's assume impersonation = affiliate access only
                        setIsAuthorized(allowedRoles.includes('affiliate'));
                    }
                } else {
                    // Normal role check
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', session.user.id)
                        .single();

                    if (profile && allowedRoles.includes(profile.role)) {
                        setIsAuthorized(true);
                    } else {
                        setIsAuthorized(false);
                    }
                }
            } else {
                // No specific roles required, just auth
                setIsAuthorized(true);
            }

        } catch (error) {
            console.error('Auth check error:', error);
            setAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1a1a1a', color: '#FFD700' }}>Carregando...</div>;
    }

    if (!authenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!isAuthorized) {
        // toast.error('Acesso não autorizado.'); // Optional: show toast
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
