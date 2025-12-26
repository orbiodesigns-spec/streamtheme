import React, { useState, useEffect } from 'react';
import { User } from '../lib/types';
import { api } from '../lib/api';
import { ArrowLeft, User as UserIcon, Save, Edit2, ShoppingBag, Clock, LogOut, Loader2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
    user: User;
    onLogout: () => void;
    onUserUpdate: (user: User) => void;
}

const ProfilePage: React.FC<Props> = ({ user, onLogout, onUserUpdate }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: user.name,
        phone: user.phone || '0000000000',
        age: user.age || 18
    });

    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        // Refresh user data on mount to ensure history is up to date
        refreshProfile();
    }, []);

    const refreshProfile = async () => {
        setLoading(true);
        try {
            const updatedUser = await api.getProfile();
            onUserUpdate(updatedUser);
            setFormData({
                name: updatedUser.name,
                phone: updatedUser.phone || '',
                age: updatedUser.age || 18
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            await api.updateProfile(formData);
            await refreshProfile();
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500 selection:text-white">
            {/* Background Ambience */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto p-6 md:p-12">
                {/* Header */}
                <header className="flex items-center justify-between mb-12">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        Back to Dashboard
                    </button>

                    <button
                        onClick={onLogout}
                        className="flex items-center gap-2 px-4 py-2 border border-red-500/30 text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut className="w-4 h-4" /> Logout
                    </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* PROFILE CARD */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center flex flex-col items-center">
                            <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-blue-900/20">
                                <span className="text-4xl font-bold">{user.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <h2 className="text-2xl font-bold mb-1">{user.name}</h2>
                            <p className="text-gray-400 text-sm mb-6">{user.email}</p>

                            <div className="w-full h-px bg-white/5 mb-6"></div>

                            <div className="w-full text-left space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Member Since</span>
                                    <span className="text-gray-300">2024</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Account Status</span>
                                    <span className="text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Active</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: FORM & HISTORY */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* EDIT PROFILE */}
                        <section className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Edit2 className="w-5 h-5 text-blue-500" /> Edit Profile
                            </h3>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
                                            placeholder="Your Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
                                            placeholder="Phone Number"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Age</label>
                                        <input
                                            type="number"
                                            value={formData.age}
                                            onChange={e => setFormData({ ...formData, age: parseInt(e.target.value) })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
                                            placeholder="Age"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email (Read Only)</label>
                                        <input
                                            type="email"
                                            value={user.email}
                                            disabled
                                            className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4">
                                    {message && (
                                        <div className={`text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                            {message.text}
                                        </div>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="ml-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </section>

                        {/* PURCHASE HISTORY */}
                        <section className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 overflow-hidden">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-purple-500" /> Purchase & Access History
                            </h3>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-gray-400">
                                    <thead className="text-xs uppercase bg-white/5 text-gray-300">
                                        <tr>
                                            <th className="px-4 py-3 rounded-l-lg">Item</th>
                                            <th className="px-4 py-3">Type</th>
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3">Expires</th>
                                            <th className="px-4 py-3 rounded-r-lg">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {user.purchases && user.purchases.length > 0 ? (
                                            user.purchases.map((purchase, index) => {
                                                const isExpired = new Date(purchase.expiryDate) < new Date();
                                                return (
                                                    <tr key={index} className="hover:bg-white/5 transition-colors">
                                                        <td className="px-4 py-4 font-bold text-white uppercase">{purchase.layoutId.replace('-', ' ')}</td>
                                                        <td className="px-4 py-4 capitalize">{purchase.durationLabel === 'trial' ? 'Trial' : purchase.durationLabel + ' Plan'}</td>
                                                        <td className="px-4 py-4">{new Date(purchase.purchaseDate).toLocaleDateString()}</td>
                                                        <td className="px-4 py-4">{new Date(purchase.expiryDate).toLocaleDateString()}</td>
                                                        <td className="px-4 py-4">
                                                            {isExpired ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 text-red-500 text-xs font-bold">Expired</span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-500/10 text-green-500 text-xs font-bold">Active</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-gray-600 italic">No purchase history found</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
