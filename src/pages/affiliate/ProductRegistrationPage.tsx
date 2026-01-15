import React, { useState, useEffect } from 'react';
import { Upload, Calculator, DollarSign, Save, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './ProductRegistrationPage.css';

interface Material {
    id: string;
    name: string;
    price_per_m2: number;
}

const ProductRegistrationPage: React.FC = () => {
    const navigate = useNavigate();
    const [materials, setMaterials] = useState<Material[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        pdfUrl: '',
        imageUrl: '',
        width: '',
        height: '',
        materialId: '',
        priceType: 'meter' as 'meter' | 'fixed',
        fixedPrice: '',
        commissionRate: '10'
    });
    const [calculatedCost, setCalculatedCost] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    // const [imageFile, setImageFile] = useState<File | null>(null);
    // const [imagePreview, setImagePreview] = useState<string | null>(null);

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
        calculateCost();
    }, [formData.width, formData.height, formData.materialId]);

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
                width: parseFloat(formData.width),
                height: parseFloat(formData.height),
                material_id: formData.materialId,
                price_type: formData.priceType,
                calculated_cost: calculatedCost,
                commission_rate: parseFloat(formData.commissionRate) || 10,
                fixed_cost: formData.priceType === 'fixed' ? parseFloat(formData.fixedPrice) : null,
                final_price: finalPrice
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
                commissionRate: '10'
            });
            setCalculatedCost(null);
            // setImageFile(null);
            // setImagePreview(null);

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


                            {/* Dimensions & Material */}
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
                                            required
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
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Material</label>
                                    <select
                                        name="materialId"
                                        value={formData.materialId}
                                        onChange={handleChange}
                                        required
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
                        </div>

                        {/* Right Column */}
                        <div className="form-column">
                            {/* Pricing */}
                            <div className="form-section pricing-section">
                                <h3><DollarSign size={20} /> Precificação</h3>

                                {calculatedCost !== null && (
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
                                            required
                                        />
                                    </div>
                                )}

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
