import React from 'react';
import { X, Crown, CalendarX } from 'lucide-react';

interface Props {
    onClose: () => void;
    onUpgrade: () => void;
}

const TrialExpiredModal: React.FC<Props> = ({ onClose, onUpgrade }) => {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl relative scale-100 animate-in zoom-in-95 duration-200">

                {/* Decorative Gradient Top */}
                <div className="h-2 bg-gradient-to-r from-orange-500 to-red-600"></div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-8 text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mb-6">
                        <CalendarX className="w-8 h-8 text-orange-500" />
                    </div>

                    <h2 className="text-2xl font-black text-white mb-2">Trial Already Used</h2>

                    <p className="text-gray-400 mb-8 leading-relaxed">
                        It looks like you've already used your 24-hour free trial. To continue using all features, please upgrade to a Pro plan.
                    </p>

                    <div className="w-full space-y-3">
                        <button
                            onClick={onUpgrade}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-lg shadow-lg hover:shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                        >
                            <Crown className="w-4 h-4" /> View Plans
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-gray-300 font-bold rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrialExpiredModal;
