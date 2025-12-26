import React, { useState } from 'react';
import { Mail, Phone, MapPin, MessageCircle, ChevronDown, ChevronUp, Send, CheckCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import { api } from '../lib/api';

import { User } from '../lib/types';

interface Props {
    user?: User | null;
    onLoginClick: () => void;
}

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border border-white/10 rounded-lg bg-zinc-900 overflow-hidden mb-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 text-left hover:bg-white/5 transition-colors"
            >
                <span className="font-semibold text-lg">{question}</span>
                {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            {isOpen && (
                <div className="p-4 pt-0 text-gray-400 leading-relaxed border-t border-white/5 mt-2">
                    {answer}
                </div>
            )}
        </div>
    );
};

const SupportPage: React.FC<Props> = ({ user, onLoginClick }) => {
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.subject) return alert("Please select a subject");

        setLoading(true);
        try {
            await api.submitSupportQuery(formData);
            setSubmitted(true);
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (err) {
            console.error(err);
            alert("Failed to submit query. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans pt-20">
            <Navbar currentPage="support" onLoginClick={onLoginClick} user={user} />

            {/* Hero */}
            <header className="py-20 px-6 text-center max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                    How can we help?
                </h1>
                <p className="text-xl text-gray-400 mb-8 mx-auto max-w-2xl">
                    We're here to assist you with any questions or issues. Browse our FAQ or reach out directly.
                </p>
            </header>

            <main className="max-w-7xl mx-auto px-6 pb-20">
                {/* Contact Form */}
                <div className="grid md:grid-cols-2 gap-12 mb-20">
                    <div className="bg-zinc-900 rounded-2xl p-8 border border-white/10">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <MessageCircle className="w-6 h-6 text-blue-500" />
                            Send us a message
                        </h2>

                        {submitted ? (
                            <div className="text-center py-12">
                                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
                                <p className="text-gray-400">We'll get back to you within 24 hours.</p>
                                <button
                                    onClick={() => setSubmitted(false)}
                                    className="mt-6 text-blue-500 hover:underline"
                                >
                                    Send another message
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-black border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                        placeholder="Your name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 bg-black border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                        placeholder="your@email.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Subject</label>
                                    <select
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        className="w-full px-4 py-3 bg-black border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                    >
                                        <option value="">Select a subject</option>
                                        <option value="Technical Support">Technical Support</option>
                                        <option value="Billing">Billing</option>
                                        <option value="Feature Request">Feature Request</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Message</label>
                                    <textarea
                                        required
                                        rows={5}
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        className="w-full px-4 py-3 bg-black border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 transition-colors resize-none"
                                        placeholder="Describe your issue or question..."
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? 'Sending...' : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Send Message
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-6">
                        <div className="bg-zinc-900 rounded-2xl p-6 border border-white/10">
                            <Mail className="w-8 h-8 text-blue-500 mb-3" />
                            <h3 className="font-bold mb-2">Email</h3>
                            <p className="text-gray-400">support@streamtheme.com</p>
                        </div>
                        <div className="bg-zinc-900 rounded-2xl p-6 border border-white/10">
                            <Phone className="w-8 h-8 text-blue-500 mb-3" />
                            <h3 className="font-bold mb-2">Phone</h3>
                            <p className="text-gray-400">+1 (555) 123-4567</p>
                        </div>
                        <div className="bg-zinc-900 rounded-2xl p-6 border border-white/10">
                            <MapPin className="w-8 h-8 text-blue-500 mb-3" />
                            <h3 className="font-bold mb-2">Office</h3>
                            <p className="text-gray-400">123 Stream St, Digital City, DC 12345</p>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
                    <FAQItem
                        question="How do I activate my free trial?"
                        answer="After registering, you'll receive an email verification link. Once verified, you can activate your 24-hour free trial from your dashboard with one click."
                    />
                    <FAQItem
                        question="Can I cancel my subscription anytime?"
                        answer="Yes! You can cancel your subscription at any time from your account settings. You'll continue to have access until the end of your billing period."
                    />
                    <FAQItem
                        question="How do I add the overlay to OBS?"
                        answer="In your dashboard, select a theme and click 'Get Browser Source URL'. Copy that URL and add it as a Browser Source in OBS. That's it!"
                    />
                    <FAQItem
                        question="Do you offer refunds?"
                        answer="We offer a 7-day money-back guarantee on all subscriptions. If you're not satisfied, contact us within 7 days of purchase for a full refund."
                    />
                    <FAQItem
                        question="Can I use multiple themes?"
                        answer="Absolutely! Your subscription gives you access to all themes in our library. You can switch between them anytime."
                    />
                </div>
            </main>

            <footer className="py-12 border-t border-white/10 text-center text-gray-500 text-sm">
                <p>© {new Date().getFullYear()} StreamTheme. All rights reserved.</p>
                <div className="flex justify-center gap-6 mt-4">
                    <a href="/" className="hover:text-white transition-colors">Home</a>
                    <a href="/pricing" className="hover:text-white transition-colors">Pricing</a>
                </div>
            </footer>
        </div>
    );
};

export default SupportPage;
