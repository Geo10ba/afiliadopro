import React, { useState, useEffect } from 'react';
import { X, DollarSign, FileText, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import './OrderModal.css';

interface Product {
    id: string;
    name: string;
    final_price: number;
    price_type: 'meter' | 'fixed';
    image_url?: string;
}

interface OrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    onSuccess: () => void;
}

const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose, product, onSuccess }) => {
    const [quantity, setQuantity] = useState(1);
    const [downloadLink, setDownloadLink] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'now' | 'invoice'>('now');
    const [loading, setLoading] = useState(false);
    const [invoiceLimit, setInvoiceLimit] = useState<number>(0);
    const [currentDebt, setCurrentDebt] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchUserProfile();
            setQuantity(1);
            setDownloadLink('');
            setPaymentMethod('now');
            setError(null);
        }
    }, [isOpen]);

    const fetchUserProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch profile for invoice limit
        const { data: profile } = await supabase
            .from('profiles')
            .select('invoice_limit')
            .eq('id', user.id)
            .single();

        if (profile) setInvoiceLimit(profile.invoice_limit || 1000); // Default to 1000 for testing if 0

        // Calculate current debt (sum of unpaid invoice orders)
        const { data: orders } = await supabase
            .from('orders')
            .select('amount')
            .eq('user_id', user.id)
            .eq('payment_method', 'invoice')
            .eq('status', 'approved'); // Assuming 'approved' means debt is active but not paid

        const debt = orders?.reduce((sum, order) => sum + Number(order.amount), 0) || 0;
        setCurrentDebt(debt);
    };

    const handleSubmit = async () => {
        if (!product) return;
        setLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            const totalAmount = product.final_price * quantity;

            if (paymentMethod === 'invoice') {
                if (currentDebt + totalAmount > invoiceLimit) {
                    throw new Error(`Limite de crédito excedido. Seu limite é R$ ${invoiceLimit.toFixed(2)} e você já utilizou R$ ${currentDebt.toFixed(2)}.`);
                }
            }

            // 1. Create order in Supabase
            const { data: orderData, error: orderError } = await supabase.from('orders').insert([{
                user_id: user.id,
                product_id: product.id,
                amount: totalAmount,
                quantity: quantity,
                download_link: downloadLink,
                payment_method: paymentMethod,
                status: paymentMethod === 'now' ? 'pending' : 'pending' // 'now' will wait for payment, 'invoice' waits for approval
            }]).select().single();

            if (orderError) throw orderError;

            // 2. If 'now', generate Mercado Pago preference and redirect
            if (paymentMethod === 'now' && orderData) {
                let result;
                try {
                    const invokePromise = supabase.functions.invoke('create-payment-preference', {
                        body: {
                            orderId: orderData.id,
                            items: [
                                {
                                    title: product.name,
                                    quantity: quantity,
                                    unit_price: product.final_price
                                }
                            ],
                            payer: {
                                email: user.email,
                                name: user.user_metadata?.full_name || user.email
                            }
                        }
                    });

                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Timeout: A função demorou muito para responder.')), 15000)
                    );

                    result = await Promise.race([invokePromise, timeoutPromise]);
                } catch (e: any) {
                    throw e;
                }

                const { data: paymentData, error: paymentError } = result as any;

                // Check for custom error in 200 OK response
                if (paymentData && (paymentData.error || paymentData.success === false)) {
                    throw new Error(paymentData.error || 'Erro na API de pagamento.');
                }

                if (paymentError) {
                    console.error('Payment Function Error:', paymentError);
                    throw new Error('Erro ao gerar link de pagamento. Tente novamente.');
                }

                if (paymentData?.init_point) {
                    window.location.href = paymentData.init_point;
                    return; // Stop execution to allow redirect
                } else {
                    throw new Error('Link de pagamento não retornado.');
                }
            }

            onSuccess();
            onClose();
            // alert('Pedido criado com sucesso!'); // Removed as per user request for cleaner UI, or can be replaced with toast if available

        } catch (err: any) {
            console.error('Error creating order:', err);
            setError(err.message || 'Erro ao criar pedido.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !product) return null;

    const total = product.final_price * quantity;

    return (
        <div className="modal-overlay">
            <div className="modal-content card-premium">
                <button className="modal-close" onClick={onClose}>
                    <X size={24} />
                </button>

                <div className="modal-header">
                    <h2>Novo Pedido</h2>
                    <p className="product-name">{product.name}</p>
                </div>

                <div className="modal-body">
                    {product.image_url && (
                        <div className="product-image-preview" style={{
                            width: '100%',
                            height: '200px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            marginBottom: '1.5rem',
                            background: '#f0f0f0'
                        }}>
                            <img
                                src={product.image_url}
                                alt={product.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Quantidade</label>
                        <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        />
                    </div>

                    <div className="form-group">
                        <label>Link para Download (Drive, WeTransfer, etc)</label>
                        <input
                            type="text"
                            placeholder="Cole o link do arquivo aqui..."
                            value={downloadLink}
                            onChange={(e) => setDownloadLink(e.target.value)}
                        />
                    </div>

                    <div className="order-summary">
                        <div className="summary-row">
                            <span>Preço Unitário:</span>
                            <span>R$ {product.final_price.toFixed(2)}</span>
                        </div>
                        <div className="summary-row total">
                            <span>Total:</span>
                            <span>R$ {total.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="payment-methods">
                        <label>Forma de Pagamento</label>
                        <div className="methods-grid">
                            <button
                                className={`method-card ${paymentMethod === 'now' ? 'active' : ''}`}
                                onClick={() => setPaymentMethod('now')}
                            >
                                <DollarSign size={24} />
                                <span>Pagar Agora</span>
                                <small>Pix ou Cartão</small>
                            </button>

                            <button
                                className={`method-card ${paymentMethod === 'invoice' ? 'active' : ''}`}
                                onClick={() => setPaymentMethod('invoice')}
                            >
                                <FileText size={24} />
                                <span>Faturar</span>
                                <small>Boleto / Crédito</small>
                            </button>
                        </div>
                    </div>

                    {paymentMethod === 'invoice' && (
                        <div className="credit-info">
                            <div className="credit-row">
                                <span>Limite Disponível:</span>
                                <span className={(invoiceLimit - currentDebt) < total ? 'text-danger' : 'text-success'}>
                                    R$ {(invoiceLimit - currentDebt).toFixed(2)}
                                </span>
                            </div>
                            {(invoiceLimit - currentDebt) < total && (
                                <div className="error-message">
                                    <AlertCircle size={16} />
                                    <span>Limite insuficiente para este pedido.</span>
                                </div>
                            )}
                        </div>
                    )}

                    {error && (
                        <div className="error-message global-error">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onClose}>Cancelar</button>
                    <button
                        className="btn-confirm"
                        onClick={handleSubmit}
                        disabled={loading || (paymentMethod === 'invoice' && (invoiceLimit - currentDebt) < total)}
                    >
                        {loading ? 'Processando...' : 'Confirmar Pedido'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderModal;
