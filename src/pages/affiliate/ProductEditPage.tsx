import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, Save, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import './ProductRegistrationPage.css'; // Reuse styles

interface ProductFormData {
    name: string;
    description: string;
    material_id: string;
    width: string;
    height: string;
    price_type: string;
    base_price: string;
    final_price: string;
    image_url: string;
    commission_rate: string;
}

const ProductEditPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [materials, setMaterials] = useState<any[]>([]);

    const [formData, setFormData] = useState<ProductFormData>({
        name: '',
        description: '',
        material_id: '',
        width: '',
        height: '',
        price_type: 'fixed', // 'fixed' or 'meter'
        base_price: '',
        final_price: '',
        image_url: '',
        commission_rate: '10'
    });

    useEffect(() => {
        fetchMaterials();
        if (id) {
            fetchProduct(id);
        }
    }, [id]);

    const fetchMaterials = async () => {
        try {
            const { data, error } = await supabase
                .from('materials')
                .select('*')
                .order('name');

            if (error) throw error;
            if (data) setMaterials(data);
        } catch (error) {
            console.error('Error fetching materials:', error);
            toast.error('Erro ao carregar materiais');
        }
    };

    const fetchProduct = async (productId: string) => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', productId)
                .single();

            if (error) throw error;

            if (data) {
                setFormData({
                    name: data.name,
                    description: data.description || '',
                    material_id: data.material_id,
                    width: data.width.toString(),
                    height: data.height.toString(),
                    price_type: data.price_type,
                    base_price: data.base_price?.toString() || '',
                    final_price: data.final_price?.toString() || '',
                    image_url: data.image_url || '',
                    commission_rate: data.commission_rate?.toString() || '10'
                });
            }
        } catch (error) {
            console.error('Error fetching product:', error);
            toast.error('Erro ao carregar produto');
            navigate('/products/my');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    useEffect(() => {
        calculatePrice();
    }, [formData.width, formData.height, formData.material_id, formData.price_type, materials]);

    const calculatePrice = () => {
        if (formData.price_type === 'meter') {
            const width = parseFloat(formData.width);
            const height = parseFloat(formData.height);
            const material = materials.find(m => m.id === formData.material_id);

            if (width && height && material) {
                // Area in m² = (width * height) / 1,000,000 (assuming mm input)
                const area = (width * height) / 1000000;
                const cost = area * material.price_per_m2;

                setFormData(prev => ({
                    ...prev,
                    base_price: cost.toFixed(2),
                    final_price: cost.toFixed(2)
                }));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            const updates = {
                name: formData.name,
                description: formData.description,
                material_id: formData.material_id,
                width: parseFloat(formData.width),
                height: parseFloat(formData.height),
                price_type: formData.price_type,
                base_price: parseFloat(formData.base_price) || 0,
                final_price: parseFloat(formData.final_price),
                image_url: formData.image_url,
                commission_rate: parseFloat(formData.commission_rate) || 10,
                updated_at: new Date()
            };

            const { error } = await supabase
                .from('products')
                .update(updates)
                .eq('id', id);

            if (error) throw error;

            toast.success('Produto atualizado com sucesso!');
            navigate('/products/my');
        } catch (error: any) {
            console.error('Error updating product:', error);
            toast.error(error.message || 'Erro ao atualizar produto');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Carregando...</div>;
    }

    return (
        <div className="product-registration-container">
            <div className="page-header">
                <button onClick={() => navigate('/products/my')} className="back-button">
                    <ArrowLeft size={20} />
                    Voltar
                </button>
                <h1 className="page-title">Editar Produto</h1>
            </div>

            <form onSubmit={handleSubmit} className="product-form">
                <div className="form-group">
                    <label>Nome do Produto</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="form-input"
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Material</label>
                        <select
                            name="material_id"
                            value={formData.material_id}
                            onChange={handleChange}
                            required
                            className="form-select"
                        >
                            <option value="">Selecione um material</option>
                            {materials.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Tipo de Preço</label>
                        <select
                            name="price_type"
                            value={formData.price_type}
                            onChange={handleChange}
                            className="form-select"
                        >
                            <option value="fixed">Preço Fixo</option>
                            <option value="meter">Por Metro Quadrado</option>
                        </select>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Largura (mm)</label>
                        <input
                            type="number"
                            name="width"
                            value={formData.width}
                            onChange={handleChange}
                            required
                            className="form-input"
                        />
                    </div>
                    <div className="form-group">
                        <label>Altura (mm)</label>
                        <input
                            type="number"
                            name="height"
                            value={formData.height}
                            onChange={handleChange}
                            required
                            className="form-input"
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Preço Final (R$)</label>
                        <input
                            type="number"
                            name="final_price"
                            value={formData.final_price}
                            onChange={handleChange}
                            required
                            step="0.01"
                            className="form-input"
                            readOnly={formData.price_type === 'meter'}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>URL da Imagem</label>
                    <div className="input-with-icon">
                        <Upload size={20} />
                        <input
                            type="url"
                            name="image_url"
                            value={formData.image_url}
                            onChange={handleChange}
                            placeholder="https://..."
                            className="form-input"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Comissão de Afiliado (%)</label>
                    <div className="input-with-icon">
                        <FileText size={20} />
                        <input
                            type="number"
                            name="commission_rate"
                            value={formData.commission_rate}
                            onChange={handleChange}
                            placeholder="10"
                            step="0.1"
                            min="0"
                            max="100"
                            className="form-input"
                        />
                    </div>
                    <p className="field-hint" style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.25rem' }}>
                        Porcentagem que o afiliado receberá ao vender este produto.
                    </p>
                </div>

                <div className="form-group">
                    <label>Descrição</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        className="form-textarea"
                    />
                </div>

                <div className="form-actions">
                    <button type="button" onClick={() => navigate('/products/my')} className="btn-secondary">
                        Cancelar
                    </button>
                    <button type="submit" className="btn-primary" disabled={saving}>
                        <Save size={20} />
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProductEditPage;
