import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface Commission {
    id: string;
    created_at: string;
    amount: number;
    rate: number;
    order_id: string;
    affiliate_id: string;
    profiles: {
        full_name: string;
        email: string;
    };
    orders: {
        amount: number;
        status: string;
    };
}

const AdminCommissionsPage = () => {
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debugStats, setDebugStats] = useState({ orders: 0, referrers: 0 });

    useEffect(() => {
        fetchCommissions();
        fetchDebugStats();
    }, []);

    const fetchDebugStats = async () => {
        const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
        const { count: refCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).not('referred_by', 'is', null);
        setDebugStats({ orders: orderCount || 0, referrers: refCount || 0 });
    };

    const fetchCommissions = async () => {
        try {
            const { data, error } = await supabase
                .from('commissions')
                .select(`
                    *,
                    profiles:affiliate_id (full_name, email),
                    orders:order_id (amount, status)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setCommissions(data as any);
        } catch (error: any) {
            console.error('Error fetching commissions:', error);
            toast.error(error.message || 'Erro ao carregar comissões');
        } finally {
            setLoading(false);
        }
    };

    const filteredCommissions = commissions.filter(comm =>
        comm.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comm.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalCommissions = filteredCommissions.reduce((sum, comm) => sum + Number(comm.amount), 0);

    return (
        <div className="admin-orders-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Relatório de Comissões</h1>
                    <p className="page-subtitle">Acompanhe os ganhos dos seus afiliados.</p>
                </div>
                <div className="header-actions">
                    <div className="search-bar">
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por afiliado..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)', marginBottom: '2rem' }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(40, 167, 69, 0.1)', color: '#28a745' }}>
                        <DollarSign size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Total em Comissões</span>
                        <span className="stat-value">R$ {totalCommissions.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Debug Info Section */}
            <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <h3 style={{ fontSize: '14px', marginBottom: '10px', color: '#aaa' }}>Diagnóstico do Sistema</h3>
                <div style={{ display: 'flex', gap: '20px', fontSize: '13px' }}>
                    <div>
                        <span style={{ color: '#888' }}>Total de Pedidos: </span>
                        <strong style={{ color: debugStats.orders > 0 ? '#28a745' : '#dc3545' }}>{debugStats.orders}</strong>
                    </div>
                    <div>
                        <span style={{ color: '#888' }}>Usuários com Referência: </span>
                        <strong style={{ color: debugStats.referrers > 0 ? '#28a745' : '#dc3545' }}>{debugStats.referrers}</strong>
                    </div>
                </div>
                {debugStats.orders === 0 && (
                    <p style={{ marginTop: '10px', color: '#e0a800', fontSize: '12px' }}>
                        ⚠️ Não há pedidos no sistema. Crie um pedido para gerar comissões.
                    </p>
                )}
            </div>

            <div className="orders-table-container card-premium">
                {loading ? (
                    <div className="loading-state">Carregando comissões...</div>
                ) : (
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Afiliado</th>
                                <th>Valor do Pedido</th>
                                <th>Taxa (%)</th>
                                <th>Comissão</th>
                                <th>Status do Pedido</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCommissions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="empty-state">Nenhuma comissão encontrada.</td>
                                </tr>
                            ) : (
                                filteredCommissions.map(comm => (
                                    <tr key={comm.id}>
                                        <td>{new Date(comm.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <div className="user-cell">
                                                <span>{comm.profiles?.full_name || 'Sem nome'}</span>
                                                <span className="user-email">{comm.profiles?.email}</span>
                                            </div>
                                        </td>
                                        <td>R$ {comm.orders?.amount?.toFixed(2)}</td>
                                        <td>{comm.rate}%</td>
                                        <td style={{ color: '#28a745', fontWeight: 'bold' }}>
                                            R$ {comm.amount.toFixed(2)}
                                        </td>
                                        <td>
                                            <span className={`status-badge status-${comm.orders?.status}`}>
                                                {comm.orders?.status === 'paid' ? 'Pago' : comm.orders?.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AdminCommissionsPage;
