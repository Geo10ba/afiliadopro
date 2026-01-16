import React, { useState, useEffect } from 'react';
import { Upload, Calculator, DollarSign, Save, FileText, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './ProductRegistrationPage.css';

interface Material {
    id: string;
    name: string;
    price_per_m2: number;
}

interface ProductRegistrationFormData {
    name: string;
    pdfUrl: string;
    imageUrl: string;
    width: string;
    height: string;
    materialId: string;
    priceType: 'meter' | 'fixed';
    fixedPrice: string;
    commissionRate: string;
    description: string;
}

const ProductRegistrationPage: React.FC = () => {
    const navigate = useNavigate();
    const [materials, setMaterials] = useState<Material[]>([]);
    const [formData, setFormData] = useState<ProductRegistrationFormData>({
        name: '',
        pdfUrl: '',
        imageUrl: '',
        width: '',
        height: '',
        materialId: '',
        priceType: 'meter',
        fixedPrice: '',
        commissionRate: '10',
        description: ''
    });
    const [calculatedCost, setCalculatedCost] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);


    useEffect(() => {
        fetchMaterials();
        checkUserRole();
    }, []);

    const checkUserRole = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
            if (data?.role === 'admin') {
                setIsAdmin(true);
            }
        }
    };

    useEffect(() => {
        if (formData.priceType === 'meter') {
            calculateCost();
        } else {
            setCalculatedCost(null);
        }
    }, [formData.width, formData.height, formData.materialId, formData.priceType]);

    const fetchMaterials = async () => {
        const { data } = await supabase.from('materials').select('*').order('name');
        if (data) setMaterials(data);
    };

    const calculateCost = () => {
        const width = parseFloat(formData.width);
        const height = parseFloat(formData.height);
        const material = materials.find(m => m.id === formData.materialId);

        if (width && height && material) {
            // Assuming width/height in mm and price per m²
            // Area in m² = (width * height) / 1,000,000
            const area = (width * height) / 1000000;
            const cost = area * material.price_per_m2;
            setCalculatedCost(cost);
        } else {
            setCalculatedCost(null);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error('Usuário não autenticado');

            const finalPrice = formData.priceType === 'fixed'
                ? parseFloat(formData.fixedPrice)
                : calculatedCost;

            const { error } = await supabase.from('products').insert([{
                owner_id: user.id,
                name: formData.name,
                pdf_url: formData.pdfUrl,
                image_url: formData.imageUrl,
                width: formData.priceType === 'meter' ? parseFloat(formData.width) : null,
                height: formData.priceType === 'meter' ? parseFloat(formData.height) : null,
                material_id: formData.priceType === 'meter' ? formData.materialId : null,
                price_type: formData.priceType,
                calculated_cost: calculatedCost,
                commission_rate: parseFloat(formData.commissionRate) || 10,
                fixed_cost: formData.priceType === 'fixed' ? parseFloat(formData.fixedPrice) : null,
                final_price: finalPrice,
                description: formData.description
            }]);

            if (error) throw error;

            // Reset form
            setFormData({
                name: '',
                pdfUrl: '',
                imageUrl: '',
                width: '',
                height: '',
                materialId: '',
                priceType: 'meter',
                fixedPrice: '',
                commissionRate: '10',
                description: ''
            });
            setCalculatedCost(null);


            toast.success('Produto cadastrado com sucesso!');
            navigate('/products/my');

        } catch (error: any) {
            console.error('Error saving product:', error);
            toast.error('Erro ao salvar produto: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="product-registration-container">
            <div className="page-header">
                <h1 className="page-title">Cadastrar Novo Produto</h1>
                <p className="page-subtitle">Preencha os dados para calcular o custo e registrar seu produto.</p>
            </div>

            <div className="registration-content">
                <form onSubmit={handleSubmit} className="product-form card-premium">

                    <div className="form-grid">
                        {/* Left Column */}
                        <div className="form-column">
                            {/* Basic Info */}
                            <div className="form-section">
                                <h3><FileText size={20} /> Informações Básicas</h3>
                                <div className="form-group">
                                    <label>Nome do Produto</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Ex: Caixa Personalizada"
                                        required
                                    />
                                </div>

                                {!isAdmin && (
                                    <div className="form-group">
                                        <label>Link do PDF (Google Drive/Dropbox)</label>
                                        <div className="input-wrapper">
                                            <Upload className="input-icon" size={18} />
                                            <input
                                                type="url"
                                                name="pdfUrl"
                                                value={formData.pdfUrl}
                                                onChange={handleChange}
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label>Link da Imagem (Opcional)</label>
                                    <div className="input-wrapper">
                                        <Upload className="input-icon" size={18} />
                                        <input
                                            type="url"
                                            name="imageUrl"
                                            value={formData.imageUrl}
                                            onChange={handleChange}
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                            </div>


                            {/* Dimensions & Material - Only for 'meter' price type */}
                            {formData.priceType === 'meter' && (
                                <div className="form-section">
                                    <h3><Calculator size={20} /> Medidas e Material</h3>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Largura (mm)</label>
                                            <input
                                                type="number"
                                                name="width"
                                                value={formData.width}
                                                onChange={handleChange}
                                                placeholder="0.0"
                                                step="0.1"
                                                required={formData.priceType === 'meter'}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Altura (mm)</label>
                                            <input
                                                type="number"
                                                name="height"
                                                value={formData.height}
                                                onChange={handleChange}
                                                placeholder="0.0"
                                                step="0.1"
                                                required={formData.priceType === 'meter'}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Material</label>
                                        <select
                                            name="materialId"
                                            value={formData.materialId}
                                            onChange={handleChange}
                                            required={formData.priceType === 'meter'}
                                        >
                                            <option value="">Selecione um material...</option>
                                            {materials.map(m => (
                                                <option key={m.id} value={m.id}>
                                                    {m.name} (R$ {m.price_per_m2.toFixed(2)}/m²)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Observation - Only for 'fixed' price type */}
                            {formData.priceType === 'fixed' && (
                                <div className="form-section">
                                    <h3><MessageSquare size={20} /> Observações</h3>
                                    <div className="form-group">
                                        <label>Observação sobre o produto</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            placeholder="Descreva detalhes importantes sobre o produto..."
                                            rows={4}
                                            className="form-textarea"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column */}
                        <div className="form-column">
                            {/* Pricing */}
                            <div className="form-section pricing-section">
                                <h3><DollarSign size={20} /> Precificação</h3>

                                {formData.priceType === 'meter' && calculatedCost !== null && (
                                    <div className="cost-preview">
                                        <span>Custo Calculado:</span>
                                        <span className="cost-value">R$ {calculatedCost.toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="pricing-options">
                                    <label className={`pricing-option ${formData.priceType === 'meter' ? 'active' : ''}`}>
                                        <input
                                            type="radio"
                                            name="priceType"
                                            value="meter"
                                            checked={formData.priceType === 'meter'}
                                            onChange={handleChange}
                                        />
                                        <span className="option-content">
                                            <span className="option-title">Por Metro</span>
                                            <span className="option-desc">Valor = Custo do material.</span>
                                        </span>
                                    </label>

                                    <label className={`pricing-option ${formData.priceType === 'fixed' ? 'active' : ''}`}>
                                        <input
                                            type="radio"
                                            name="priceType"
                                            value="fixed"
                                            checked={formData.priceType === 'fixed'}
                                            onChange={handleChange}
                                        />
                                        <span className="option-content">
                                            <span className="option-title">Valor Fixo</span>
                                            <span className="option-desc">Definir manualmente.</span>
                                        </span>
                                    </label>
                                </div>

                                {formData.priceType === 'fixed' && (
                                    <div className="form-group fixed-price-input">
                                        <label>Valor Final (R$)</label>
                                        <input
                                            type="number"
                                            name="fixedPrice"
                                            value={formData.fixedPrice}
                                            onChange={handleChange}
                                            placeholder="0.00"
                                            step="0.01"
                                            required={formData.priceType === 'fixed'}
                                        />
                                    </div>
                                )}

                                {isAdmin && (
                                    <div className="form-group" style={{ marginTop: '1rem' }}>
                                        <label>Comissão de Afiliado (%)</label>
                                        <div className="input-with-icon">
                                            <FileText size={20} />
                                            <input
                                                type="number"
                                                name="commissionRate"
                                                value={formData.commissionRate}
                                                onChange={handleChange}
                                                placeholder="10"
                                                step="0.1"
                                                min="0"
                                                max="100"
                                                className="form-input"
                                            />
                                        </div>
                                        <p className="field-hint" style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.25rem' }}>
                                            Porcentagem que o afiliado receberá ao vender este produto. Padrão: 10%.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <button type="submit" className="btn-submit" disabled={loading}>
                                <Save size={20} />
                                {loading ? 'Salvando...' : 'Cadastrar Produto'}
                            </button>
                        </div>
                    </div>

                </form>
            </div >
        </div >
    );
};

export default ProductRegistrationPage;
