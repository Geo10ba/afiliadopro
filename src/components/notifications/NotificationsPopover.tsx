import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationsContext';
import './NotificationsPopover.css';

const NotificationsPopover: React.FC = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleNotificationClick = (id: string, read: boolean) => {
        if (!read) {
            markAsRead(id);
        }
    };

    return (
        <div className="notifications-container" ref={popoverRef}>
            <button
                className="notifications-trigger"
                onClick={() => setIsOpen(!isOpen)}
                title="Notificações"
            >
                <Bell size={20} color="#e0e0e0" />
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className="notifications-popover card-premium">
                    <div className="notifications-header">
                        <h3>Notificações</h3>
                        {unreadCount > 0 && (
                            <button className="mark-all-read" onClick={markAllAsRead}>
                                <Check size={14} /> Marcar todas como lidas
                            </button>
                        )}
                    </div>

                    <div className="notifications-list">
                        {notifications.length === 0 ? (
                            <div className="empty-notifications">
                                <Bell size={32} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
                                <p>Nenhuma notificação.</p>
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`notification-item ${notification.read ? 'read' : 'unread'} ${notification.type}`}
                                    onClick={() => handleNotificationClick(notification.id, notification.read)}
                                >
                                    <div className="notification-content">
                                        <h4 className="notification-title">{notification.title}</h4>
                                        <p className="notification-message">{notification.message}</p>
                                        <span className="notification-time">
                                            {new Date(notification.created_at).toLocaleDateString()} {new Date(notification.created_at).toLocaleTimeString().slice(0, 5)}
                                        </span>
                                    </div>
                                    {!notification.read && <div className="unread-dot" />}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationsPopover;
