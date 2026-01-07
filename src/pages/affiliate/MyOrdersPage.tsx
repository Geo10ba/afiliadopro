import React, { useState, useEffect } from 'react';
import { Package, Calendar, Clock, CheckCircle, ExternalLink, AlertCircle, XCircle, Truck, Box } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import './MyOrdersPage.css';

interface Order {
    id: string;
    created_at: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected' | 'shipped' | 'delivered';
    payment_method: string;
    download_link?: string;
    rejection_reason?: string;
    products: {
        name: string;
    };
}

const MyOrdersPage: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyOrders();
    }, []);

    const fetchMyOrders = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Check for impersonation
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
            const isAdmin = profile?.role === 'admin';
            const impersonatedId = localStorage.getItem('impersonatedUserId');
            const effectiveUserId = (isAdmin && impersonatedId) ? impersonatedId : user.id;

            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    products:product_id (
                        name
                    )
                `)
                .eq('user_id', effectiveUserId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="my-orders-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Meus Pedidos</h1>
                    <p className="page-subtitle">Acompanhe o status das suas solicitações.</p>
                </div>
            </div>

            <div className="orders-list card-premium">
                {loading ? (
                    <div className="loading-state">Carregando pedidos...</div>
                ) : orders.length === 0 ? (
                    <div className="empty-state">
                        <Package size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                        <p>Você ainda não fez nenhum pedido.</p>
                    </div>
                ) : (
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Produto</th>
                                <th>Link</th>
                                <th>Valor</th>
                                <th>Pagamento</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order.id}>
                                    <td>
                                        <div className="date-cell">
                                            <Calendar size={14} style={{ marginRight: '5px' }} />
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </div>
                                        <small>{new Date(order.created_at).toLocaleTimeString()}</small>
                                    </td>
                                    <td>{order.products?.name || 'Produto Desconhecido'}</td>
                                    <td>
                                        {order.download_link ? (
                                            <a
                                                href={order.download_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title={order.download_link}
                                                style={{ color: '#4dabf7' }}
                                            >
                                                <ExternalLink size={16} />
                                            </a>
                                        ) : (
                                            <span style={{ color: '#666' }}>-</span>
                                        )}
                                    </td>
                                    <td style={{ fontWeight: 'bold', color: '#FFD700' }}>
                                        R$ {order.amount.toFixed(2)}
                                    </td>
                                    <td>
                                        {order.payment_method === 'invoice' ? 'Faturado' : 'À Vista'}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            <span className={`status-badge ${order.status}`}>
                                                {order.status === 'pending' && <Clock size={12} />}
                                                {order.status === 'approved' && <CheckCircle size={12} />}
                                                {order.status === 'shipped' && <Truck size={12} />}
                                                {order.status === 'delivered' && <Box size={12} />}
                                                {order.status === 'rejected' && <XCircle size={12} />}

                                                {order.status === 'pending' ? 'Pendente' :
                                                    order.status === 'approved' ? 'Aprovado' :
                                                        order.status === 'shipped' ? 'Enviado' :
                                                            order.status === 'delivered' ? 'Entregue' : 'Rejeitado'}
                                            </span>
                                            {order.status === 'rejected' && order.rejection_reason && (
                                                <div className="rejection-reason">
                                                    <AlertCircle size={12} />
                                                    <span>{order.rejection_reason}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default MyOrdersPage;
