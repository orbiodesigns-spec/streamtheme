import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { CreditCard, DollarSign } from 'lucide-react';

const AdminTransactionsPage: React.FC<{ token: string }> = ({ token }) => {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.admin.getTransactions(token)
            .then(setTransactions)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [token]);

    if (loading) return <div className="text-white">Loading transactions...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                <CreditCard className="w-8 h-8 text-blue-500" />
                Transactions
            </h2>

            <div className="bg-slate-900 border border-white/5 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-slate-400 text-sm uppercase">
                            <tr>
                                <th className="px-6 py-4">Order ID</th>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-slate-300">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        No transactions found.
                                    </td>
                                </tr>
                            ) : transactions.map((tx: any) => (
                                <tr key={tx.order_id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-mono text-sm">{tx.order_id}</td>
                                    <td className="px-6 py-4">
                                        <div>{tx.user_name}</div>
                                        <div className="text-xs text-slate-500">{tx.user_email}</div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-white">₹{tx.amount}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${tx.status === 'PAID' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                            }`}>
                                            {tx.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {new Date(tx.created_at).toLocaleString()}
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

export default AdminTransactionsPage;
