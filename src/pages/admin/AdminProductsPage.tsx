import React, { useState, useEffect } from 'react';
import { Search, Filter, Check, X, Package, Edit, DollarSign, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import Pagination from '../../components/ui/Pagination';
import './AdminProductsPage.css';

interface Product {
    id: string;
    created_at: string;
    name: string;
    description: string;
    price_type: string;
    final_price: number;
    commission_rate: number;
    status: 'pending' | 'approved' | 'rejected';
    owner_id: string;
    profiles?: { full_name: string; email: string };
    image_url?: string;
}

const AdminProductsPage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('pending');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    useEffect(() => {
        fetchProducts();
    }, [statusFilter]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('products')
                .select(`
                    *,
                    profiles:owner_id (full_name, email)
                `)
                .order('created_at', { ascending: false });

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            const { data, error } = await query;

            if (error) throw error;
            setProducts(data as any || []);
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Erro ao carregar produtos.');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (product: Product) => {
        const commissionStr = prompt('Defina a comissão do afiliado para este produto (%):', product.commission_rate?.toString() || '10');

        if (commissionStr === null) return; // Cancelled

        const commissionRate = parseFloat(commissionStr);
        if (isNaN(commissionRate) || commissionRate < 0 || commissionRate > 100) {
            toast.error('Por favor, insira uma porcentagem válida entre 0 e 100.');
            return;
        }

        try {
            const { error } = await supabase
                .from('products')
                .update({
                    status: 'approved',
                    commission_rate: commissionRate
                })
                .eq('id', product.id);

            if (error) throw error;

            toast.success(`Produto aprovado com comissão de ${commissionRate}%!`);
            fetchProducts();
        } catch (error: any) {
            console.error('Error approving product:', error);
            toast.error('Erro ao aprovar produto: ' + error.message);
        }
    };

    const handleReject = async (productId: string) => {
        if (!window.confirm('Tem certeza que deseja rejeitar este produto?')) return;

        try {
            const { error } = await supabase
                .from('products')
                .update({ status: 'rejected' })
                .eq('id', productId);

            if (error) throw error;

            toast.success('Produto rejeitado.');
            fetchProducts();
        } catch (error: any) {
            console.error('Error rejecting product:', error);
            toast.error('Erro ao rejeitar produto: ' + error.message);
        }
    };

    const handleEditCommission = async (product: Product) => {
        const commissionStr = prompt('Nova comissão do afiliado (%):', product.commission_rate?.toString());

        if (commissionStr === null) return; // Cancelled

        const commissionRate = parseFloat(commissionStr);
        if (isNaN(commissionRate) || commissionRate < 0 || commissionRate > 100) {
            toast.error('Por favor, insira uma porcentagem válida entre 0 e 100.');
            return;
        }

        try {
            const { error } = await supabase
                .from('products')
                .update({ commission_rate: commissionRate })
                .eq('id', product.id);

            if (error) throw error;

            toast.success(`Comissão atualizada para ${commissionRate}%!`);
            fetchProducts();
        } catch (error: any) {
            console.error('Error updating commission:', error);
            toast.error('Erro ao atualizar comissão: ' + error.message);
        }
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch =
            (product.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (product.profiles?.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (product.profiles?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    return (
        <div className="admin-orders-container"> {/* Reusing container class */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Gerenciar Produtos</h1>
                    <p className="page-subtitle">Aprove, rejeite e defina comissões para produtos de afiliados.</p>
                </div>
                <div className="header-actions" style={{ display: 'flex', gap: '10px' }}>
                    <div className="search-bar">
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar produto ou afiliado..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Status Tabs */}
            <div className="tabs-container">
                <button
                    className={`tab-btn ${statusFilter === 'pending' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('pending')}
                >
                    Pendentes
                </button>
                <button
                    className={`tab-btn ${statusFilter === 'approved' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('approved')}
                >
                    Aprovados
                </button>
                <button
                    className={`tab-btn ${statusFilter === 'rejected' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('rejected')}
                >
                    Rejeitados
                </button>
                <button
                    className={`tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('all')}
                >
                    Todos
                </button>
            </div>

            <div className="orders-table-container card-premium">
                {loading ? (
                    <div className="loading-state">Carregando produtos...</div>
                ) : (
                    <>
                        <table className="orders-table">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Produto</th>
                                    <th>Afiliado</th>
                                    <th>Preço Final</th>
                                    <th>Comissão</th>
                                    <th>Status</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="empty-state">Nenhum produto encontrado.</td>
                                    </tr>
                                ) : (
                                    filteredProducts
                                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                        .map(product => (
                                            <tr key={product.id}>
                                                <td>{new Date(product.created_at).toLocaleDateString()}</td>
                                                <td>
                                                    <div className="product-cell">
                                                        {product.image_url && (
                                                            <img src={product.image_url} alt="" style={{ width: 30, height: 30, borderRadius: 4, objectFit: 'cover', marginRight: 8 }} />
                                                        )}
                                                        <span className="product-name">{product.name}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="user-cell">
                                                        <span>{product.profiles?.full_name || 'Sem nome'}</span>
                                                        <span className="user-email">{product.profiles?.email}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    {product.final_price
                                                        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.final_price)
                                                        : 'Sob Medida'}
                                                </td>
                                                <td
                                                    onClick={() => handleEditCommission(product)}
                                                    className="commission-cell"
                                                    title="Clique para editar a comissão"
                                                >
                                                    <span className="commission-value">{product.commission_rate}%</span>
                                                    <Edit size={14} className="edit-hint" />
                                                </td>
                                                <td>
                                                    <span className={`badge badge-${product.status === 'approved' ? 'success' :
                                                        product.status === 'rejected' ? 'danger' : 'warning'
                                                        }`}>
                                                        {product.status === 'approved' ? 'Aprovado' :
                                                            product.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                                                    </span>
                                                </td>
                                                <td className="actions-cell">
                                                    <div style={{ display: 'flex', gap: '5px' }}>
                                                        {product.status === 'pending' && (
                                                            <>
                                                                <button
                                                                    className="btn-icon btn-approve"
                                                                    title="Aprovar e Definir Comissão"
                                                                    onClick={() => handleApprove(product)}
                                                                >
                                                                    <Check size={18} />
                                                                </button>
                                                                <button
                                                                    className="btn-icon btn-reject"
                                                                    title="Rejeitar"
                                                                    onClick={() => handleReject(product.id)}
                                                                >
                                                                    <X size={18} />
                                                                </button>
                                                            </>
                                                        )}
                                                        {product.status === 'approved' && (
                                                            <button
                                                                className="btn-icon"
                                                                title="Editar Comissão"
                                                                onClick={() => handleEditCommission(product)}
                                                                style={{ color: '#ffc107', background: 'rgba(255, 193, 7, 0.1)', border: '1px solid rgba(255, 193, 7, 0.3)' }}
                                                            >
                                                                <Edit size={18} />
                                                            </button>
                                                        )}
                                                        {product.status === 'rejected' && (
                                                            <button
                                                                className="btn-icon btn-approve"
                                                                title="Reconsiderar (Aprovar)"
                                                                onClick={() => handleApprove(product)}
                                                            >
                                                                <Check size={18} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                )}
                            </tbody>
                        </table>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={Math.ceil(filteredProducts.length / itemsPerPage)}
                            onPageChange={setCurrentPage}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminProductsPage;
