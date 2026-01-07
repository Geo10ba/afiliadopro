import React, { useState, useEffect } from 'react';
import { Plus, Package, Search, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '../../components/ui/Skeleton';
import { supabase } from '../../lib/supabase';
import OrderModal from '../../components/orders/OrderModal';
import './MyProductsPage.css';

interface Product {
    id: string;
    name: string;
    final_price: number;
    price_type: 'meter' | 'fixed';
    width: number;
    height: number;
    material_id: string;
}

const MyProductsPage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('owner_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Erro ao carregar produtos');
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOrderClick = (product: Product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    return (
        <div className="my-products-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Meus Produtos</h1>
                    <p className="page-subtitle">Gerencie seus produtos e faça novos pedidos.</p>
                </div>
                <div className="search-bar">
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar produtos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="products-grid">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="product-card card-premium">
                            <div className="product-header mb-2">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <Skeleton className="h-6 w-20" />
                            </div>
                            <Skeleton className="h-6 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-1/2 mb-4" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ))}
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="empty-state">
                    <Package size={48} />
                    <h3>Nenhum produto encontrado</h3>
                    <p>Você ainda não cadastrou nenhum produto.</p>
                </div>
            ) : (
                <div className="products-grid">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="product-card card-premium">
                            <div className="product-header">
                                <div className="product-icon">
                                    <Package size={24} />
                                </div>
                                <div className="product-price">
                                    R$ {product.final_price?.toFixed(2)}
                                </div>
                            </div>

                            <h3 className="product-name">{product.name}</h3>

                            <div className="product-details">
                                <span>{product.width}mm x {product.height}mm</span>
                                <span className="price-type-badge">
                                    {product.price_type === 'meter' ? 'Por Metro' : 'Fixo'}
                                </span>
                            </div>

                            <div className="product-actions" style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                                <button
                                    className="btn-order"
                                    style={{ flex: 1 }}
                                    onClick={() => handleOrderClick(product)}
                                >
                                    <Plus size={18} />
                                    Novo Pedido
                                </button>
                                <button
                                    className="btn-edit"
                                    title="Editar Produto"
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        color: '#fff',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        borderRadius: '8px',
                                        padding: '0.5rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        window.location.href = `/products/edit/${product.id}`;
                                    }}
                                >
                                    <Pencil size={18} />
                                </button>
                                <button
                                    className="btn-delete"
                                    title="Excluir Produto"
                                    style={{
                                        background: 'rgba(255, 59, 48, 0.1)',
                                        color: '#ff3b30',
                                        border: '1px solid rgba(255, 59, 48, 0.2)',
                                        borderRadius: '8px',
                                        padding: '0.5rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        if (window.confirm('Tem certeza que deseja excluir este produto?')) {
                                            try {
                                                const { error } = await supabase
                                                    .from('products')
                                                    .delete()
                                                    .eq('id', product.id);

                                                if (error) throw error;

                                                setProducts(products.filter(p => p.id !== product.id));
                                                toast.success('Produto excluído com sucesso');
                                            } catch (error) {
                                                console.error('Error deleting product:', error);
                                                toast.error('Erro ao excluir produto');
                                            }
                                        }
                                    }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <OrderModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                product={selectedProduct}
                onSuccess={() => {
                    toast.success('Pedido criado com sucesso!');
                }}
            />
        </div>
    );
};

export default MyProductsPage;
