import React, { useState } from 'react';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';
import './MainLayout.css';

interface MainLayoutProps {
    children: React.ReactNode;
}

import NotificationsPopover from '../notifications/NotificationsPopover';
import { useImpersonation } from '../../hooks/useImpersonation';
import { LogOut } from 'lucide-react';

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { isImpersonating, stopImpersonation } = useImpersonation();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {isImpersonating && (
                <div style={{
                    background: '#ffc107',
                    color: '#000',
                    padding: '0.5rem',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '1rem',
                    zIndex: 1000
                }}>
                    <span>⚠️ Você está acessando como um afiliado (Modo de Visualização)</span>
                    <button
                        onClick={stopImpersonation}
                        style={{
                            background: '#000',
                            color: '#fff',
                            border: 'none',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.8rem'
                        }}
                    >
                        <LogOut size={14} /> Sair do Modo de Visualização
                    </button>
                </div>
            )}
            <div className="main-layout" style={{ flex: 1, minHeight: 0 }}>
                <Sidebar className={sidebarOpen ? 'open' : ''} />
                <MobileHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

                {/* Overlay for mobile sidebar */}
                {sidebarOpen && (
                    <div
                        className="sidebar-overlay"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                <main className="main-content">
                    <div className="desktop-header-spacer" style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        padding: '1rem 2rem',
                        width: '100%',
                    }}>
                        <div>
                            <NotificationsPopover />
                        </div>
                    </div>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
