import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, LogOut, User as UserIcon } from 'lucide-react';
import { User } from '../lib/types';

interface AuthHeaderProps {
    user: User;
    onLogout: () => void;
    showBackButton?: boolean;
    backTo?: string;
}

const AuthHeader: React.FC<AuthHeaderProps> = ({ user, onLogout, showBackButton = false, backTo = '/dashboard' }) => {
    const navigate = useNavigate();

    return (
        <nav className="h-16 border-b border-white/5 bg-black/50 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-40">
            {/* Logo */}
            <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity"
            >
                <Layout className="w-6 h-6 text-blue-500" />
                StreamTheme
            </button>

            {/* Right Side */}
            <div className="flex items-center gap-4">
                {/* Navigation Links */}
                <div className="hidden md:flex items-center gap-6 mr-2">
                    <button onClick={() => navigate('/pricing')} className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Pricing</button>
                    <button onClick={() => navigate('/store')} className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Store</button>
                    <button onClick={() => navigate('/support')} className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Support</button>
                </div>
                {/* User Avatar */}
                <button
                    onClick={() => navigate('/profile')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                    title="Settings"
                >
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium hidden md:inline">{user.name}</span>
                </button>

                {/* Logout */}
                <button
                    onClick={onLogout}
                    title="Logout"
                    className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </nav>
    );
};

export default AuthHeader;
