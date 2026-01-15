import React, { useState, useEffect } from 'react';
import { Users, Copy, Share2, Award, TrendingUp, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { Skeleton } from '../../components/ui/Skeleton';
import Pagination from '../../components/ui/Pagination';
import './NetworkPage.css';

interface Referral {
    id: string;
    full_name: string;
    email: string;
    created_at: string;
    role: string;
}

interface Withdrawal {
    id: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    pix_key: string;
}

const NetworkPage: React.FC = () => {
    const [referralCode, setReferralCode] = useState<string>('');
    const [nickname, setNickname] = useState<string>('');
    const [totalEarnings, setTotalEarnings] = useState<number>(0);
    const [balance, setBalance] = useState<number>(0);
    const [isEditingNickname, setIsEditingNickname] = useState(false);
    const [newNickname, setNewNickname] = useState('');
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [loading, setLoading] = useState(true);
    const [debt, setDebt] = useState<number>(0);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [pixKey, setPixKey] = useState('');
    const [withdrawLoading, setWithdrawLoading] = useState(false);
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [referralsPage, setReferralsPage] = useState(1);
    const [withdrawalsPage, setWithdrawalsPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchNetworkData();
        fetchWithdrawals();
    }, []);

    const fetchWithdrawals = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check for impersonation
        const { data: profileCheck } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        const isAdmin = profileCheck?.role === 'admin';
        const impersonatedId = localStorage.getItem('impersonatedUserId');
        const effectiveUserId = (isAdmin && impersonatedId) ? impersonatedId : user.id;

        const { data } = await supabase
            .from('withdrawals')
            .select('*')
            .eq('user_id', effectiveUserId)
            .order('created_at', { ascending: false });

        if (data) setWithdrawals(data);
    };

    const fetchNetworkData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Check for impersonation
            const { data: profileCheck } = await supabase.from('profiles').select('role').eq('id', user.id).single();
            const isAdmin = profileCheck?.role === 'admin';
            const impersonatedId = localStorage.getItem('impersonatedUserId');
            const effectiveUserId = (isAdmin && impersonatedId) ? impersonatedId : user.id;

            // Fetch profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('referral_code, nickname, total_earnings, balance')
                .eq('id', effectiveUserId)
                .single();

            if (profile) {
                setReferralCode(profile.referral_code || '');
                setNickname(profile.nickname || '');
                setNewNickname(profile.nickname || '');
                setTotalEarnings(profile.total_earnings || 0);
                setBalance(profile.balance || 0);
            }

            // Fetch Debt (Unpaid Invoice Orders)
            const { data: debtOrders } = await supabase
                .from('orders')
                .select('amount')
                .eq('user_id', effectiveUserId)
                .eq('payment_method', 'invoice')
                .neq('status', 'paid')
                .neq('status', 'rejected');

            const totalDebt = debtOrders?.reduce((sum, order) => sum + Number(order.amount), 0) || 0;
            setDebt(totalDebt);

            // Fetch referrals (Level 1)
            const { data: networkData, error } = await supabase
                .from('profiles')
                .select('id, full_name, email, created_at, role')
                .eq('referred_by', effectiveUserId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReferrals(networkData || []);

        } catch (error) {
            console.error('Error fetching network data:', error);
            toast.error('Erro ao carregar dados da rede.');
        } finally {
            setLoading(false);
        }
    };

    const getReferralLink = () => {
        const codeToUse = nickname || referralCode;
        return `${window.location.origin}/register?ref=${codeToUse}`;
    };

    const handleSaveNickname = async () => {
        if (!newNickname.trim()) {
            toast.error('O apelido não pode ser vazio.');
            return;
        }

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ nickname: newNickname.trim() })
                .eq('id', (await supabase.auth.getUser()).data.user?.id);

            if (error) {
                if (error.code === '23505') { // Unique violation
                    toast.error('Este apelido já está em uso. Escolha outro.');
                } else {
                    throw error;
                }
                return;
            }

            setNickname(newNickname.trim());
            setIsEditingNickname(false);
            toast.success('Apelido salvo com sucesso!');
        } catch (error) {
            console.error('Error saving nickname:', error);
            toast.error('Erro ao salvar apelido.');
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(getReferralLink());
        toast.success('Link copiado para a área de transferência!');
    };

    const handleRequestWithdraw = async () => {
        if (!pixKey.trim()) {
            toast.error('Informe a chave PIX.');
            return;
        }

        const availableBalance = Math.max(0, balance - debt);
        if (availableBalance < 100) {
            toast.error('Saldo insuficiente para saque (Mínimo R$ 100,00).');
            return;
        }

        setWithdrawLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not found');

            const { error } = await supabase
                .from('withdrawals')
                .insert({
                    user_id: user.id,
                    amount: availableBalance,
                    pix_key: pixKey,
                    status: 'pending'
                });

            if (error) throw error;

            // Deduct from balance immediately (hold funds)
            await supabase
                .from('profiles')
                .update({ balance: balance - availableBalance })
                .eq('id', user.id);

            toast.success('Solicitação de saque enviada com sucesso!');
            setShowWithdrawModal(false);
            setPixKey('');
            fetchWithdrawals(); // Refresh list
            fetchNetworkData(); // Refresh balance
        } catch (error) {
            console.error('Error requesting withdraw:', error);
            toast.error('Erro ao solicitar saque.');
        } finally {
            setWithdrawLoading(false);
        }
    };

    const availableBalance = Math.max(0, balance - debt);

    return (
        <div className="network-page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Minha Rede</h1>
                    <p className="page-subtitle">Gerencie suas indicações e cresça sua equipe.</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => setShowWithdrawModal(true)}
                    disabled={availableBalance < 100}
                    style={{ opacity: availableBalance < 100 ? 0.5 : 1 }}
                >
                    <DollarSign size={18} style={{ marginRight: '5px' }} />
                    Solicitar Saque
                </button>
            </div>

            {/* Withdraw Modal */}
            {showWithdrawModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="modal-content card-premium" style={{ width: '400px', padding: '2rem' }}>
                        <h3>Solicitar Saque</h3>
                        <p style={{ marginBottom: '1rem', color: '#aaa' }}>
                            Valor disponível: <strong style={{ color: '#28a745' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(availableBalance)}</strong>
                        </p>

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label>Chave PIX</label>
                            <input
                                type="text"
                                value={pixKey}
                                onChange={(e) => setPixKey(e.target.value)}
                                placeholder="CPF, Email ou Telefone"
                                className="form-input"
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #333', background: '#111', color: 'white' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowWithdrawModal(false)}
                                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #555', background: 'transparent', color: 'white', cursor: 'pointer' }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleRequestWithdraw}
                                disabled={withdrawLoading}
                                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'var(--color-gold)', color: 'black', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                {withdrawLoading ? 'Enviando...' : 'Confirmar Saque'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invite Section */}
            <div className="invite-section card-premium">
                <div className="invite-header">
                    <div className="icon-wrapper">
                        <Share2 size={24} />
                    </div>
                    <div>
                        <h3>Convide e Ganhe</h3>
                        <p>Compartilhe seu link exclusivo e ganhe comissões sobre as vendas da sua rede.</p>
                    </div>
                </div>

                <div className="nickname-section" style={{ marginBottom: '1rem' }}>
                    {isEditingNickname ? (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input
                                type="text"
                                value={newNickname}
                                onChange={(e) => setNewNickname(e.target.value)}
                                placeholder="Seu apelido (ex: joao10)"
                                className="nickname-input"
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    color: 'white',
                                    outline: 'none'
                                }}
                            />
                            <button
                                onClick={handleSaveNickname}
                                style={{
                                    background: 'var(--color-gold)',
                                    color: 'black',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Salvar
                            </button>
                            <button
                                onClick={() => {
                                    setIsEditingNickname(false);
                                    setNewNickname(nickname);
                                }}
                                style={{
                                    background: 'transparent',
                                    color: '#aaa',
                                    border: '1px solid #aaa',
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancelar
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <span style={{ color: '#aaa' }}>Seu Apelido: <strong style={{ color: 'white' }}>{nickname || 'Não definido'}</strong></span>
                            <button
                                onClick={() => setIsEditingNickname(true)}
                                style={{
                                    background: 'transparent',
                                    color: 'var(--color-gold)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    textDecoration: 'underline'
                                }}
                            >
                                {nickname ? 'Alterar' : 'Definir Apelido'}
                            </button>
                        </div>
                    )}
                </div>

                <div className="link-box">
                    <div className="link-display">
                        {loading ? <Skeleton className="h-6 w-64" /> : getReferralLink()}
                    </div>
                    <button onClick={handleCopyLink} className="btn-copy" disabled={loading}>
                        <Copy size={18} />
                        Copiar Link
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card card-premium">
                    <div className="stat-icon users">
                        <Users size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Total de Indicados</span>
                        {loading ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            <span className="stat-value">{referrals.length}</span>
                        )}
                    </div>
                </div>
                <div className="stat-card card-premium">
                    <div className="stat-icon earnings">
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Ganhos Totais</span>
                        {loading ? (
                            <Skeleton className="h-8 w-24" />
                        ) : (
                            <span className="stat-value">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalEarnings)}
                            </span>
                        )}
                    </div>
                </div>
                <div className="stat-card card-premium" style={{ border: '1px solid rgba(220, 53, 69, 0.3)' }}>
                    <div className="stat-icon" style={{ color: '#dc3545', background: 'rgba(220, 53, 69, 0.1)' }}>
                        <DollarSign size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Bloqueado (Dívidas)</span>
                        {loading ? (
                            <Skeleton className="h-8 w-24" />
                        ) : (
                            <span className="stat-value" style={{ color: '#dc3545' }}>
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(debt)}
                            </span>
                        )}
                    </div>
                </div>
                <div className="stat-card card-premium" style={{ border: '1px solid rgba(40, 167, 69, 0.3)' }}>
                    <div className="stat-icon" style={{ color: '#28a745', background: 'rgba(40, 167, 69, 0.1)' }}>
                        <Award size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Disponível para Saque</span>
                        {loading ? (
                            <Skeleton className="h-8 w-24" />
                        ) : (
                            <span className="stat-value" style={{ color: '#28a745' }}>
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(availableBalance)}
                            </span>
                        )}
                    </div>
                </div>
            </div>



            {/* Withdrawals History */}
            {withdrawals.length > 0 && (
                <div className="withdrawals-section card-premium" style={{ marginTop: '2rem' }}>
                    <h3>Histórico de Saques</h3>
                    <div className="table-container">
                        <table className="referrals-table">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Valor</th>
                                    <th>Status</th>
                                    <th>Chave PIX</th>
                                </tr>
                            </thead>
                            <tbody>
                                {withdrawals
                                    .slice((withdrawalsPage - 1) * itemsPerPage, withdrawalsPage * itemsPerPage)
                                    .map((w) => (
                                        <tr key={w.id}>
                                            <td>{new Date(w.created_at).toLocaleDateString()}</td>
                                            <td style={{ fontWeight: 'bold', color: '#28a745' }}>
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(w.amount)}
                                            </td>
                                            <td>
                                                <span className={`badge badge-${w.status === 'approved' ? 'success' : w.status === 'rejected' ? 'danger' : 'warning'}`}>
                                                    {w.status === 'approved' ? 'Pago' : w.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                                                </span>
                                            </td>
                                            <td>{w.pix_key}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                    <Pagination
                        currentPage={withdrawalsPage}
                        totalPages={Math.ceil(withdrawals.length / itemsPerPage)}
                        onPageChange={setWithdrawalsPage}
                    />
                </div>
            )}

            {/* Referrals List */}
            <div className="referrals-section card-premium" style={{ marginTop: '2rem' }}>
                <h3>Seus Indicados</h3>
                {loading ? (
                    <div className="loading-state">
                        <Skeleton className="h-12 w-full mb-2" />
                        <Skeleton className="h-12 w-full mb-2" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : referrals.length === 0 ? (
                    <div className="empty-state">
                        <Users size={48} />
                        <p>Você ainda não tem indicações.</p>
                        <p className="empty-subtitle">Compartilhe seu link para começar a ganhar!</p>
                    </div>
                ) : (
                    <>
                        <div className="table-container">
                            <table className="referrals-table">
                                <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>Email</th>
                                        <th>Data de Cadastro</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {referrals
                                        .slice((referralsPage - 1) * itemsPerPage, referralsPage * itemsPerPage)
                                        .map((referral) => (
                                            <tr key={referral.id}>
                                                <td>{referral.full_name || 'Sem nome'}</td>
                                                <td>{referral.email}</td>
                                                <td>{new Date(referral.created_at).toLocaleDateString()}</td>
                                                <td>
                                                    <span className={`badge badge-${referral.role === 'admin' ? 'primary' : 'success'}`}>
                                                        {referral.role === 'admin' ? 'Admin' : 'Ativo'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            currentPage={referralsPage}
                            totalPages={Math.ceil(referrals.length / itemsPerPage)}
                            onPageChange={setReferralsPage}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default NetworkPage;
