import React, { useState, useEffect } from 'react';
import { Search, Filter, Check, X, ExternalLink, DollarSign, Undo, Trash2, FileText } from 'lucide-react';
import Pagination from '../../components/ui/Pagination';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import './AdminOrdersPage.css';

interface Order {
    id: string;
    created_at: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected' | 'paid' | 'shipped' | 'delivered';
    payment_method: 'now' | 'invoice';
    quantity: number;
    user_id: string;
    product_id: string;
    download_link?: string;
    rejection_reason?: string;
    profiles?: { email: string; full_name: string };
    products?: { name: string; commission_rate: number };
}

const AdminOrdersPage: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    profiles:user_id (email, full_name),
                    products:product_id (name, commission_rate)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setOrders(data as any);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (orderId: string, newStatus: string) => {
        let rejectionReason = null;

        if (newStatus === 'rejected') {
            rejectionReason = prompt('Por favor, informe o motivo da rejeição:');
            if (rejectionReason === null) return; // Cancelled
            if (rejectionReason.trim() === '') {
                alert('O motivo da rejeição é obrigatório.');
                return;
            }
        }

        try {
            const updateData: any = { status: newStatus };
            if (rejectionReason) {
                updateData.rejection_reason = rejectionReason;
            }

            // Check if we are reverting from 'paid' status
            const currentOrder = orders.find(o => o.id === orderId);
            // console.log('Reverting payment for order:', orderId, 'Current status:', currentOrder?.status, 'New status:', newStatus);

            // Only revert commission if moving AWAY from paid/shipped/delivered to a non-paid status
            const isPaidStatus = (status: string | undefined) => ['paid', 'shipped', 'delivered'].includes(status || '');

            if (isPaidStatus(currentOrder?.status) && !isPaidStatus(newStatus)) {
                // Find associated commission
                const { data: commission, error: commError } = await supabase
                    .from('commissions')
                    .select('*')
                    .eq('order_id', orderId)
                    .single();

                if (commError) {
                    console.error('Error finding commission:', commError);
                    // Don't return here, we might still want to update order status even if commission not found
                }

                // console.log('Found commission to revert:', commission);

                if (commission) {
                    // Deduct from referrer's wallet
                    const { data: referrerProfile } = await supabase
                        .from('profiles')
                        .select('total_earnings, balance')
                        .eq('id', commission.affiliate_id)
                        .single();

                    if (referrerProfile) {
                        const newEarnings = Math.max(0, referrerProfile.total_earnings - commission.amount);
                        const newBalance = Math.max(0, referrerProfile.balance - commission.amount);

                        await supabase
                            .from('profiles')
                            .update({
                                total_earnings: newEarnings,
                                balance: newBalance
                            })
                            .eq('id', commission.affiliate_id);
                    }

                    // Delete the commission record
                    const { error: delError } = await supabase
                        .from('commissions')
                        .delete()
                        .eq('id', commission.id);

                    if (delError) console.error('Error deleting commission:', delError);

                    toast.info(`Pagamento revertido. Comissão de R$ ${commission.amount.toFixed(2)} estornada.`);
                } else {
                    toast.warning('Nenhuma comissão encontrada para estornar.');
                }
            }

            const { error } = await supabase
                .from('orders')
                .update(updateData)
                .eq('id', orderId);

            if (error) throw error;

            // Handle Commission if status is 'paid'
            if (newStatus === 'paid') {
                const order = orders.find(o => o.id === orderId);
                if (order) {
                    // Fetch user's referrer
                    const { data: userData } = await supabase
                        .from('profiles')
                        .select('referred_by')
                        .eq('id', order.user_id)
                        .single();

                    if (userData?.referred_by) {
                        const commissionRate = order.products?.commission_rate || 10;
                        const commissionAmount = order.amount * (commissionRate / 100);

                        // Insert commission
                        const { error: commError } = await supabase
                            .from('commissions')
                            .insert({
                                affiliate_id: userData.referred_by,
                                order_id: order.id,
                                amount: commissionAmount,
                                rate: commissionRate
                            });

                        if (!commError) {
                            // Update referrer's total earnings and balance
                            const { data: referrerProfile } = await supabase
                                .from('profiles')
                                .select('total_earnings, balance')
                                .eq('id', userData.referred_by)
                                .single();

                            const currentEarnings = referrerProfile?.total_earnings || 0;
                            const currentBalance = referrerProfile?.balance || 0;

                            await supabase
                                .from('profiles')
                                .update({
                                    total_earnings: currentEarnings + commissionAmount,
                                    balance: currentBalance + commissionAmount
                                })
                                .eq('id', userData.referred_by);

                            toast.success(`Comissão de R$ ${commissionAmount.toFixed(2)} gerada!`);
                        } else {
                            console.error('Error creating commission:', commError);
                            toast.error(`Erro ao criar comissão: ${commError.message}`);
                        }
                    } else {
                        toast.warning('Este usuário não tem um afiliado vinculado (referred_by é null). Nenhuma comissão gerada.');
                    }
                }
            }

            // Create Notification
            const order = orders.find(o => o.id === orderId);
            if (order) {
                let title = '';
                let message = '';
                let type = 'info';

                if (newStatus === 'approved' || newStatus === 'paid') {
                    title = 'Pedido Aprovado! 🎉';
                    message = `Seu pedido do produto "${order.products?.name}" foi aprovado.`;
                    type = 'success';
                } else if (newStatus === 'rejected') {
                    title = 'Pedido Rejeitado ⚠️';
                    message = `Seu pedido do produto "${order.products?.name}" foi rejeitado. Motivo: ${rejectionReason}`;
                    type = 'error';
                } else if (newStatus === 'rejected') {
                    title = 'Pedido Rejeitado ⚠️';
                    message = `Seu pedido do produto "${order.products?.name}" foi rejeitado. Motivo: ${rejectionReason}`;
                    type = 'error';
                } else if (newStatus === 'shipped') {
                    title = 'Pedido Enviado! 🚚';
                    message = `Seu pedido do produto "${order.products?.name}" foi enviado.`;
                    type = 'success';
                } else if (newStatus === 'delivered') {
                    title = 'Pedido Entregue! 📦';
                    message = `Seu pedido do produto "${order.products?.name}" foi entregue.`;
                    type = 'success';
                }

                if (title) {
                    await supabase.from('notifications').insert({
                        user_id: order.user_id,
                        title,
                        message,
                        type
                    });
                }
            }

            // Optimistic update
            setOrders(orders.map(order =>
                order.id === orderId ? { ...order, status: newStatus as any, rejection_reason: rejectionReason || undefined } : order
            ));
        } catch (error: any) {
            console.error('Error updating status:', error);
            alert(`Erro ao atualizar status do pedido: ${error.message || error}`);
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        const matchesSearch =
            (order.products?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (order.profiles?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (order.profiles?.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            order.id.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': return <span className="badge badge-success">Aprovado</span>;
            case 'paid': return <span className="badge badge-success">Pago</span>;
            case 'shipped': return <span className="badge badge-info" style={{ background: 'rgba(23, 162, 184, 0.2)', color: '#17a2b8', border: '1px solid rgba(23, 162, 184, 0.3)' }}>Enviado</span>;
            case 'delivered': return <span className="badge badge-success" style={{ background: 'rgba(40, 167, 69, 0.2)', color: '#28a745', border: '1px solid rgba(40, 167, 69, 0.3)' }}>Entregue</span>;
            case 'rejected': return <span className="badge badge-danger">Rejeitado</span>;
            default: return <span className="badge badge-warning">Pendente</span>;
        }
    };

    const getPaymentBadge = (method: string) => {
        return method === 'invoice'
            ? <span className="badge badge-info"><FileText size={12} /> Faturado</span>
            : <span className="badge badge-primary"><DollarSign size={12} /> À Vista</span>;
    };

    const handleDeleteOrder = async (orderId: string) => {
        if (!window.confirm('Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita e o pedido sumirá do painel do afiliado.')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('orders')
                .delete()
                .eq('id', orderId);

            if (error) throw error;

            setOrders(orders.filter(order => order.id !== orderId));
        } catch (error) {
            console.error('Error deleting order:', error);
            alert('Erro ao excluir pedido.');
        }
    };

    return (
        <div className="admin-orders-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Gerenciar Pedidos</h1>
                    <p className="page-subtitle">Visualize e gerencie todos os pedidos da plataforma.</p>
                </div>
                <div className="header-actions" style={{ display: 'flex', gap: '10px' }}>
                    <div className="search-bar">
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por cliente, produto ou ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="filter-group">
                        <Filter size={20} className="filter-icon" style={{ display: 'none' }} />
                        <select
                            className="status-filter"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{
                                padding: '0.5rem',
                                borderRadius: '8px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: 'white'
                            }}
                        >
                            <option value="all">Todos os Status</option>
                            <option value="pending">Pendentes</option>
                            <option value="approved">Aprovados</option>
                            <option value="paid">Pagos</option>
                            <option value="shipped">Enviados</option>
                            <option value="delivered">Entregues</option>
                            <option value="rejected">Rejeitados</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="orders-table-container card-premium">
                {loading ? (
                    <div className="loading-state">Carregando pedidos...</div>
                ) : (
                    <>
                        <table className="orders-table">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Cliente</th>
                                    <th>Produto</th>
                                    <th>Valor</th>
                                    <th>Status</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="empty-state">Nenhum pedido encontrado.</td>
                                    </tr>
                                ) : (
                                    filteredOrders
                                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                        .map(order => (
                                            <tr key={order.id}>
                                                <td>{new Date(order.created_at).toLocaleDateString()}</td>
                                                <td>
                                                    <div className="user-cell">
                                                        <span>{order.profiles?.full_name || 'Sem nome'}</span>
                                                        <span className="user-email">{order.profiles?.email}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="product-cell">
                                                        <span className="product-name">{order.products?.name || 'Produto Removido'}</span>
                                                        <span className="product-qty">x{order.quantity}</span>
                                                    </div>
                                                </td>
                                                <td className="amount-cell">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.amount)}
                                                    <div className="payment-method-badge">
                                                        {getPaymentBadge(order.payment_method)}
                                                    </div>
                                                </td>
                                                <td>{getStatusBadge(order.status)}</td>
                                                <td className="actions-cell">
                                                    <div style={{ display: 'flex', gap: '5px' }}>
                                                        {order.status === 'pending' && (
                                                            <>
                                                                <button
                                                                    className="btn-icon btn-approve"
                                                                    title="Aprovar"
                                                                    onClick={() => handleStatusUpdate(order.id, order.payment_method === 'invoice' ? 'approved' : 'paid')}
                                                                >
                                                                    <Check size={18} />
                                                                </button>
                                                                <button
                                                                    className="btn-icon btn-reject"
                                                                    title="Rejeitar"
                                                                    onClick={() => handleStatusUpdate(order.id, 'rejected')}
                                                                >
                                                                    <X size={18} />
                                                                </button>
                                                            </>

                                                        )}
                                                        {(order.status === 'approved' || order.status === 'shipped' || order.status === 'delivered') && (
                                                            <button
                                                                className="btn-icon"
                                                                title="Marcar como Pago"
                                                                onClick={() => handleStatusUpdate(order.id, 'paid')}
                                                                style={{ color: '#28a745', background: 'rgba(40, 167, 69, 0.1)', border: '1px solid rgba(40, 167, 69, 0.3)' }}
                                                            >
                                                                <DollarSign size={18} />
                                                            </button>
                                                        )}
                                                        {order.status === 'paid' && (
                                                            <button
                                                                className="btn-icon"
                                                                title="Estornar Pagamento"
                                                                onClick={() => {
                                                                    if (window.confirm('Tem certeza? Isso irá estornar a comissão do afiliado.')) {
                                                                        handleStatusUpdate(order.id, 'approved');
                                                                    }
                                                                }}
                                                                style={{ color: '#e03131', background: 'rgba(224, 49, 49, 0.1)', border: '1px solid rgba(224, 49, 49, 0.3)' }}
                                                            >
                                                                <Undo size={18} />
                                                            </button>
                                                        )}
                                                        {(order.status === 'approved' || order.status === 'paid') && (
                                                            <button
                                                                className="btn-icon"
                                                                title="Marcar como Enviado"
                                                                onClick={() => handleStatusUpdate(order.id, 'shipped')}
                                                                style={{ color: '#17a2b8', background: 'rgba(23, 162, 184, 0.1)', border: '1px solid rgba(23, 162, 184, 0.3)' }}
                                                            >
                                                                <ExternalLink size={18} />
                                                            </button>
                                                        )}
                                                        {order.status === 'shipped' && (
                                                            <button
                                                                className="btn-icon"
                                                                title="Marcar como Entregue"
                                                                onClick={() => handleStatusUpdate(order.id, 'delivered')}
                                                                style={{ color: '#28a745', background: 'rgba(40, 167, 69, 0.1)', border: '1px solid rgba(40, 167, 69, 0.3)' }}
                                                            >
                                                                <Check size={18} />
                                                            </button>
                                                        )}
                                                        <button
                                                            className="btn-icon btn-delete"
                                                            title="Excluir Pedido"
                                                            onClick={() => handleDeleteOrder(order.id)}
                                                            style={{ color: '#dc3545', background: 'rgba(220, 53, 69, 0.1)', border: '1px solid rgba(220, 53, 69, 0.3)' }}
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                )}
                            </tbody>
                        </table>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={Math.ceil(filteredOrders.length / itemsPerPage)}
                            onPageChange={setCurrentPage}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminOrdersPage;
