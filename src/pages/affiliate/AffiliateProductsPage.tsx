import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Package } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import { supabase } from '../../lib/supabase';
import OrderModal from '../../components/orders/OrderModal';
import './MyProductsPage.css'; // Reuse styles or create new one

interface Product {
    id: string;
    name: string;
    final_price: number;
    price_type: 'meter' | 'fixed';
    image_url?: string;
    owner_id: string;
    profiles?: {
        role: string;
    };
}

const AffiliateProductsPage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

    useEffect(() => {
        // console.log('AffiliateProductsPage MOUNTED'); // DEBUG
        fetchAdminProducts();
    }, []);

    const fetchAdminProducts = async () => {
        setLoading(true);
        try {
            // console.log('Fetching products...');
            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    profiles:owner_id (
                        role
                    )
                `);

            if (error) {
                console.error('Supabase error fetching products:', error);
                throw error;
            }

            // console.log('Raw products data:', data);

            // Filter client-side to ensure we only show admin products
            const adminProducts = data?.filter((p: any) => p.profiles?.role === 'admin') || [];

            // console.log('Filtered admin products:', adminProducts);
            setProducts(adminProducts);

        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOrderClick = (product: Product) => {
        setSelectedProduct(product);
        setIsOrderModalOpen(true);
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="my-products-container">
            <div className="page-header">
                <h1 className="page-title">Produtos Disponíveis</h1>
                <p className="page-subtitle">Produtos exclusivos para afiliados.</p>
            </div>

            <div className="products-controls">
                <div className="search-bar">
                    <Search size={20} />
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
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="product-card card-premium">
                            <Skeleton className="h-[150px] w-full mb-4 rounded-lg" />
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-10 w-full mt-4" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="empty-state">
                    <Package size={48} />
                    <p>Nenhum produto encontrado.</p>
                </div>
            ) : (
                <div className="products-grid">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="product-card card-premium">
                            <div className="product-image-placeholder" style={{
                                height: '150px',
                                background: 'rgba(255,255,255,0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '8px',
                                marginBottom: '1rem',
                                overflow: 'hidden'
                            }}>
                                {product.image_url ? (
                                    <img
                                        src={product.image_url}
                                        alt={product.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <Package size={40} color="#666" />
                                )}
                            </div>
                            <div className="product-info">
                                <h3>{product.name}</h3>
                                <div className="product-price">
                                    R$ {product.final_price?.toFixed(2) || '0.00'}
                                </div>
                                <button
                                    className="btn-primary"
                                    style={{ width: '100%', marginTop: '1rem' }}
                                    onClick={() => handleOrderClick(product)}
                                >
                                    <ShoppingCart size={18} style={{ marginRight: '0.5rem' }} />
                                    Comprar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <OrderModal
                isOpen={isOrderModalOpen}
                onClose={() => setIsOrderModalOpen(false)}
                product={selectedProduct}
                onSuccess={() => {
                    setIsOrderModalOpen(false);
                    // Optionally refresh or show success message
                }}
            />
        </div>
    );
};

export default AffiliateProductsPage;
