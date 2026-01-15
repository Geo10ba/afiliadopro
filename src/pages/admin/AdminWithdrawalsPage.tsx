import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Check, X, DollarSign } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import Pagination from '../../components/ui/Pagination';

interface Withdrawal {
    id: string;
    user_id: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected';
    pix_key: string;
    created_at: string;
    profiles: {
        full_name: string;
        email: string;
        balance: number;
    };
}

const AdminWithdrawalsPage: React.FC = () => {
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    useEffect(() => {
        fetchWithdrawals();
    }, []);

    const fetchWithdrawals = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('withdrawals')
                .select(`
                    *,
                    profiles (full_name, email, balance)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setWithdrawals(data || []);
        } catch (error) {
            console.error('Error fetching withdrawals:', error);
            toast.error('Erro ao carregar saques.');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: 'approved' | 'rejected', amount: number, userId: string) => {
        if (!confirm(`Tem certeza que deseja ${newStatus === 'approved' ? 'APROVAR' : 'REJEITAR'} este saque?`)) return;

        try {
            const { error } = await supabase
                .from('withdrawals')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            // If rejected, refund the balance
            if (newStatus === 'rejected') {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('balance')
                    .eq('id', userId)
                    .single();

                if (profile) {
                    await supabase
                        .from('profiles')
                        .update({ balance: profile.balance + amount })
                        .eq('id', userId);
                }
            }

            toast.success(`Saque ${newStatus === 'approved' ? 'aprovado' : 'rejeitado'} com sucesso!`);
            fetchWithdrawals();
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Erro ao atualizar status.');
        }
    };

    const filteredWithdrawals = withdrawals.filter(w => filter === 'all' || w.status === filter);

    return (
        <div className="admin-page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Gerenciar Saques</h1>
                    <p className="page-subtitle">Aprove ou rejeite solicitações de saque.</p>
                </div>
                <div className="filter-group">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as any)}
                        className="status-filter"
                        style={{ padding: '8px', borderRadius: '6px', background: '#222', color: 'white', border: '1px solid #444' }}
                    >
                        <option value="pending">Pendentes</option>
                        <option value="approved">Aprovados</option>
                        <option value="rejected">Rejeitados</option>
                        <option value="all">Todos</option>
                    </select>
                </div>
            </div>

            <div className="table-container card-premium">
                {loading ? (
                    <div className="loading-state">
                        <Skeleton className="h-12 w-full mb-2" />
                        <Skeleton className="h-12 w-full mb-2" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : filteredWithdrawals.length === 0 ? (
                    <div className="empty-state">
                        <DollarSign size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                        <p>Nenhum saque encontrado.</p>
                    </div>
                ) : (
                    <>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Afiliado</th>
                                    <th>Chave PIX</th>
                                    <th>Valor</th>
                                    <th>Status</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredWithdrawals
                                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                    .map(w => (
                                        <tr key={w.id}>
                                            <td>{new Date(w.created_at).toLocaleDateString()} {new Date(w.created_at).toLocaleTimeString()}</td>
                                            <td>
                                                <div>
                                                    <div style={{ fontWeight: 'bold' }}>{w.profiles?.full_name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#aaa' }}>{w.profiles?.email}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <code style={{ background: '#333', padding: '4px 8px', borderRadius: '4px' }}>{w.pix_key}</code>
                                            </td>
                                            <td style={{ fontWeight: 'bold', color: '#28a745' }}>
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(w.amount)}
                                            </td>
                                            <td>
                                                <span className={`badge badge-${w.status === 'approved' ? 'success' : w.status === 'rejected' ? 'danger' : 'warning'}`}>
                                                    {w.status === 'approved' ? 'Pago' : w.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                                                </span>
                                            </td>
                                            <td>
                                                {w.status === 'pending' && (
                                                    <div className="action-buttons">
                                                        <button
                                                            onClick={() => handleStatusUpdate(w.id, 'approved', w.amount, w.user_id)}
                                                            className="btn-icon success"
                                                            title="Aprovar (Pago)"
                                                            style={{ color: '#28a745', background: 'rgba(40, 167, 69, 0.1)', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', marginRight: '5px' }}
                                                        >
                                                            <Check size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(w.id, 'rejected', w.amount, w.user_id)}
                                                            className="btn-icon danger"
                                                            title="Rejeitar (Estornar)"
                                                            style={{ color: '#dc3545', background: 'rgba(220, 53, 69, 0.1)', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={Math.ceil(filteredWithdrawals.length / itemsPerPage)}
                            onPageChange={setCurrentPage}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminWithdrawalsPage;
