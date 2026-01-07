import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import './MaterialsPage.css';

interface Material {
    id: string;
    name: string;
    price_per_m2: number;
}

const MaterialsPage: React.FC = () => {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [newMaterial, setNewMaterial] = useState({ name: '', price_per_m2: '' });
    const [editForm, setEditForm] = useState({ name: '', price_per_m2: '' });
    const [showAddForm, setShowAddForm] = useState(false);

    useEffect(() => {
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        try {
            const { data, error } = await supabase
                .from('materials')
                .select('*')
                .order('name');

            if (error) throw error;
            setMaterials(data || []);
        } catch (error) {
            console.error('Error fetching materials:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data, error } = await supabase
                .from('materials')
                .insert([{
                    name: newMaterial.name,
                    price_per_m2: parseFloat(newMaterial.price_per_m2)
                }])
                .select();

            if (error) throw error;

            setMaterials([...materials, data[0]]);
            setNewMaterial({ name: '', price_per_m2: '' });
            setShowAddForm(false);
        } catch (error) {
            console.error('Error adding material:', error);
            alert('Erro ao adicionar material');
        }
    };

    const handleUpdate = async (id: string) => {
        try {
            const { error } = await supabase
                .from('materials')
                .update({
                    name: editForm.name,
                    price_per_m2: parseFloat(editForm.price_per_m2)
                })
                .eq('id', id);

            if (error) throw error;

            setMaterials(materials.map(m =>
                m.id === id ? { ...m, name: editForm.name, price_per_m2: parseFloat(editForm.price_per_m2) } : m
            ));
            setIsEditing(null);
        } catch (error) {
            console.error('Error updating material:', error);
            alert('Erro ao atualizar material');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este material?')) return;

        try {
            const { error } = await supabase
                .from('materials')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setMaterials(materials.filter(m => m.id !== id));
        } catch (error) {
            console.error('Error deleting material:', error);
            alert('Erro ao excluir material');
        }
    };

    const startEditing = (material: Material) => {
        setIsEditing(material.id);
        setEditForm({
            name: material.name,
            price_per_m2: material.price_per_m2.toString()
        });
    };

    return (
        <div className="materials-container">
            <div className="materials-header">
                <h1 className="page-title">Gerenciar Materiais</h1>
                <button
                    className="btn-add"
                    onClick={() => setShowAddForm(!showAddForm)}
                >
                    <Plus size={20} />
                    Novo Material
                </button>
            </div>

            {showAddForm && (
                <div className="add-material-card">
                    <h3>Adicionar Novo Material</h3>
                    <form onSubmit={handleAdd} className="material-form">
                        <div className="form-group">
                            <label>Nome do Material</label>
                            <input
                                type="text"
                                value={newMaterial.name}
                                onChange={e => setNewMaterial({ ...newMaterial, name: e.target.value })}
                                placeholder="Ex: MDF 3mm"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Preço por m² (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={newMaterial.price_per_m2}
                                onChange={e => setNewMaterial({ ...newMaterial, price_per_m2: e.target.value })}
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <div className="form-actions">
                            <button type="button" className="btn-cancel" onClick={() => setShowAddForm(false)}>Cancelar</button>
                            <button type="submit" className="btn-save">Salvar</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="materials-list">
                {loading ? (
                    <p>Carregando...</p>
                ) : (
                    <table className="materials-table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Preço / m²</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {materials.map(material => (
                                <tr key={material.id}>
                                    {isEditing === material.id ? (
                                        <>
                                            <td>
                                                <input
                                                    type="text"
                                                    value={editForm.name}
                                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                                    className="edit-input"
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={editForm.price_per_m2}
                                                    onChange={e => setEditForm({ ...editForm, price_per_m2: e.target.value })}
                                                    className="edit-input"
                                                />
                                            </td>
                                            <td className="actions-cell">
                                                <button onClick={() => handleUpdate(material.id)} className="btn-icon save">
                                                    <Save size={18} />
                                                </button>
                                                <button onClick={() => setIsEditing(null)} className="btn-icon cancel">
                                                    <X size={18} />
                                                </button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td>{material.name}</td>
                                            <td>R$ {material.price_per_m2.toFixed(2)}</td>
                                            <td className="actions-cell">
                                                <button onClick={() => startEditing(material)} className="btn-icon edit">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(material.id)} className="btn-icon delete">
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default MaterialsPage;
