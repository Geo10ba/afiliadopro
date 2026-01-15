import React, { useState, useEffect } from 'react';
import { X, Bell, Trash2, Calendar, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import './UserOrdersModal.css'; // Reusing the same styles for consistency

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    created_at: string;
}

interface UserNotificationsModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userName: string;
}

const UserNotificationsModal: React.FC<UserNotificationsModalProps> = ({ isOpen, onClose, userId, userName }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && userId) {
            fetchNotifications();
        }
    }, [isOpen, userId]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotifications(data || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            toast.error('Erro ao carregar notificações');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta notificação?')) return;

        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setNotifications(notifications.filter(n => n.id !== id));
            toast.success('Notificação excluída com sucesso');
        } catch (error) {
            console.error('Error deleting notification:', error);
            toast.error('Erro ao excluir notificação');
        }
    };

    const handleDeleteAll = async () => {
        if (!confirm('Tem certeza que deseja excluir TODAS as notificações deste usuário?')) return;

        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('user_id', userId);

            if (error) throw error;

            setNotifications([]);
            toast.success('Todas as notificações foram excluídas');
        } catch (error) {
            console.error('Error deleting all notifications:', error);
            toast.error('Erro ao excluir notificações');
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle size={16} color="#28a745" />;
            case 'warning': return <AlertTriangle size={16} color="#ffc107" />;
            case 'error': return <AlertTriangle size={16} color="#dc3545" />;
            default: return <Info size={16} color="#17a2b8" />;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content card-premium user-orders-modal">
                <button className="modal-close" onClick={onClose}>
                    <X size={24} />
                </button>

                <div className="modal-header">
                    <h2>Notificações de {userName}</h2>
                    <p className="product-name">Gerencie as mensagens enviadas para este usuário</p>
                </div>

                <div className="modal-body">
                    {loading ? (
                        <div className="loading-state">Carregando notificações...</div>
                    ) : (
                        <>
                            <div className="orders-summary-cards">
                                <div className="summary-card pending">
                                    <h3>Total de Notificações</h3>
                                    <div className="value">{notifications.length}</div>
                                </div>
                                {notifications.length > 0 && (
                                    <button
                                        onClick={handleDeleteAll}
                                        className="action-button delete"
                                        style={{
                                            width: '100%',
                                            marginTop: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            padding: '10px',
                                            background: 'rgba(220, 53, 69, 0.1)',
                                            color: '#dc3545',
                                            border: '1px solid rgba(220, 53, 69, 0.3)',
                                            borderRadius: '8px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Trash2 size={16} /> Excluir Todas
                                    </button>
                                )}
                            </div>

                            <div className="orders-list-section">
                                <h3><Bell size={18} /> Histórico de Mensagens</h3>
                                {notifications.length === 0 ? (
                                    <p className="empty-text">Nenhuma notificação encontrada.</p>
                                ) : (
                                    <table className="user-orders-table">
                                        <thead>
                                            <tr>
                                                <th>Data</th>
                                                <th>Tipo</th>
                                                <th>Título</th>
                                                <th>Mensagem</th>
                                                <th>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {notifications.map(notification => (
                                                <tr key={notification.id}>
                                                    <td>
                                                        <div className="date-cell">
                                                            <Calendar size={14} style={{ marginRight: '5px' }} />
                                                            {new Date(notification.created_at).toLocaleDateString()}
                                                        </div>
                                                        <small>{new Date(notification.created_at).toLocaleTimeString()}</small>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                            {getIcon(notification.type)}
                                                            <span style={{ textTransform: 'capitalize' }}>{notification.type}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ fontWeight: 'bold', color: '#fff' }}>
                                                        {notification.title}
                                                    </td>
                                                    <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={notification.message}>
                                                        {notification.message}
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="action-button delete"
                                                            onClick={() => handleDelete(notification.id)}
                                                            title="Excluir Notificação"
                                                            style={{ background: 'transparent', border: 'none', color: '#dc3545', cursor: 'pointer' }}
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
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

export default UserNotificationsModal;
