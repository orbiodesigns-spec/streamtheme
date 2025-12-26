import React, { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { api } from '../lib/api';
import { themes } from '../themes/registry';
import Navbar from '../components/Navbar';
import { Sparkles, Globe, Smartphone, Shield, ArrowRight, Play } from 'lucide-react';

import { User } from '../lib/types';

interface Layout {
  id: string;
  name: string;
  thumbnail_url: string;
  description: string;
}

const LandingPage: React.FC<{ onLoginClick: () => void; user?: User | null }> = ({ onLoginClick, user }) => {
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const scrollRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: scrollRef });
  const yResult = useTransform(scrollYProgress, [0, 1], [0, 100]);

  useEffect(() => {
    // Ensure dark mode is active for this page if using system classes, 
    // but we will hardcode dark styles for consistency.
    const root = window.document.documentElement;
    root.classList.add('dark');
  }, []);

  useEffect(() => {
    // Fetch layouts and merge with local registry
    api.getLayouts().then((data) => {
      const merged = data.map((layout: any) => {
        const localTheme = Object.values(themes).find((t: any) => t.id === layout.id);
        return {
          ...layout,
          thumbnail_url: localTheme?.thumbnail || layout.thumbnail_url
        };
      });
      setLayouts(merged);
    }).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500 selection:text-white overflow-x-hidden" ref={scrollRef}>
      <Navbar currentPage="home" onLoginClick={onLoginClick} user={user} />

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden pt-20">

        {/* Animated Background Mesh */}
        <div className="absolute inset-0 z-0 opacity-100 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-700/20 rounded-full blur-[150px] animate-pulse-slow" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-700/20 rounded-full blur-[150px] animate-pulse-slow delay-1000" />
          <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-cyan-700/10 rounded-full blur-[120px] animate-pulse-slow delay-500" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto mt-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-semibold tracking-wide uppercase text-gray-300">v2.0 Now Live: 24h Free Trial</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8 text-white"
          >
            Professional overlays <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500">
              made effortlessly.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-xl text-gray-400 max-w-2xl mx-auto mb-12"
          >
            Unlock the ultimate streaming suite. One subscription gives you access to every premium theme, customized in real-time, instantly applied.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={onLoginClick}
              className="relative px-8 py-4 bg-white text-black font-bold text-lg rounded-xl hover:scale-105 transition-transform shadow-[0_0_50px_-15px_rgba(255,255,255,0.5)] flex items-center gap-2"
            >
              Get Started Now <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onLoginClick}
              className="px-8 py-4 bg-white/5 border border-white/10 text-white font-bold text-lg rounded-xl hover:bg-white/10 backdrop-blur-md transition-all flex items-center gap-2"
            >
              <Play className="w-5 h-5 fill-white" /> Try Demo
            </button>
          </motion.div>
        </div>

        {/* Static Image Preview */}
        <motion.div
          style={{ y: yResult, rotateX: 20 }}
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 50 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-20 relative w-full max-w-5xl aspect-[16/9] rounded-2xl border border-white/10 shadow-2xl overflow-hidden hidden md:block"
        >
          {layouts.length > 0 ? (
            <img src={layouts[0].thumbnail_url} alt="Theme Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-900 to-black grid place-items-center">
              <p className="text-gray-500">Loading Preview...</p>
            </div>
          )}
        </motion.div>
      </section>

      {/* FEATURE BENTO GRID */}
      <section className="py-32 px-6 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Built for Broadcasting</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Everything you need to look like a pro, without the technical headache.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 grid-rows-2 h-auto md:h-[600px]">
            {/* Main Feature */}
            <div className="md:col-span-2 md:row-span-2 rounded-3xl p-8 bg-zinc-900/40 border border-white/5 hover:border-blue-500/30 transition-all group relative overflow-hidden flex flex-col justify-end">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 z-10"></div>
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-700"></div>

              <div className="relative z-20">
                <div className="bg-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-white">
                  <Globe className="w-6 h-6" />
                </div>
                <h3 className="text-3xl font-bold mb-2 text-white">Cloud-Based Control</h3>
                <p className="text-gray-300 max-w-md">Update your stream overlay from any device, anywhere in the world. Changes reflect instantly on your broadcast.</p>
              </div>
            </div>

            {/* Secondary Feature 1 */}
            <div className="rounded-3xl p-8 bg-zinc-900/40 border border-white/5 hover:border-purple-500/30 transition-all group flex flex-col justify-between">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-white">Mobile Responsive</h3>
                <p className="text-sm text-gray-400">Control your stream directly from your phone's browser.</p>
              </div>
            </div>

            {/* Secondary Feature 2 */}
            <div className="rounded-3xl p-8 bg-zinc-900/40 border border-white/5 hover:border-pink-500/30 transition-all group flex flex-col justify-between">
              <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center text-pink-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-white">Secure & Reliable</h3>
                <p className="text-sm text-gray-400">99.9% uptime guarantee for critical broadcast infrastructure.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* THEME SHOWCASE */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-bold mb-2 text-white">Premium Library</h2>
              <p className="text-gray-400">Fresh themes added monthly.</p>
            </div>
            <button onClick={onLoginClick} className="text-blue-400 font-bold hover:text-blue-300 flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {layouts.map((layout, i) => (
              <motion.div
                key={layout.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group relative aspect-video bg-zinc-900 rounded-2xl overflow-hidden border border-white/10 hover:border-blue-500/50 hover:shadow-2xl transition-all hover:-translate-y-2"
              >
                {/* Image */}
                <img
                  src={layout.thumbnail_url}
                  alt={layout.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1 block">Esports Ready</span>
                  <h3 className="text-2xl font-bold text-white mb-2">{layout.name}</h3>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                    <div className="bg-white text-black text-xs font-bold px-3 py-1 rounded-full">Pro</div>
                    <div className="bg-white/20 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full">Customizable</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-32 px-6 text-center">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-white/10 rounded-[3rem] p-12 md:p-20 relative overflow-hidden">
          {/* Decor */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px]"></div>

          <div className="relative z-10">
            <h2 className="text-5xl font-black mb-6 text-white">Ready to upgrade?</h2>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">Join thousands of streamers who have elevated their production quality with StreamTheme Master.</p>
            <button
              onClick={onLoginClick}
              className="px-10 py-5 bg-white text-black font-bold text-xl rounded-2xl hover:scale-105 transition-transform shadow-xl"
            >
              Get Access Now
            </button>
            <p className="mt-6 text-sm text-gray-500">No credit card required for trial.</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-6 border-t border-white/5 bg-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-bold text-gray-300">StreamTheme</span>
          </div>
          <div className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Stream Theme Master. All rights reserved.
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-gray-500 hover:text-white transition-colors">Privacy</a>
            <a href="#" className="text-gray-500 hover:text-white transition-colors">Terms</a>
            <a href="#" className="text-gray-500 hover:text-white transition-colors">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;