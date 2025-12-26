import React, { useState } from 'react';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

interface AdminLoginPageProps {
    onLoginSuccess: (token: string) => void;
}

const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { token } = await api.admin.login(username, password);
            onLoginSuccess(token);
        } catch (err: any) {
            setError(err.message || "Admin login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 w-full max-w-md shadow-2xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="p-3 bg-red-500/10 rounded-full mb-4">
                        <Lock className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
                    <p className="text-slate-400">Restricted Access Only</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-lg mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500 transition-colors"
                            placeholder="admin"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500 transition-colors"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white font-medium py-2.5 rounded-lg hover:from-red-500 hover:to-red-400 transition-all disabled:opacity-50 mt-4"
                    >
                        {loading ? 'Authenticating...' : 'Access Dashboard'}
                    </button>

                    <div className="text-center mt-6">
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="text-slate-500 hover:text-slate-400 text-sm"
                        >
                            Return to Website
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminLoginPage;
