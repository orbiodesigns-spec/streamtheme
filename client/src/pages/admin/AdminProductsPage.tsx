import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Package, Plus, Search, Edit2, Trash2, X, Upload } from 'lucide-react';
import { Product } from '../../lib/types';

const AdminProductsPage: React.FC<{ token: string }> = ({ token }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        file_url: '',
        file_type: 'zip',
        thumbnail_url: '',
        is_active: true
    });

    const fetchProducts = () => {
        api.admin.getProducts(token)
            .then(setProducts)
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchProducts();
    }, [token]);

    const handleOpenModal = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                description: product.description || '',
                price: product.price.toString(),
                file_url: product.file_url,
                file_type: product.file_type,
                thumbnail_url: product.thumbnail_url || '',
                is_active: true // Assuming active if editing, or add field to type if needed
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                description: '',
                price: '',
                file_url: '',
                file_type: 'zip',
                thumbnail_url: '',
                is_active: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                price: parseFloat(formData.price)
            };

            if (editingProduct) {
                await api.admin.updateProduct(token, editingProduct.id, data);
            } else {
                await api.admin.createProduct(token, data);
            }
            setIsModalOpen(false);
            fetchProducts();
        } catch (err) {
            alert("Failed to save product");
            console.error(err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this product?")) return;
        try {
            await api.admin.deleteProduct(token, id);
            fetchProducts();
        } catch (err) {
            alert("Failed to delete product");
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="text-white">Loading products...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Package className="w-8 h-8 text-emerald-500" />
                    Digital Products
                </h2>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Add Product
                </button>
            </div>

            <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                    type="text"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none w-full md:w-96"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((p) => (
                    <div key={p.id} className="bg-slate-900 border border-white/5 rounded-xl overflow-hidden hover:border-emerald-500/50 transition-all">
                        <div className="aspect-video bg-black/50 relative">
                            {p.thumbnail_url ? (
                                <img src={p.thumbnail_url} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-600">
                                    <Package className="w-12 h-12" />
                                </div>
                            )}
                            <div className="absolute top-2 right-2 flex gap-2">
                                <button
                                    onClick={() => handleOpenModal(p)}
                                    className="p-2 bg-black/50 hover:bg-blue-600 rounded-lg text-white transition-colors backdrop-blur"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(p.id)}
                                    className="p-2 bg-black/50 hover:bg-red-600 rounded-lg text-white transition-colors backdrop-blur"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg text-white">{p.name}</h3>
                                <span className="text-emerald-400 font-bold">₹{p.price}</span>
                            </div>
                            <p className="text-slate-400 text-sm line-clamp-2 mb-4">{p.description}</p>
                            <div className="text-xs text-slate-500 font-mono bg-black/30 p-2 rounded">
                                File: {p.file_url ? 'Configured' : 'Missing'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b border-white/10">
                            <h3 className="text-2xl font-bold text-white">
                                {editingProduct ? 'Edit Product' : 'New Product'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Product Name</label>
                                    <input
                                        type="text" required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Price (INR)</label>
                                    <input
                                        type="number" step="0.01" required
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                                <textarea
                                    rows={3}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Detail File URL (Download Link)</label>
                                    <input
                                        type="url" required
                                        placeholder="https://..."
                                        value={formData.file_url}
                                        onChange={e => setFormData({ ...formData, file_url: e.target.value })}
                                        className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Thumbnail URL</label>
                                    <input
                                        type="url"
                                        placeholder="https://..."
                                        value={formData.thumbnail_url}
                                        onChange={e => setFormData({ ...formData, thumbnail_url: e.target.value })}
                                        className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">File Format</label>
                                <select
                                    value={formData.file_type}
                                    onChange={e => setFormData({ ...formData, file_type: e.target.value })}
                                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                                >
                                    <option value="zip">ZIP Archive</option>
                                    <option value="pdf">PDF Document</option>
                                    <option value="iso">ISO Image</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-3 rounded-lg font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-3 rounded-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                                >
                                    {editingProduct ? 'Update Product' : 'Create Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminProductsPage;
