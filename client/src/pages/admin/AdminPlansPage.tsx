import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Loader2, Edit2, CheckCircle, XCircle, DollarSign, Calendar } from 'lucide-react';

interface Plan {
    id: string;
    name: string;
    description: string;
    price: number;
    duration_months: number;
    is_active: number | boolean; // MySQL might return 1/0
    display_order: number;
}

const AdminPlansPage: React.FC<{ token: string }> = ({ token }) => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadPlans();
    }, [token]);

    const loadPlans = async () => {
        setLoading(true);
        try {
            if (!token) return;
            const data = await api.admin.getPlans(token);
            setPlans(data);
        } catch (error) {
            console.error(error);
            alert("Failed to load plans");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPlan) return;

        setSaving(true);
        try {
            if (token) {
                await api.admin.updatePlan(token, editingPlan.id, {
                    price: Number(editingPlan.price),
                    name: editingPlan.name,
                    description: editingPlan.description,
                    is_active: editingPlan.is_active
                });
                alert("Plan updated successfully");
                setEditingPlan(null);
                loadPlans();
            }
        } catch (error) {
            console.error(error);
            alert("Failed to update plan");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-blue-500" /></div>;

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <DollarSign className="text-green-500" /> Subscription Plans
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map(plan => (
                    <div key={plan.id} className="bg-zinc-900 border border-white/10 rounded-xl p-6 relative group hover:border-blue-500/50 transition-all">
                        <div className="absolute top-4 right-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${plan.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {plan.is_active ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                        </div>

                        <h2 className="text-xl font-bold mb-2">{plan.name}</h2>
                        <div className="text-3xl font-black text-white mb-4">₹{plan.price}</div>
                        <p className="text-gray-400 mb-6 h-12 line-clamp-2">{plan.description}</p>

                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {plan.duration_months} Month(s)</span>
                        </div>

                        <button
                            onClick={() => setEditingPlan(plan)}
                            className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <Edit2 className="w-4 h-4" /> Edit Price & Details
                        </button>
                    </div>
                ))}
            </div>

            {/* Edit Modal */}
            {editingPlan && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-md w-full p-6 relative">
                        <h2 className="text-2xl font-bold mb-6">Edit {editingPlan.name}</h2>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-400">DisplayName</label>
                                <input
                                    type="text"
                                    value={editingPlan.name}
                                    onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })}
                                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-400">Price (INR)</label>
                                <input
                                    type="number"
                                    value={editingPlan.price}
                                    onChange={e => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })}
                                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-400">Description</label>
                                <textarea
                                    rows={3}
                                    value={editingPlan.description}
                                    onChange={e => setEditingPlan({ ...editingPlan, description: e.target.value })}
                                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 resize-none"
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(editingPlan.is_active)}
                                        onChange={e => setEditingPlan({ ...editingPlan, is_active: e.target.checked ? 1 : 0 })}
                                        className="w-5 h-5 rounded bg-black border-white/10"
                                    />
                                    <span className="font-bold">Is Active?</span>
                                </label>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setEditingPlan(null)}
                                    className="flex-1 py-3 encoded-lg bg-white/5 hover:bg-white/10 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPlansPage;
