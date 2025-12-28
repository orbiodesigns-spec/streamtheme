
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Video, Check, Loader2 } from 'lucide-react';
import ThemePreview from '../components/ThemePreview';
import ThemeEditorPanel from '../components/ThemeEditorPanel';
import AuthHeader from '../components/AuthHeader';
import { themes } from '../themes/registry';
import { ThemeConfig, DEFAULT_THEME, User } from '../lib/types';
import { api } from '../lib/api';

interface Props {
    user: User | null;
    onUserUpdate?: (user: User) => void;
    onLogout: () => void;
}

const EditorPage: React.FC<Props> = ({ user, onUserUpdate, onLogout }) => {
    const { layoutId } = useParams<{ layoutId: string }>();
    console.log('[EditorPage] Mounted with layoutId:', layoutId);
    const navigate = useNavigate();
    const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);
    const [isSaving, setIsSaving] = useState(false);
    const [copied, setCopied] = useState(false);

    // Refresh user data on mount to catch any recent purchases
    useEffect(() => {
        if (user) {
            api.getProfile().then(freshUser => {
                if (onUserUpdate) onUserUpdate(freshUser);
            }).catch(err => console.error("Failed to refresh profile", err));
        }
    }, []);

    useEffect(() => {
        if (user && layoutId) {
            const purchases = user.purchases || [];
            const purchase = purchases.find(p => p.layoutId === layoutId);
            if (purchase) {
                if (purchase.savedThemeConfig) {
                    setTheme(purchase.savedThemeConfig);
                }
            }
        }
    }, [user, layoutId]);

    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };

    const handleCopyOBSLink = () => {
        if (!user || !layoutId) return;

        const purchases = user.purchases || [];
        const purchase = purchases.find(p => p.layoutId === layoutId);

        if (!purchase) {
            alert("Error: Layout not found in your purchases. Please try refreshing the page.");
            return;
        }

        if (!purchase.publicToken) {
            alert("Public Link not generated yet. Please Click 'Save Theme' first.");
            return;
        }

        const url = `${window.location.origin}/view/${purchase.publicToken}`;

        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(err => {
            console.error('Failed to copy API link: ', err);
            alert(`Link (Manual Copy): ${url}`);
        });
    };

    const handleManualSave = async () => {
        if (!user || !layoutId) return;

        // Allow saving to attempt even if client-side purchase record isn't found immediately
        // The server should handle creation/validation
        setIsSaving(true);
        try {
            const updatedUser = await api.saveThemeConfig(layoutId, theme);
            if (updatedUser && onUserUpdate) {
                onUserUpdate(updatedUser);
            }
        } catch (error) {
            console.error("Save failed", error);
            alert("Failed to save configuration");
        } finally {
            setIsSaving(false);
        }
    };

    if (!user) {
        return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Please log in</div>;
    }

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col">
            <AuthHeader user={user} onLogout={onLogout} />

            <div className="flex-1 bg-neutral-900 flex items-center justify-center relative overflow-auto p-10">

                {/* Top Bar */}
                <div className="fixed top-20 left-4 right-4 z-50 flex justify-between pointer-events-none">
                    <button
                        onClick={handleBackToDashboard}
                        className="pointer-events-auto flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full transition-colors backdrop-blur-sm"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>

                    <div className="flex items-center gap-4">
                        {isSaving && (
                            <span className="text-white/50 text-sm flex items-center gap-2 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                                <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                            </span>
                        )}
                    </div>
                </div>

                {/* Background Grid Pattern */}
                <div className="fixed inset-0 opacity-5 pointer-events-none" style={{
                    backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }}></div>

                {/* Fixed Canvas Container 1280x720 */}
                <div
                    style={{
                        width: '1280px',
                        height: '720px',
                        flexShrink: 0
                    }}
                    className="shadow-2xl border border-white/5 bg-black relative z-10"
                >
                    <ThemePreview theme={theme} layoutId={layoutId || 'master-standard'} />
                </div>

                {(() => {
                    const CurrentTheme = themes[layoutId || 'master-standard'] || themes['master-standard'];
                    const ControlsComponent = CurrentTheme.Controls;
                    return (
                        <ThemeEditorPanel
                            onReset={() => setTheme(DEFAULT_THEME)}
                            onSave={handleManualSave}
                            isSaving={isSaving}
                        >
                            <ControlsComponent theme={theme} setTheme={setTheme} />
                        </ThemeEditorPanel>
                    );
                })()}

                <div className="fixed bottom-4 left-4 z-50 flex flex-col items-start gap-2 pointer-events-none">
                    <button
                        onClick={handleCopyOBSLink}
                        className={`pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full transition-all font-bold backdrop-blur-sm shadow-lg ${copied ? 'bg-green-500 text-black' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                    >
                        {copied ? <Check className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                        {copied ? 'Link Copied!' : 'Copy OBS Public Link'}
                    </button>
                    <div className="text-white/30 text-xs font-mono select-none">
                        Layout: {layoutId} • Resolution: 1280x720p (Fixed)
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditorPage;
