import React, { useState, useEffect } from 'react';
import { LayoutDashboard, FileText, Package, Users, Settings, LogOut, PlusCircle, ShoppingCart, Wallet, DollarSign } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './Sidebar.css';

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [role, setRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // console.log('Sidebar: Current user:', user);

      if (user) {
        setUserEmail(user.email || '');
        const { data } = await supabase.from('profiles').select('role, avatar_url').eq('id', user.id).single();
        // console.log('Sidebar: Profile data:', data, 'Error:', error);

        if (data) {
          // Check for impersonation
          const isImpersonating = localStorage.getItem('impersonatedUserId');
          if (isImpersonating && data.role === 'admin') {
            setRole('affiliate');
          } else {
            setRole(data.role);
          }

          if (data.avatar_url) {
            downloadAvatar(data.avatar_url);
          }
        } else {
          console.warn('Sidebar: No profile found, defaulting to affiliate');
          setRole('affiliate');
        }
      } else {
        // console.log('Sidebar: No user found');
        setUserEmail(null);
      }
    } catch (_error) {
      console.error('Sidebar: Error checking role:', _error);
      // Fallback in case of error
      setRole('affiliate');
      setUserEmail(null);
    } finally {
      console.log('Sidebar check complete. Role:', role);
      console.log('Impersonation state:', localStorage.getItem('impersonatedUserId'));
    }
  };

  const downloadAvatar = async (path: string) => {
    try {
      const { data, error } = await supabase.storage.from('avatars').download(path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      setAvatarUrl(url);
    } catch (error) {
      console.error('Error downloading avatar:', error);
    }
  };

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <aside className={`sidebar ${className}`}>
      <div className="sidebar-logo">
        <img src="/logo.png" alt="Afiliado Pro" style={{ height: '60px' }} />
      </div>

      <nav className="sidebar-nav">
        <Link to="/dashboard" className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}>
          <LayoutDashboard size={20} className="nav-icon" />
          <span className="nav-label">Dashboard</span>
        </Link>

        {role === 'affiliate' && (
          <>
            <Link to="/products/new" className={`nav-item ${location.pathname === '/products/new' ? 'active' : ''}`}>
              <PlusCircle size={20} className="nav-icon" />
              <span className="nav-label">Novo Produto</span>
            </Link>
            <Link to="/products/my" className={`nav-item ${location.pathname === '/products/my' ? 'active' : ''}`}>
              <FileText size={20} className="nav-icon" />
              <span className="nav-label">Meus Produtos</span>
            </Link>

            <Link to="/orders/my" className={`nav-item ${location.pathname === '/orders/my' ? 'active' : ''}`}>
              <ShoppingCart size={20} className="nav-icon" />
              <span className="nav-label">Meus Pedidos</span>
            </Link>

            <Link to="/finance" className={`nav-item ${location.pathname === '/finance' ? 'active' : ''}`}>
              <Wallet size={20} className="nav-icon" />
              <span className="nav-label">Minha Carteira</span>
            </Link>

            <Link to="/network" className={`nav-item ${location.pathname === '/network' ? 'active' : ''}`}>
              <Users size={20} className="nav-icon" />
              <span className="nav-label">Minha Rede</span>
            </Link>

            <Link to="/products/available" className={`nav-item ${location.pathname === '/products/available' ? 'active' : ''}`}>
              <Package size={20} className="nav-icon" />
              <span className="nav-label">Produtos para Venda</span>
            </Link>
          </>
        )}

        {role === 'admin' && (
          <>
            <Link to="/products/new" className={`nav-item ${location.pathname === '/products/new' ? 'active' : ''}`}>
              <PlusCircle size={20} className="nav-icon" />
              <span className="nav-label">Novo Produto</span>
            </Link>

            <Link to="/products/my" className={`nav-item ${location.pathname === '/products/my' ? 'active' : ''}`}>
              <FileText size={20} className="nav-icon" />
              <span className="nav-label">Meus Produtos</span>
            </Link>

            <Link to="/products/available" className={`nav-item ${location.pathname === '/products/available' ? 'active' : ''}`}>
              <Package size={20} className="nav-icon" />
              <span className="nav-label">Produtos para Venda</span>
            </Link>

            <Link to="/admin/users" className={`nav-item ${location.pathname === '/admin/users' ? 'active' : ''}`}>
              <Users size={20} className="nav-icon" />
              <span className="nav-label">Afiliados</span>
            </Link>

            <Link to="/admin/orders" className={`nav-item ${location.pathname === '/admin/orders' ? 'active' : ''}`}>
              <ShoppingCart size={20} className="nav-icon" />
              <span className="nav-label">Pedidos</span>
            </Link>

            <Link to="/admin/commissions" className={`nav-item ${location.pathname === '/admin/commissions' ? 'active' : ''}`}>
              <DollarSign size={20} className="nav-icon" />
              <span className="nav-label">Comissões</span>
            </Link>

            <Link to="/admin/withdrawals" className={`nav-item ${location.pathname === '/admin/withdrawals' ? 'active' : ''}`}>
              <Wallet size={20} className="nav-icon" />
              <span className="nav-label">Saques</span>
            </Link>

            <Link to="/admin/materials" className={`nav-item ${location.pathname === '/admin/materials' ? 'active' : ''}`}>
              <Package size={20} className="nav-icon" />
              <span className="nav-label">Materiais</span>
            </Link>
            <Link to="/admin/settings" className={`nav-item ${location.pathname === '/admin/settings' ? 'active' : ''}`}>
              <LayoutDashboard className="nav-icon" size={20} />
              <span className="nav-label">Landing Page</span>
            </Link>
            <Link to="/settings" className={`nav-item ${location.pathname === '/settings' ? 'active' : ''}`}>
              <Settings className="nav-icon" size={20} />
              <span className="nav-label">Configurações</span>
            </Link>
          </>
        )}
      </nav>

      <div className="sidebar-footer" style={{ marginTop: 'auto' }}>
        {/* User Info */}
        <div className="sidebar-user-info" style={{ padding: '0 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-gold)' }}
            />
          ) : (
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} color="#888" />
            </div>
          )}
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '12px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userEmail?.split('@')[0]}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--color-gold)', textTransform: 'capitalize' }}>
              {role === 'admin' ? 'Administrador' : 'Afiliado'}
            </div>
          </div>
        </div>

        <button onClick={handleLogout} className="sidebar-link logout-button">
          <LogOut size={20} />
          <span className="link-text">Sair</span>
        </button>
      </div>
    </aside >
  );
};

export default Sidebar;
