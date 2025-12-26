import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const VerifyEmailPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link.');
            return;
        }

        const verify = async () => {
            try {
                const res = await api.verifyEmail(token);
                setStatus('success');
                setMessage(res.message);
                setTimeout(() => navigate('/login'), 3000); // Redirect after 3s
            } catch (err: any) {
                setStatus('error');
                setMessage(err.message || 'Verification failed.');
            }
        };

        verify();
    }, [token, navigate]);

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
                {status === 'verifying' && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                        <h2 className="text-xl font-bold mb-2">Verifying your email...</h2>
                        <p className="text-gray-400">Please wait while we confirm your account.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center animate-in zoom-in duration-300">
                        <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                        <h2 className="text-2xl font-bold mb-2 text-white">Email Verified!</h2>
                        <p className="text-gray-300 mb-6">{message}</p>
                        <p className="text-gray-500 text-sm">Redirecting to login...</p>
                        <button onClick={() => navigate('/login')} className="mt-4 text-blue-400 hover:text-blue-300 font-bold">
                            Go to Login Now
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center animate-in shake duration-300">
                        <XCircle className="w-16 h-16 text-red-500 mb-4" />
                        <h2 className="text-2xl font-bold mb-2 text-white">Verification Failed</h2>
                        <p className="text-red-300 mb-6">{message}</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-zinc-800 hover:bg-zinc-700 px-6 py-2 rounded-lg font-bold transition-colors"
                        >
                            Return to Login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmailPage;
