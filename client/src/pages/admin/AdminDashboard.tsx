import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Users, DollarSign, Activity, TrendingUp } from 'lucide-react';

const AdminDashboard: React.FC<{ token: string }> = ({ token }) => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.admin.getStats(token)
            .then(setStats)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [token]);

    if (loading) return <div className="text-white">Loading stats...</div>;
    if (!stats) return <div className="text-red-500">Failed to load stats.</div>;

    const cards = [
        { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Active Subs', value: stats.activeSubs, icon: Activity, color: 'text-green-500', bg: 'bg-green-500/10' },
        { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
        { label: 'Growth', value: '+12%', icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10' }, // Dummy for now
    ];

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white">Dashboard Overview</h2>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, idx) => {
                    const Icon = card.icon;
                    return (
                        <div key={idx} className="bg-slate-900 border border-white/5 p-6 rounded-xl flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${card.bg}`}>
                                <Icon className={`w-6 h-6 ${card.color}`} />
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm">{card.label}</p>
                                <p className="text-2xl font-bold text-white">{card.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Recent Users Table */}
            <div className="bg-slate-900 border border-white/5 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-white/5">
                    <h3 className="text-xl font-bold text-white">Recent Signups</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-slate-400 text-sm uppercase">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Phone</th>
                                <th className="px-6 py-4">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-slate-300">
                            {stats.recentUsers && stats.recentUsers.map((u: any) => (
                                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-medium text-white">{u.full_name}</td>
                                    <td className="px-6 py-4">{u.email}</td>
                                    <td className="px-6 py-4">{u.phone_number || '-'}</td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {new Date(u.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
