import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { MessageSquare, Search, CheckCircle, Clock, Trash2, Mail, User } from 'lucide-react';

const AdminSupportPage: React.FC<{ token: string }> = ({ token }) => {
    const [queries, setQueries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL');

    const fetchQueries = () => {
        api.admin.getSupportQueries(token)
            .then(setQueries)
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchQueries();
    }, [token]);

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'OPEN' ? 'CLOSED' : 'OPEN';
        try {
            await api.admin.updateSupportStatus(token, id, newStatus);
            fetchQueries(); // Refresh
        } catch (err) {
            alert("Failed to update status");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this query?")) return;
        try {
            // Note: Delete method for support queries might need to be added to API if not exists, 
            // but for now we'll assume status update is the primary action or I'll check api.ts again
            // *Self-correction*: I double checked api.ts earlier, deleteSupportQuery wasn't explicitly there but let's stick to status toggling first as requested.
            // Actually, looking at admin.routes.js, there IS a delete route: router.delete('/support/:id'...)
            // So I should ensure api.ts has it. I'll add a fetch call here manually or add it to api.ts in a sec.
            // For safety, I'll direct fetch here or assuming I'll update api.ts next.
            // Let's rely on api object having it or I will add it. 
            // Wait, I saw `updateSupportStatus` but not `deleteSupportQuery` in my previous `api.ts` read? 
            // I'll check `api.ts` one more time before implementing delete.
            // For now, I will omit DELETE button or implement it assuming I'll add the API method.
            // User only asked for "update status solved or unsolved". So I will focus on that first.
        } catch (err) {
            alert("Failed to delete");
        }
    };

    const filteredQueries = queries.filter(q => {
        const matchesSearch =
            q.subject?.toLowerCase().includes(search.toLowerCase()) ||
            q.email.toLowerCase().includes(search.toLowerCase()) ||
            q.message.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'ALL' || q.status === filter;
        return matchesSearch && matchesFilter;
    });

    if (loading) return <div className="text-white">Loading queries...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <MessageSquare className="w-8 h-8 text-blue-500" />
                    Support Queries
                </h2>
                <div className="flex gap-4">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as any)}
                        className="bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-lg focus:outline-none"
                    >
                        <option value="ALL">All Status</option>
                        <option value="OPEN">Open</option>
                        <option value="CLOSED">Solved</option>
                    </select>
                    <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search queries..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none w-64"
                        />
                    </div>
                </div>
            </div>

            <div className="grid gap-4">
                {filteredQueries.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">No queries found.</div>
                ) : filteredQueries.map((q: any) => (
                    <div key={q.id} className="bg-slate-900 border border-white/5 rounded-xl p-6 hover:bg-white/5 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-1">{q.subject || 'No Subject'}</h3>
                                <div className="flex items-center gap-4 text-sm text-slate-400">
                                    <div className="flex items-center gap-1">
                                        <User className="w-4 h-4" /> {q.name}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Mail className="w-4 h-4" /> {q.email}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" /> {new Date(q.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleToggleStatus(q.id, q.status)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${q.status === 'CLOSED'
                                        ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                                        : 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'
                                    }`}
                            >
                                {q.status === 'CLOSED' ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                {q.status === 'CLOSED' ? 'SOLVED' : 'OPEN'}
                            </button>
                        </div>
                        <p className="text-slate-300 whitespace-pre-wrap">{q.message}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminSupportPage;
