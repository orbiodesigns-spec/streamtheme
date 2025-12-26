import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Tag, Trash2, Plus, X } from 'lucide-react';

const AdminCouponsPage: React.FC<{ token: string }> = ({ token }) => {
    const [coupons, setCoupons] = useState<any[]>([]);
    const [layouts, setLayouts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Form Stats
    const [formData, setFormData] = useState({
        code: '',
        discount_type: 'PERCENT',
        discount_value: 0,
        description: '',
        layout_id: ''
    });

    const fetchData = async () => {
        try {
            const [cData, lData] = await Promise.all([
                api.admin.getCoupons(token),
                api.admin.getLayouts(token)
            ]);
            setCoupons(cData);
            setLayouts(lData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.admin.createCoupon(token, formData);
            setIsCreating(false);
            setFormData({ code: '', discount_type: 'PERCENT', discount_value: 0, description: '', layout_id: '' });
            fetchData(); // Refresh
        } catch (err) {
            alert('Failed to create coupon');
        }
    };

    const handleDelete = async (code: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            await api.admin.deleteCoupon(token, code);
            fetchData();
        } catch (err) {
            alert('Failed to delete coupon');
        }
    };

    if (loading) return <div className="text-white">Loading coupons...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Tag className="w-8 h-8 text-pink-500" />
                    Coupons
                </h2>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    New Coupon
                </button>
            </div>

            {/* Create Modal/Inline Form */}
            {isCreating && (
                <div className="bg-slate-900 border border-pink-500/30 p-6 rounded-xl relative">
                    <button
                        onClick={() => setIsCreating(false)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <h3 className="text-lg font-bold text-white mb-4">Create New Coupon</h3>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            placeholder="Code (e.g. SALE20)"
                            className="bg-black border border-slate-700 rounded p-2 text-white"
                            value={formData.code}
                            onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            required
                        />
                        <select
                            className="bg-black border border-slate-700 rounded p-2 text-white"
                            value={formData.discount_type}
                            onChange={e => setFormData({ ...formData, discount_type: e.target.value })}
                        >
                            <option value="PERCENT">Percentage (%)</option>
                            <option value="FIXED">Fixed Amount (₹)</option>
                        </select>
                        <input
                            type="number"
                            placeholder="Value"
                            className="bg-black border border-slate-700 rounded p-2 text-white"
                            value={formData.discount_value}
                            onChange={e => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                            required
                        />
                        <select
                            className="bg-black border border-slate-700 rounded p-2 text-white"
                            value={formData.layout_id}
                            onChange={e => setFormData({ ...formData, layout_id: e.target.value })}
                        >
                            <option value="">Apply to All Layouts</option>
                            {layouts.map(l => (
                                <option key={l.id} value={l.id}>{l.name}</option>
                            ))}
                        </select>
                        <input
                            placeholder="Description (Optional)"
                            className="bg-black border border-slate-700 rounded p-2 text-white md:col-span-2"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                        <button type="submit" className="bg-white text-black font-bold py-2 rounded md:col-span-2 hover:bg-slate-200">
                            Create Coupon
                        </button>
                    </form>
                </div>
            )}

            <div className="bg-slate-900 border border-white/5 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-slate-400 text-sm uppercase">
                        <tr>
                            <th className="px-6 py-4">Code</th>
                            <th className="px-6 py-4">Discount</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Applies To</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                        {coupons.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No coupons active.</td></tr>
                        ) : coupons.map((c: any) => (
                            <tr key={c.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 font-mono font-bold text-pink-500">{c.code}</td>
                                <td className="px-6 py-4">
                                    {c.discount_type === 'PERCENT' ? `${c.discount_value}%` : `₹${c.discount_value}`}
                                </td>
                                <td className="px-6 py-4 text-xs">{c.discount_type}</td>
                                <td className="px-6 py-4 text-sm">{c.layout_name || 'All Layouts'}</td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => handleDelete(c.code)}
                                        className="text-red-500 hover:text-red-400 p-1 bg-red-500/10 rounded"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminCouponsPage;
