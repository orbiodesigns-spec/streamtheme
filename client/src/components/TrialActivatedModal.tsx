import React, { useEffect } from 'react';
import { X, CheckCircle, Zap, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
    onClose: () => void;
}

const TrialActivatedModal: React.FC<Props> = ({ onClose }) => {

    useEffect(() => {
        // Fire confetti when modal opens
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 70 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-green-500/30 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl relative scale-100 animate-in zoom-in-95 duration-200">

                {/* Decorative Gradient Top */}
                <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-400"></div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-8 text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-6 animate-bounce">
                        <Zap className="w-8 h-8 text-green-500 fill-current" />
                    </div>

                    <h2 className="text-2xl font-black text-white mb-2">You're In!</h2>

                    <p className="text-gray-400 mb-8 leading-relaxed">
                        Your 24-hour Pro trial is now active. Enjoy full access to all themes and features.
                    </p>

                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-lg shadow-lg shadow-green-900/20 hover:shadow-green-500/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
                    >
                        Start Creating <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TrialActivatedModal;
