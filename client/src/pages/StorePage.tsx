import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { api } from '../lib/api';
import { ShoppingCart, Download, Package, Lock, CheckCircle } from 'lucide-react';
import { Product, User } from '../lib/types';

interface Props {
    user: User | null;
    onLoginClick: () => void;
}

const StorePage: React.FC<Props> = ({ user, onLoginClick }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState<string | null>(null);

    // Success Modal State
    const [purchasedProduct, setPurchasedProduct] = useState<{ name: string, fileUrl: string } | null>(null);

    useEffect(() => {
        api.getProducts()
            .then(setProducts)
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

    const handleBuy = async (product: Product) => {
        if (!user) {
            onLoginClick();
            return;
        }

        setPurchasing(product.id);
        try {
            // 1. Load SDK
            const res = await loadRazorpay();
            if (!res) {
                alert('Razorpay SDK failed to load');
                return;
            }

            // 2. Create Order
            const orderData = await api.createProductOrder(product.id.toString(), user.phone_number || '');

            // 3. Open Razorpay
            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'StreamTheme Store',
                description: `Purchase ${product.name}`,
                order_id: orderData.orderId,
                handler: async function (response: any) {
                    try {
                        const verifyRes = await api.verifyProductPayment({
                            ...response,
                            productId: product.id
                        });

                        if (verifyRes.status === 'SUCCESS') {
                            setPurchasedProduct({
                                name: product.name,
                                fileUrl: verifyRes.fileUrl
                            });
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
                theme: { color: "#10b981" }
            };

            const rzp1 = new (window as any).Razorpay(options);
            rzp1.open();

        } catch (err) {
            console.error(err);
            alert('Purchase failed. Please try again.');
        } finally {
            setPurchasing(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans pt-20">
            <Navbar currentPage="store" onLoginClick={onLoginClick} user={user} />

            <div className="max-w-7xl mx-auto px-6 py-20">
                <header className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500">
                        Digital Store
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Premium digital assets, one-time purchase. Secure instant download.
                    </p>
                </header>

                {loading ? (
                    <div className="text-center py-20 text-gray-500">Loading products...</div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20">
                        <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-500">No products available yet.</h2>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {products.map(product => (
                            <div key={product.id} className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-all hover:-translate-y-1 group">
                                <div className="aspect-video bg-zinc-800 relative">
                                    {product.thumbnail_url ? (
                                        <img src={product.thumbnail_url} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-zinc-600">
                                            <Package className="w-12 h-12" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 bg-black/80 backdrop-blur px-3 py-1 rounded-full border border-white/10 font-bold text-emerald-400">
                                        ₹{product.price}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h3 className="text-2xl font-bold mb-2 group-hover:text-emerald-400 transition-colors">{product.name}</h3>
                                    <p className="text-gray-400 mb-6 line-clamp-2">{product.description}</p>

                                    <button
                                        onClick={() => handleBuy(product)}
                                        disabled={purchasing === product.id}
                                        className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-emerald-400 hover:text-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {purchasing === product.id ? (
                                            "Processing..."
                                        ) : user ? (
                                            <>
                                                <ShoppingCart className="w-5 h-5" />
                                                Buy Now
                                            </>
                                        ) : (
                                            <>
                                                <Lock className="w-4 h-4" />
                                                Login to Buy
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Success Modal */}
            {
                purchasedProduct && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-zinc-900 border border-emerald-500/50 rounded-2xl max-w-md w-full p-8 text-center relative">
                            <div className="mx-auto w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-2">Purchase Successful!</h2>
                            <p className="text-gray-400 mb-6">You now own <strong>{purchasedProduct.name}</strong>.</p>

                            <div className="bg-black/50 p-4 rounded-lg border border-white/10 mb-6 break-all">
                                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Download Link</p>
                                <a href={purchasedProduct.fileUrl} target="_blank" rel="noreferrer" className="text-emerald-400 hover:text-emerald-300 underline font-mono text-sm">
                                    {purchasedProduct.fileUrl}
                                </a>
                            </div>

                            <button
                                onClick={() => setPurchasedProduct(null)}
                                className="bg-white text-black font-bold py-3 px-8 rounded-xl hover:bg-gray-200 transition-colors w-full"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default StorePage;
