import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { ThemeConfig } from '../lib/types';
import ThemePreview from '../components/ThemePreview';
import { Loader2, AlertTriangle } from 'lucide-react';

const PublicViewPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<{ layoutId: string; config: ThemeConfig | null } | null>(null);

    // Generate Session ID once per load
    const [sessionId] = useState(() => Math.random().toString(36).substring(2) + Date.now().toString(36));

    useEffect(() => {
        let heartbeatInterval: any;

        const load = async () => {
            if (!token) return;

            try {
                const result = await api.getPublicLayout(token, sessionId);

                if (!result) {
                    setError('Invalid Link');
                } else if (result.isExpired) {
                    setError('Stream Offline: Subscription Expired');
                } else {
                    setData({ layoutId: result.layoutId, config: result.config });

                    // Start Heartbeat
                    heartbeatInterval = setInterval(async () => {
                        try {
                            await api.sendHeartbeat(token, sessionId);
                        } catch (err: any) {
                            // Silent fail on heartbeat issues
                            console.warn("Heartbeat failed", err);
                        }
                    }, 10000); // 10 seconds
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load');
            } finally {
                setLoading(false);
            }
        };

        load();

        return () => {
            if (heartbeatInterval) clearInterval(heartbeatInterval);
        };
    }, [token, sessionId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-10 text-center">
                <AlertTriangle className="w-16 h-16 text-red-500 mb-6" />
                <h1 className="text-4xl font-bold mb-4">{error || 'Layout Not Found'}</h1>
                <p className="text-gray-500">Please contact the broadcaster or renew the subscription.</p>
            </div>
        );
    }

    // Render Clean Layout
    // We force 1920x1080 scale to fit window
    return (
        <div className="fixed inset-0 bg-black overflow-hidden flex items-center justify-center">
            <div style={{ width: '1920px', height: '1080px', transform: 'scale(1)', transformOrigin: 'center' }}>
                <ThemePreview
                    theme={data.config || undefined} // Fallback to default if no config saved
                    layoutId={data.layoutId}
                    scale={1}
                />
            </div>
        </div>
    );
};

export default PublicViewPage;
