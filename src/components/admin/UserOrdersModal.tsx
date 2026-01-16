import React, { useState, useEffect } from 'react';
import { X, Package, Calendar, ExternalLink, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import './UserOrdersModal.css';

interface Order {
    id: string;
    created_at: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected' | 'paid' | 'shipped' | 'delivered';
    payment_method: string;
    download_link?: string;
    products: {
        name: string;
    };
}

interface UserOrdersModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userName: string;
}

const UserOrdersModal: React.FC<UserOrdersModalProps> = ({ isOpen, onClose, userId, userName }) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && userId) {
            fetchUserOrders();
        }
    }, [isOpen, userId]);

    const fetchUserOrders = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    products:product_id (
                        name
                    )
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching user orders:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const pendingTotal = orders
        .filter(o => o.status === 'pending')
        .reduce((sum, o) => sum + Number(o.amount), 0);

    const approvedTotal = orders
        .filter(o => ['approved', 'paid', 'shipped', 'delivered'].includes(o.status))
        .reduce((sum, o) => sum + Number(o.amount), 0);

    return (
        <div className="modal-overlay">
            <div className="modal-content card-premium user-orders-modal">
                <button className="modal-close" onClick={onClose}>
                    <X size={24} />
                </button>

                <div className="modal-header">
                    <h2>Pedidos de {userName}</h2>
                    <p className="product-name">Histórico completo de transações</p>
                </div>

                <div className="modal-body">
                    {loading ? (
                        <div className="loading-state">Carregando pedidos...</div>
                    ) : (
                        <>
                            <div className="orders-summary-cards">
                                <div className="summary-card pending">
                                    <h3>Total Pendente</h3>
                                    <div className="value">R$ {pendingTotal.toFixed(2)}</div>
                                    <small>{orders.filter(o => o.status === 'pending').length} pedidos</small>
                                </div>
                                <div className="summary-card approved">
                                    <h3>Total Aprovado</h3>
                                    <div className="value">R$ {approvedTotal.toFixed(2)}</div>
                                    <small>{orders.filter(o => ['approved', 'paid', 'shipped', 'delivered'].includes(o.status)).length} pedidos</small>
                                </div>
                            </div>

                            <div className="orders-list-section">
                                <h3><Package size={18} /> Histórico de Pedidos</h3>
                                {orders.length === 0 ? (
                                    <p className="empty-text">Nenhum pedido encontrado para este usuário.</p>
                                ) : (
                                    <table className="user-orders-table">
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
                                                        <span className={`status-badge ${order.status}`}>
                                                            {order.status === 'pending' && <Clock size={12} style={{ marginRight: '4px' }} />}
                                                            {(order.status === 'approved' || order.status === 'paid' || order.status === 'shipped' || order.status === 'delivered') && <CheckCircle size={12} style={{ marginRight: '4px' }} />}

                                                            {(() => {
                                                                switch (order.status) {
                                                                    case 'pending': return 'Pendente';
                                                                    case 'approved': return 'Aprovado';
                                                                    case 'paid': return 'Pago';
                                                                    case 'shipped': return 'Enviado';
                                                                    case 'delivered': return 'Entregue';
                                                                    case 'rejected': return 'Rejeitado';
                                                                    default: return order.status;
                                                                }
                                                            })()}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserOrdersModal;
