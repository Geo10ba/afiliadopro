import React, { useState, useEffect } from 'react';
import { Wallet, TrendingDown, Calendar, DollarSign, FileText, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { Skeleton } from '../../components/ui/Skeleton';
import './AffiliateFinancePage.css';

interface FinanceStats {
    totalDebt: number;
    invoiceLimit: number;
    availableLimit: number;
    invoiceDueDay: number;
}

interface DebtOrder {
    id: string;
    created_at: string;
    amount: number;
    status: string;
    products: { name: string } | null;
}

const AffiliateFinancePage: React.FC = () => {
    const [stats, setStats] = useState<FinanceStats>({
        totalDebt: 0,
        invoiceLimit: 0,
        availableLimit: 0,
        invoiceDueDay: 30
    });
    const [debtOrders, setDebtOrders] = useState<DebtOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFinanceData();
    }, []);

    const fetchFinanceData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Check for impersonation
            const { data: profileCheck } = await supabase.from('profiles').select('role').eq('id', user.id).single();
            const isAdmin = profileCheck?.role === 'admin';
            const impersonatedId = localStorage.getItem('impersonatedUserId');
            const effectiveUserId = (isAdmin && impersonatedId) ? impersonatedId : user.id;

            // Fetch Profile for Limit
            const { data: profile } = await supabase
                .from('profiles')
                .select('invoice_limit, invoice_due_day')
                .eq('id', effectiveUserId)
                .single();

            const invoiceLimit = profile?.invoice_limit || 1000; // Default fallback
            const invoiceDueDay = profile?.invoice_due_day || 30; // Default fallback

            // Fetch Unpaid Invoice Orders
            const { data: orders, error } = await supabase
                .from('orders')
                .select(`
                    id,
                    created_at,
                    amount,
                    status,
                    products (name)
                `)
                .eq('user_id', effectiveUserId)
                .eq('payment_method', 'invoice')
                .neq('status', 'paid') // Only unpaid orders count as debt
                .neq('status', 'rejected') // Rejected orders don't count
                .order('created_at', { ascending: false });

            if (error) throw error;

            const typedOrders = orders as unknown as DebtOrder[];
            const totalDebt = typedOrders.reduce((sum, order) => sum + Number(order.amount), 0);
            const availableLimit = Math.max(0, invoiceLimit - totalDebt);

            setStats({
                totalDebt,
                invoiceLimit,
                availableLimit,
                invoiceDueDay
            });
            setDebtOrders(typedOrders);

        } catch (error) {
            console.error('Error fetching finance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDueDate = (createdAt: string) => {
        const orderDate = new Date(createdAt);
        const dueDay = stats.invoiceDueDay;

        let dueDate = new Date(orderDate.getFullYear(), orderDate.getMonth(), dueDay);

        // If order date is after the due day of the current month, move to next month
        if (orderDate.getDate() > dueDay) {
            dueDate.setMonth(dueDate.getMonth() + 1);
        }

        // Handle months with fewer days (e.g., Feb 30 -> Feb 28/29)
        // If we set date to 30 and month has only 28, JS automatically moves to next month (Mar 1/2)
        // We want to stick to the last day of the intended month
        if (dueDate.getDate() !== dueDay) {
            // It rolled over, so set to day 0 of current month (which is last day of previous month)
            dueDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), 0);
        }

        return dueDate.toLocaleDateString();
    };

    const handlePayInvoice = async (orderId: string) => {
        if (!window.confirm('Deseja realizar o pagamento desta fatura agora?')) {
            return;
        }

        try {
            const { error } = await supabase.rpc('pay_invoice', { order_uuid: orderId });

            if (error) throw error;

            toast.success('Pagamento realizado com sucesso!');
            fetchFinanceData(); // Refresh data
        } catch (error: any) {
            console.error('Error paying invoice:', error);
            toast.error('Erro ao realizar pagamento: ' + error.message);
        }
    };

    return (
        <div className="finance-page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Minha Carteira</h1>
                    <p className="page-subtitle">Gerencie seus débitos e limite de crédito.</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="finance-stats-grid">
                <div className="finance-card card-premium">
                    <div className="card-icon debt">
                        <TrendingDown size={24} />
                    </div>
                    <div className="card-content">
                        <span className="card-label">Total em Débito</span>
                        {loading ? (
                            <Skeleton className="h-8 w-32" />
                        ) : (
                            <span className="card-value text-danger">R$ {stats.totalDebt.toFixed(2)}</span>
                        )}
                    </div>
                </div>

                <div className="finance-card card-premium">
                    <div className="card-icon limit">
                        <Wallet size={24} />
                    </div>
                    <div className="card-content">
                        <span className="card-label">Limite Disponível</span>
                        {loading ? (
                            <Skeleton className="h-8 w-32" />
                        ) : (
                            <span className="card-value text-success">R$ {stats.availableLimit.toFixed(2)}</span>
                        )}
                        <small className="limit-total">de R$ {stats.invoiceLimit.toFixed(2)}</small>
                    </div>
                </div>
            </div>

            {/* Debt List */}
            <div className="debt-list-section card-premium">
                <div className="section-header">
                    <h2><FileText size={20} className="text-gold" /> Faturas em Aberto</h2>
                </div>

                {loading ? (
                    <div className="loading-state">Carregando faturas...</div>
                ) : debtOrders.length === 0 ? (
                    <div className="empty-state">
                        <DollarSign size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                        <p>Você não possui débitos pendentes. Parabéns!</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="finance-table">
                            <thead>
                                <tr>
                                    <th>Data do Pedido</th>
                                    <th>Produto</th>
                                    <th>Vencimento</th>
                                    <th>Valor</th>
                                    <th>Status</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {debtOrders.map(order => (
                                    <tr key={order.id}>
                                        <td>{new Date(order.created_at).toLocaleDateString()}</td>
                                        <td>{order.products?.name || 'Produto Desconhecido'}</td>
                                        <td>
                                            <div className="due-date">
                                                <Calendar size={14} />
                                                {getDueDate(order.created_at)}
                                            </div>
                                        </td>
                                        <td className="amount-cell">R$ {order.amount.toFixed(2)}</td>
                                        <td>
                                            <span className={`status-badge ${order.status}`}>
                                                {order.status === 'approved' ? 'Aberto' :
                                                    order.status === 'shipped' ? 'Enviado' :
                                                        order.status === 'delivered' ? 'Entregue' : order.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="action-button pay-button"
                                                onClick={() => handlePayInvoice(order.id)}
                                                title="Pagar Agora"
                                                style={{
                                                    background: 'rgba(40, 167, 69, 0.1)',
                                                    color: '#28a745',
                                                    border: '1px solid rgba(40, 167, 69, 0.3)',
                                                    padding: '0.5rem',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem'
                                                }}
                                            >
                                                <CreditCard size={16} />
                                                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Pagar</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AffiliateFinancePage;
