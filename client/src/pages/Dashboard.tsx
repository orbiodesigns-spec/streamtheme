import React, { useEffect, useState } from 'react';
import { User, LayoutItem } from '../lib/types';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { Loader2, Clock, Crown, Lock, CheckCircle, AlertTriangle, LogOut, Layout } from 'lucide-react';
import { themes } from '../themes/registry';
import AuthHeader from '../components/AuthHeader';

import TrialExpiredModal from '../components/TrialExpiredModal';

import TrialActivatedModal from '../components/TrialActivatedModal';

interface Props {
  user: User;
  onLogout: () => void;
  onSelectLayout: (layoutId: string) => void;
  onUserUpdate: (user: User) => void;
}

interface AccessStatus {
  hasAccess: boolean;
  accessType: 'SUBSCRIPTION' | 'TRIAL' | 'NONE';
  expiry: string | null;
  trialUsed?: boolean;
}

const Dashboard: React.FC<Props> = ({ user, onLogout, onSelectLayout, onUserUpdate }) => {
  const navigate = useNavigate();
  const [layouts, setLayouts] = useState<LayoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState<AccessStatus>({ hasAccess: false, accessType: 'NONE', expiry: null });
  const [plans, setPlans] = useState<any[]>([]);

  // UI State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showTrialExpiredModal, setShowTrialExpiredModal] = useState(false);
  const [showTrialSuccessModal, setShowTrialSuccessModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [layoutData, accessData, planData] = await Promise.all([
        api.getLayouts(),
        api.getAccessStatus(),
        api.getSubscriptionPlans()
      ]);

      // Merge API data with local Registry data (priority to local assets)
      const mergedLayouts = layoutData.map(layout => {
        const localTheme = Object.values(themes).find((t: any) => t.id === layout.id);
        return {
          ...layout,
          thumbnail_url: localTheme?.thumbnail || layout.thumbnail_url
        };
      });

      setLayouts(mergedLayouts);
      setAccess(accessData);
      setPlans(planData);
    } catch (err) {
      console.error("Dashboard Load Error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrial = async () => {
    setProcessing(true);
    try {
      await api.startTrial();
      await loadDashboardData(); // Refresh access
      setShowUpgradeModal(false);
      setShowTrialSuccessModal(true);
    } catch (err: any) {
      if (err.message && err.message.includes("Trial already used")) {
        setShowUpgradeModal(false); // Close upgrade modal if open
        setShowTrialExpiredModal(true);
      } else {
        alert(err.message || "Failed to start trial");
      }
    } finally {
      setProcessing(false);
    }
  };

  const handlePurchasePlan = async (planId: string) => {
    setProcessing(true);
    try {
      // 1. Load Razorpay
      const loadRazorpay = () => new Promise(resolve => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

      if (!(await loadRazorpay())) {
        alert("Razorpay SDK failed to load");
        setProcessing(false);
        return;
      }

      // 2. Create Order
      const order = await api.createPaymentOrder(planId, user.phone || '0000000000');

      // 3. Open Payment
      const options = {
        key: order.keyId,
        amount: order.amount.toString(),
        currency: order.currency,
        name: "StreamTheme Master",
        description: "Full Access Subscription",
        order_id: order.orderId,
        handler: async (response: any) => {
          try {
            await api.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId: planId
            });
            alert("Subscription Active!");
            setShowUpgradeModal(false);
            loadDashboardData();
          } catch (e) {
            alert("Payment verification failed");
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: order.contact
        },
        theme: {
          color: "#2563eb"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err: any) {
      console.error(err);
      alert("Payment Error: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const getDaysLeft = () => {
    if (!access.expiry) return 0;
    const now = new Date();
    const exp = new Date(access.expiry);
    const diff = exp.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getHoursLeft = () => {
    if (!access.expiry) return 0;
    const now = new Date();
    const exp = new Date(access.expiry);
    const diff = exp.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60)));
  };

  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col">
      <AuthHeader user={user} onLogout={onLogout} />

      {/* HEADER */}
      <header className="py-12 px-6 text-center border-b border-white/5 bg-gradient-to-b from-blue-900/10 to-transparent">
        <h1 className="text-3xl font-bold mb-2">Welcome Back, {user.name}</h1>
        <p className="text-gray-400 mb-4">Manage your stream themes and customize your layouts</p>

        {/* STATUS BADGE */}
        <div className="flex justify-center">
          {access.hasAccess ? (
            <div className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 ${access.accessType === 'TRIAL' ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>
              {access.accessType === 'TRIAL' ? (
                <><Clock className="w-4 h-4" /> TRIAL: {getHoursLeft()}H LEFT</>
              ) : (
                <><Crown className="w-4 h-4" /> PRO: {getDaysLeft()} DAYS LEFT</>
              )}
            </div>
          ) : (
            <div className="px-4 py-2 bg-red-500/10 text-red-500 rounded-full text-sm font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> NO ACTIVE PLAN
            </div>
          )}
        </div>
        {!access.hasAccess && (
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="mt-6 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full font-bold shadow-lg hover:scale-105 transition-transform animate-pulse"
          >
            Unlock Full Access
          </button>
        )}
      </header>

      {/* DASHBOARD CONTENT */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {layouts.map(layout => (
            <div key={layout.id} className="group relative bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 hover:border-blue-500/40 transition-all">

              {/* Image */}
              <div className="aspect-video relative bg-zinc-800">
                {layout.thumbnail_url ? (
                  <img src={layout.thumbnail_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt={layout.name} />
                ) : <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />}

                {/* Overlay if Locked */}
                {!access.hasAccess && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center z-10">
                    <Lock className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm font-bold text-gray-300">Locked</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-5">
                <h3 className="font-bold text-lg mb-1">{layout.name}</h3>
                <p className="text-gray-500 text-sm line-clamp-2 h-10 mb-4">{layout.description}</p>

                {access.hasAccess ? (
                  <button
                    onClick={() => onSelectLayout(layout.id)}
                    className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    Launch Editor <Layout className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="w-full py-3 bg-zinc-800 text-gray-400 font-bold rounded-lg hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
                  >
                    Subscribe to Access
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* UPGRADE MODAL */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl relative">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white z-10"
            >
              <LogOut className="w-6 h-6 rotate-45" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2">

              {/* LEFT: INFO */}
              <div className="p-8 bg-gradient-to-br from-blue-900/40 to-purple-900/40 flex flex-col justify-center">
                <h2 className="text-3xl font-black mb-4">Unlimited Access</h2>
                <ul className="space-y-4 text-gray-300">
                  <li className="flex items-center gap-3"><CheckCircle className="text-green-500 w-5 h-5" /> Access to ALL present & future themes</li>
                  <li className="flex items-center gap-3"><CheckCircle className="text-green-500 w-5 h-5" /> Unlimited Editing & Saves</li>
                  <li className="flex items-center gap-3"><CheckCircle className="text-green-500 w-5 h-5" /> Commercial Usage Rights</li>
                  <li className="flex items-center gap-3"><CheckCircle className="text-green-500 w-5 h-5" /> Priority Support</li>
                </ul>
              </div>

              {/* RIGHT: PLANS */}
              <div className="p-8 bg-zinc-900">
                <h3 className="text-xl font-bold mb-6">Choose Your Plan</h3>

                <div className="space-y-4">
                  {plans && plans.length > 0 ? plans.map(plan => (
                    <button
                      key={plan.id}
                      onClick={() => handlePurchasePlan(plan.id)}
                      disabled={processing}
                      className="w-full p-4 rounded-xl border border-white/10 bg-zinc-800 hover:border-blue-500 hover:bg-zinc-800/80 transition-all text-left flex justify-between items-center group"
                    >
                      <div>
                        <div className="font-bold group-hover:text-blue-400 transition-colors">{plan.name}</div>
                        <div className="text-xs text-gray-500">Billed {plan.duration_months === 1 ? 'Monthly' : 'Yearly'}</div>
                      </div>
                      <div className="text-xl font-bold">₹{plan.price}</div>
                    </button>
                  )) : (
                    <div className="p-4 text-center text-gray-400 animate-pulse">Loading plans...</div>
                  )}
                </div>

                <div className="my-6 border-t border-white/5"></div>

                {/* TRIAL OPTION */}
                <div className="mt-8 pt-6 border-t border-white/10">
                  <h4 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Not sure yet?</h4>
                  <button
                    onClick={handleStartTrial}
                    disabled={processing}
                    className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-xl hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/20 transition-all font-black text-lg flex items-center justify-center gap-3 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Clock className="w-5 h-5 animate-pulse" />
                    <span>START 24HR FREE TRIAL</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {showTrialExpiredModal && (
        <TrialExpiredModal
          onClose={() => setShowTrialExpiredModal(false)}
          onUpgrade={() => {
            setShowTrialExpiredModal(false);
            setTimeout(() => setShowUpgradeModal(true), 100);
          }}
        />
      )}
      {showTrialSuccessModal && (
        <TrialActivatedModal onClose={() => setShowTrialSuccessModal(false)} />
      )}

    </div>
  );
};

export default Dashboard;
