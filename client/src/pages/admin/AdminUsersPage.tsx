import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Users, Search, Trash2, Key, Shield, ShieldOff, Gift, Ban } from 'lucide-react';

const AdminUsersPage: React.FC<{ token: string }> = ({ token }) => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchUsers = () => {
        api.admin.getUsers(token)
            .then(setUsers)
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchUsers();
    }, [token]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value.toLowerCase());

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(search) ||
        u.full_name.toLowerCase().includes(search) ||
        (u.phone_number && u.phone_number.includes(search))
    );

    const handlePasswordReset = async (id: string) => {
        const newPass = prompt("Enter new password for this user:");
        if (!newPass) return;
        try {
            await api.admin.updateUserPassword(token, id, newPass);
            alert("Password updated successfully");
        } catch (err) {
            alert("Failed to update password");
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        if (!confirm(`Are you sure you want to ${currentStatus ? 'BLOCK' : 'UNBLOCK'} this user?`)) return;
        try {
            await api.admin.toggleUserStatus(token, id, !currentStatus);
            fetchUsers();
        } catch (err) {
            alert("Failed to update status");
        }
    };

    const handleGrantSub = async (id: string) => {
        const months = prompt("Enter months of Premium access to grant (e.g. 1, 6, 12):", "1");
        if (!months) return;
        try {
            await api.admin.grantSubscription(token, id, parseInt(months));
            alert("Subscription granted successfully");
            fetchUsers();
        } catch (err) {
            alert("Failed to grant subscription");
        }
    };

    const handleRevokeSub = async (id: string, planName: string) => {
        if (!confirm(`Are you sure you want to REVOKE the "${planName}" subscription for this user? They will lose access immediately.`)) return;
        try {
            await api.admin.revokeSubscription(token, id);
            alert("Subscription revoked successfully");
            fetchUsers();
        } catch (err) {
            alert("Failed to revoke subscription");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("CRITICAL: Are you sure? This will delete the user and all their data permanently.")) return;
        try {
            await api.admin.deleteUser(token, id);
            fetchUsers();
        } catch (err) {
            alert("Failed to delete user");
        }
    };

    if (loading) return <div className="text-white">Loading users...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Users className="w-8 h-8 text-blue-500" />
                    User Management
                </h2>
                <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={handleSearch}
                        className="bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-blue-500 transition-colors w-64"
                    />
                </div>
            </div>

            <div className="bg-slate-900 border border-white/5 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-slate-400 text-sm uppercase">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Plan</th>
                                <th className="px-6 py-4">Spent</th>
                                <th className="px-6 py-4">Joined</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-slate-300">
                            {filteredUsers.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No users found.</td></tr>
                            ) : filteredUsers.map((u: any) => (
                                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-white">{u.full_name}</div>
                                        <div className="text-xs text-slate-500">{u.email}</div>
                                        {u.phone_number && <div className="text-xs text-slate-600">{u.phone_number}</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        {u.is_active ? (
                                            <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded text-xs font-bold">Active</span>
                                        ) : (
                                            <span className="px-2 py-1 bg-red-500/10 text-red-500 rounded text-xs font-bold">Blocked</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {u.active_plan ? (
                                            <div>
                                                <div className="text-sm font-medium text-blue-400">{u.active_plan}</div>
                                                <div className="text-xs text-slate-500">Expires: {new Date(u.plan_expiry).toLocaleDateString()}</div>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-500">Free</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-mono">
                                        ₹{u.total_spent || 0}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-500">
                                        {new Date(u.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2 flex justify-end">
                                        {u.active_plan && (
                                            <button
                                                onClick={() => handleRevokeSub(u.id, u.active_plan)}
                                                title="Revoke Subscription"
                                                className="p-2 bg-purple-500/10 text-purple-500 rounded hover:bg-purple-500/20 transition-colors"
                                            >
                                                <Ban className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleGrantSub(u.id)}
                                            title="Grant Premium"
                                            className="p-2 bg-yellow-500/10 text-yellow-500 rounded hover:bg-yellow-500/20 transition-colors"
                                        >
                                            <Gift className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handlePasswordReset(u.id)}
                                            title="Reset Password"
                                            className="p-2 bg-blue-500/10 text-blue-500 rounded hover:bg-blue-500/20 transition-colors"
                                        >
                                            <Key className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleToggleStatus(u.id, u.is_active)}
                                            title={u.is_active ? "Block User" : "Unblock User"}
                                            className={`p-2 rounded transition-colors ${u.is_active ? 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20' : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'}`}
                                        >
                                            {u.is_active ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(u.id)}
                                            title="Delete User"
                                            className="p-2 bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition-colors"
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
        </div>
    );
};

export default AdminUsersPage;
