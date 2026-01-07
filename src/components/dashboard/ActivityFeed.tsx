import React, { useState, useEffect } from 'react';
import { ShoppingCart, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import './ActivityFeed.css';

interface Activity {
    id: string;
    type: 'order';
    title: string;
    description: string;
    time: string;
    status: string;
    amount: number;
}

const ActivityFeed: React.FC = () => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
            const isAdmin = profile?.role === 'admin';

            // Check for impersonation
            const impersonatedId = localStorage.getItem('impersonatedUserId');
            const effectiveUserId = (isAdmin && impersonatedId) ? impersonatedId : user.id;
            const isImpersonating = !!(isAdmin && impersonatedId);

            let formattedActivities: Activity[] = [];

            if (isAdmin && !isImpersonating) {
                // Admin sees ORDERS
                const { data: orders, error } = await supabase
                    .from('orders')
                    .select(`
                        *,
                        profiles:user_id (email),
                        products:product_id (name)
                    `)
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (error) throw error;

                formattedActivities = orders?.map(order => {
                    const productName = order.products?.name || 'Produto Desconhecido';
                    const userEmail = order.profiles?.email || 'Usuário Desconhecido';

                    return {
                        id: order.id,
                        type: 'order',
                        title: `Pedido de ${userEmail}`,
                        description: `Produto: ${productName}`,
                        time: new Date(order.created_at).toLocaleDateString(),
                        status: order.status,
                        amount: order.amount
                    };
                }) || [];
            } else {
                // Affiliate (or Admin impersonating) sees COMMISSIONS
                const { data: commissions, error } = await supabase
                    .from('commissions')
                    .select('*')
                    .eq('affiliate_id', effectiveUserId) // Use effective ID
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (error) throw error;

                formattedActivities = commissions?.map(comm => {
                    return {
                        id: comm.id,
                        type: 'order', // Reusing 'order' type for icon styling or add 'commission' type
                        title: 'Comissão Recebida',
                        description: `Nível ${comm.level} - ${comm.percentage}%`,
                        time: new Date(comm.created_at).toLocaleDateString(),
                        status: comm.status, // pending, available, paid
                        amount: comm.amount
                    };
                }) || [];
            }

            setActivities(formattedActivities);

        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setLoading(false);
        }
    };

    const translateStatus = (status: string) => {
        const map: { [key: string]: string } = {
            pending: 'Pendente',
            approved: 'Aprovado',
            rejected: 'Rejeitado',
            paid: 'Pago'
        };
        return map[status] || status;
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved':
            case 'paid':
                return <CheckCircle size={16} color="#28a745" />;
            case 'rejected':
                return <XCircle size={16} color="#dc3545" />;
            default:
                return <Clock size={16} color="#ffc107" />;
        }
    };

    return (
        <div className="card-premium activity-feed-container">
            <div className="feed-header">
                <h2 className="text-gold">Atividades Recentes</h2>
            </div>

            <div className="feed-list">
                {loading ? (
                    <div className="loading-state">Carregando atividades...</div>
                ) : activities.length === 0 ? (
                    <div className="empty-state">
                        <p>Nenhuma atividade recente.</p>
                    </div>
                ) : (
                    activities.map(activity => (
                        <div key={activity.id} className="feed-item">
                            <div className={`feed-icon ${activity.status}`}>
                                <ShoppingCart size={18} />
                            </div>
                            <div className="feed-content">
                                <div className="feed-title-row">
                                    <span className="feed-title">{activity.title}</span>
                                    <span className="feed-amount">R$ {activity.amount.toFixed(2)}</span>
                                </div>
                                <div className="feed-meta">
                                    <span className="feed-desc">{activity.description}</span>
                                    <span className="feed-time">
                                        {getStatusIcon(activity.status)}
                                        {activity.time}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ActivityFeed;
