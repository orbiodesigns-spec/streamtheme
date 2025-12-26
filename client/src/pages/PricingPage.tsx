import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { User } from '../lib/types';
import Navbar from '../components/Navbar';
import { Check } from 'lucide-react';

interface Plan {
    id: string;
    name: string;
    description: string;
    price: number;
    duration_months: number;
    display_order: number;
}

interface Props {
    user?: User | null;
    onLoginClick: () => void;
}

const PricingPage: React.FC<Props> = ({ user, onLoginClick }) => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState<string | null>(null);

    useEffect(() => {
        api.getSubscriptionPlans()
            .then(setPlans)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleSubscribe = async (plan: Plan) => {
        if (!user) {
            onLoginClick();
            return;
        }

        setPurchasing(plan.id);
        try {
            const res = await loadRazorpay();
            if (!res) {
                alert('Razorpay SDK failed to load');
                return;
            }

            const orderData = await api.createPaymentOrder(plan.id, user.phone_number || '');

            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'StreamTheme Pro',
                description: `Subscribe to ${plan.name}`,
                order_id: orderData.orderId,
                handler: async function (response: any) {
                    try {
                        const verifyRes = await api.verifyPayment({
                            ...response,
                            planId: plan.id
                        });

                        if (verifyRes.status === 'SUCCESS') {
                            alert('Subscription Activated! Redirecting to Dashboard...');
                            window.location.href = '/dashboard';
                        }
                    } catch (err) {
                        alert('Payment verification failed');
                        console.error(err);
                    }
                },
                prefill: {
                    name: user.full_name,
                    email: user.email,
                    contact: user.phone_number
                },
                theme: { color: "#3b82f6" }
            };

            const rzp1 = new (window as any).Razorpay(options);
            rzp1.open();

        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Subscription failed');
        } finally {
            setPurchasing(null);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500 selection:text-white overflow-x-hidden pt-20">
            <Navbar currentPage="pricing" onLoginClick={onLoginClick} user={user} />

            <section className="py-20 px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-3xl mx-auto mb-16"
                >
                    <h1 className="text-5xl font-black mb-6">Simple, transparent pricing.</h1>
                    <p className="text-xl text-gray-400">Choose the plan that fits your streaming journey. All plans include full access to our premium library.</p>
                </motion.div>

                {loading ? (
                    <div className="text-center text-gray-500">Loading plans...</div>
                ) : (
                    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                        {plans.map((plan, i) => (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                className={`relative p-8 rounded-3xl border ${plan.id === 'yearly' ? 'bg-gradient-to-b from-blue-900/20 to-black border-blue-500/50' : 'bg-white/5 border-white/10'} hover:border-white/20 transition-all group flex flex-col`}
                            >
                                {plan.id === 'yearly' && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
                                        Best Value
                                    </div>
                                )}

                                <div className="mb-6">
                                    <h3 className="text-xl font-bold text-gray-300 mb-2">{plan.name}</h3>
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-4xl font-black text-white">₹{plan.price}</span>
                                        <span className="text-gray-500">/ {plan.duration_months === 1 ? 'mo' : plan.duration_months === 6 ? '6mo' : 'yr'}</span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-2">{plan.description}</p>
                                </div>

                                <ul className="space-y-4 mb-8 text-left text-gray-300 flex-1">
                                    <li className="flex items-start gap-3">
                                        <Check className="w-5 h-5 text-green-500 shrink-0" />
                                        <span>Access to all premium themes</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Check className="w-5 h-5 text-green-500 shrink-0" />
                                        <span>Real-time customization</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Check className="w-5 h-5 text-green-500 shrink-0" />
                                        <span>Unlimited updates</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Check className="w-5 h-5 text-green-500 shrink-0" />
                                        <span>24/7 Priority Support</span>
                                    </li>
                                </ul>

                                <button
                                    onClick={() => handleSubscribe(plan)}
                                    disabled={purchasing === plan.id}
                                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${plan.id === 'yearly' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white text-black hover:bg-gray-200'} shadow-lg disabled:opacity-50`}
                                >
                                    {purchasing === plan.id ? 'Processing...' : (user ? 'Choose Plan' : 'Login to Subscribe')}
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default PricingPage;
