import React, { useState, useEffect } from 'react';
import { Search, User, Mail, Phone, Shield, Trash2, Eye, DollarSign, Calendar, ExternalLink, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '../../components/ui/Skeleton';
import { supabase } from '../../lib/supabase';
import UserOrdersModal from '../../components/admin/UserOrdersModal';
import UserNotificationsModal from '../../components/admin/UserNotificationsModal';
import { useImpersonation } from '../../hooks/useImpersonation';
import './AdminUsersPage.css';

interface Profile {
    id: string;
    email: string;
    full_name: string;
    phone: string;
    role: string;
    invoice_limit: number;
    invoice_due_day: number;
    created_at: string;
    referrer?: {
        full_name: string;
        email: string;
    };
}

const AdminUsersPage: React.FC = () => {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [selectedUser, setSelectedUser] = useState<{ id: string, name: string } | null>(null);
    const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
    const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
    const { startImpersonation } = useImpersonation();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    *,
                    referrer:referred_by (full_name, email)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditLimit = async (userId: string, currentLimit: number, userName: string) => {
        const newLimitStr = prompt(`Definir novo limite de crédito para ${userName}:`, currentLimit.toString());
        if (newLimitStr === null) return; // Cancelled

        const newLimit = parseFloat(newLimitStr);
        if (isNaN(newLimit) || newLimit < 0) {
            toast.error('Por favor, insira um valor válido.');
            return;
        }

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ invoice_limit: newLimit })
                .eq('id', userId);

            if (error) throw error;

            setUsers(users.map(user =>
                user.id === userId ? { ...user, invoice_limit: newLimit } : user
            ));
            toast.success('Limite atualizado com sucesso!');
        } catch (error: any) {
            console.error('Error updating limit:', error);
            toast.error('Erro ao atualizar limite: ' + error.message);
        }
    };

    const handleEditDueDay = async (userId: string, currentDay: number, userName: string) => {
        const newDayStr = prompt(`Definir dia de vencimento para ${userName} (1-31):`, (currentDay || 30).toString());
        if (newDayStr === null) return; // Cancelled

        const newDay = parseInt(newDayStr);
        if (isNaN(newDay) || newDay < 1 || newDay > 31) {
            toast.error('Por favor, insira um dia válido entre 1 e 31.');
            return;
        }

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ invoice_due_day: newDay })
                .eq('id', userId);

            if (error) throw error;

            setUsers(users.map(user =>
                user.id === userId ? { ...user, invoice_due_day: newDay } : user
            ));
            toast.success('Dia de vencimento atualizado com sucesso!');
        } catch (error: any) {
            console.error('Error updating due day:', error);
            toast.error('Erro ao atualizar dia de vencimento: ' + error.message);
        }
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (!window.confirm(`Tem certeza que deseja excluir o usuário ${userName || 'Sem nome'}? Esta ação não pode ser desfeita.`)) {
            return;
        }

        try {
            const { error } = await supabase
                .rpc('delete_user_completely', { target_user_id: userId });

            if (error) throw error;

            setUsers(users.filter(user => user.id !== userId));
            toast.success('Usuário excluído com sucesso!');
        } catch (error: any) {
            console.error('Error deleting user:', error);
            if (error.message?.includes('violates foreign key constraint "products_owner_id_fkey"')) {
                toast.error('Não é possível excluir este usuário pois ele é dono de produtos. Execute o script de correção no banco de dados ou remova os produtos manualmente.');
            } else if (error.message?.includes('violates foreign key constraint')) {
                toast.error(`Erro de dependência ao excluir usuário: ${error.message}. Verifique se o usuário tem registros vinculados.`);
            } else {
                toast.error('Erro ao excluir usuário: ' + error.message);
            }
        }
    };

    const handleToggleAdmin = async (userId: string, currentRole: string, userName: string) => {
        const newRole = currentRole === 'admin' ? 'affiliate' : 'admin';
        const action = newRole === 'admin' ? 'promover' : 'rebaixar';

        if (!window.confirm(`Tem certeza que deseja ${action} o usuário ${userName} para ${newRole === 'admin' ? 'Administrador' : 'Afiliado'}?`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) throw error;

            setUsers(users.map(user =>
                user.id === userId ? { ...user, role: newRole } : user
            ));
            toast.success(`Usuário ${newRole === 'admin' ? 'promovido a Administrador' : 'rebaixado a Afiliado'} com sucesso!`);
        } catch (error: any) {
            console.error('Error updating role:', error);
            toast.error('Erro ao atualizar função: ' + error.message);
        }
    };

    const handleViewOrders = (userId: string, userName: string) => {
        setSelectedUser({ id: userId, name: userName });
        setIsOrdersModalOpen(true);
    };

    const handleViewNotifications = (userId: string, userName: string) => {
        setSelectedUser({ id: userId, name: userName });
        setIsNotificationsModalOpen(true);
    };

    const filteredUsers = users.filter(user =>
        (user.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="admin-users-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Gerenciar Afiliados</h1>
                    <p className="page-subtitle">Visualize e busque por afiliados cadastrados.</p>
                </div>
                <div className="search-bar">
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="users-list card-premium">
                {loading ? (
                    <div className="space-y-4 p-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                </div>
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-24" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-8 w-8 rounded" />
                                    <Skeleton className="h-8 w-8 rounded" />
                                    <Skeleton className="h-8 w-8 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>Usuário</th>
                                <th>Contato</th>
                                <th>Função</th>
                                <th>Indicado por</th>
                                <th>Data Cadastro</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="empty-state">Nenhum usuário encontrado.</td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => (
                                    <tr key={user.id}>
                                        <td>
                                            <div className="user-cell">
                                                <div className="user-avatar">
                                                    <User size={20} />
                                                </div>
                                                <div className="user-info">
                                                    <span className="user-name">{user.full_name || 'Sem nome'}</span>
                                                    <span className="user-id">ID: {user.id.slice(0, 8)}...</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="contact-cell">
                                                <div className="contact-item">
                                                    <Mail size={14} />
                                                    <span>{user.email}</span>
                                                </div>
                                                {user.phone && (
                                                    <div className="contact-item">
                                                        <Phone size={14} />
                                                        <span>{user.phone}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`role-badge ${user.role === 'admin' ? 'admin' : 'affiliate'}`}>
                                                {user.role === 'admin' ? <Shield size={12} /> : <User size={12} />}
                                                {user.role === 'admin' ? 'Administrador' : 'Afiliado'}
                                            </span>
                                        </td>
                                        <td>
                                            {user.referrer ? (
                                                <div className="user-info">
                                                    <span className="user-name" style={{ fontSize: '0.9rem' }}>{user.referrer.full_name}</span>
                                                    <span className="user-email" style={{ fontSize: '0.8rem', color: '#888' }}>{user.referrer.email}</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted">-</span>
                                            )}
                                        </td>
                                        <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <div className="actions-cell" style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    className="action-button view"
                                                    onClick={() => handleViewOrders(user.id, user.full_name)}
                                                    title="Ver Pedidos"
                                                    style={{ background: 'rgba(255, 215, 0, 0.1)', color: '#FFD700', border: '1px solid rgba(255, 215, 0, 0.3)' }}
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    className="action-button notifications"
                                                    onClick={() => handleViewNotifications(user.id, user.full_name)}
                                                    title="Ver Notificações"
                                                    style={{ background: 'rgba(111, 66, 193, 0.1)', color: '#6f42c1', border: '1px solid rgba(111, 66, 193, 0.3)' }}
                                                >
                                                    <Bell size={18} />
                                                </button>
                                                <button
                                                    className="action-button impersonate"
                                                    onClick={() => startImpersonation(user.id)}
                                                    title="Acessar Escritório"
                                                    style={{ background: 'rgba(13, 202, 240, 0.1)', color: '#0dcaf0', border: '1px solid rgba(13, 202, 240, 0.3)' }}
                                                >
                                                    <ExternalLink size={18} />
                                                </button>
                                                <button
                                                    className="action-button toggle-admin"
                                                    onClick={() => handleToggleAdmin(user.id, user.role, user.full_name)}
                                                    title={user.role === 'admin' ? "Remover Admin" : "Tornar Admin"}
                                                    style={{
                                                        background: user.role === 'admin' ? 'rgba(220, 53, 69, 0.1)' : 'rgba(0, 123, 255, 0.1)',
                                                        color: user.role === 'admin' ? '#dc3545' : '#007bff',
                                                        border: `1px solid ${user.role === 'admin' ? 'rgba(220, 53, 69, 0.3)' : 'rgba(0, 123, 255, 0.3)'}`
                                                    }}
                                                >
                                                    <Shield size={18} />
                                                </button>
                                                <button
                                                    className="action-button edit-limit"
                                                    onClick={() => handleEditLimit(user.id, user.invoice_limit || 0, user.full_name)}
                                                    title="Definir Limite de Crédito"
                                                    style={{ background: 'rgba(40, 167, 69, 0.1)', color: '#28a745', border: '1px solid rgba(40, 167, 69, 0.3)' }}
                                                >
                                                    <DollarSign size={18} />
                                                </button>
                                                <button
                                                    className="action-button edit-due-day"
                                                    onClick={() => handleEditDueDay(user.id, user.invoice_due_day, user.full_name)}
                                                    title={`Vencimento: Dia ${user.invoice_due_day || 30}`}
                                                    style={{ background: 'rgba(23, 162, 184, 0.1)', color: '#17a2b8', border: '1px solid rgba(23, 162, 184, 0.3)' }}
                                                >
                                                    <Calendar size={18} />
                                                </button>
                                                <button
                                                    className="action-button delete"
                                                    onClick={() => handleDeleteUser(user.id, user.full_name)}
                                                    title="Excluir Usuário"
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
                )}
            </div>

            {selectedUser && (
                <>
                    <UserOrdersModal
                        isOpen={isOrdersModalOpen}
                        onClose={() => setIsOrdersModalOpen(false)}
                        userId={selectedUser.id}
                        userName={selectedUser.name}
                    />
                    <UserNotificationsModal
                        isOpen={isNotificationsModalOpen}
                        onClose={() => setIsNotificationsModalOpen(false)}
                        userId={selectedUser.id}
                        userName={selectedUser.name}
                    />
                </>
            )}
        </div>
    );
};

export default AdminUsersPage;
