'use client';

import { Clock, Link2, Zap, Chrome } from 'lucide-react';
import { useState } from 'react';

export default function Home() {
  const [activePlatform, setActivePlatform] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0FF]">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#0A0A0F]/80 border-b border-[#1E1E2E]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[#6C63FF] text-2xl font-bold">C∞</span>
              <span className="text-white text-xl font-semibold">Continuum</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-[#8888AA] hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-[#8888AA] hover:text-white transition-colors">How it works</a>
              <a href="#cta" className="text-[#8888AA] hover:text-white transition-colors">Install</a>
            </div>
            <button className="bg-[#6C63FF] hover:bg-[#5a52e6] text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2">
              <Chrome size={18} />
              Add to Chrome
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(108,99,255,0.05),transparent_50%)]" />
        <div className="max-w-4xl mx-auto text-center relative">
          <p className="text-[#6C63FF] text-sm font-semibold tracking-widest uppercase mb-6">
            Never lose your flow state again
          </p>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6">
            Your AI has a memory now.
          </h1>
          <p className="text-xl md:text-2xl text-[#8888AA] leading-relaxed mb-10 max-w-3xl mx-auto">
            Continuum watches your conversations, saves your project state, and transfers everything to any AI in one click. Hit a limit on Claude? Keep building on ChatGPT in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button className="bg-[#6C63FF] hover:bg-[#5a52e6] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors">
              Add to Chrome — It's Free
            </button>
            <button className="border border-[#1E1E2E] hover:border-[#6C63FF] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors">
              See how it works
            </button>
          </div>
          <p className="text-sm text-[#8888AA]">
            Built for developers who build with AI
          </p>
        </div>
      </section>

      {/* PROBLEM SECTION */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-16 text-center">The Problem</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-8">
              <div className="w-12 h-12 bg-[#6C63FF]/10 rounded-xl flex items-center justify-center mb-6">
                <Clock className="text-[#6C63FF]" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">5 hours wasted.</h3>
              <p className="text-[#8888AA] leading-relaxed">
                Claude hits its limit. You either wait or start over. Most people wait.
              </p>
            </div>
            <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-8">
              <div className="w-12 h-12 bg-[#6C63FF]/10 rounded-xl flex items-center justify-center mb-6">
                <Link2 className="text-[#6C63FF]" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Context dies every time.</h3>
              <p className="text-[#8888AA] leading-relaxed">
                Every AI starts from zero. Your stack, decisions, bugs — re-explained from scratch.
              </p>
            </div>
            <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-8">
              <div className="w-12 h-12 bg-[#6C63FF]/10 rounded-xl flex items-center justify-center mb-6">
                <Zap className="text-[#6C63FF]" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Flow state destroyed.</h3>
              <p className="text-[#8888AA] leading-relaxed">
                The best builders lose hours every day just managing AI tool limits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-16 text-center">How it works</h2>
          <div className="relative">
            <div className="hidden md:block absolute top-8 left-16 right-16 h-0.5 border-t-2 border-dashed border-[#1E1E2E]" />
            <div className="grid md:grid-cols-4 gap-8">
              <div className="relative">
                <div className="w-16 h-16 bg-[#6C63FF] rounded-2xl flex items-center justify-center text-2xl font-bold mb-4 relative z-10">
                  1
                </div>
                <h3 className="text-xl font-bold mb-2">Build</h3>
                <p className="text-[#8888AA]">
                  You build your project normally on any AI tool
                </p>
              </div>
              <div className="relative">
                <div className="w-16 h-16 bg-[#6C63FF] rounded-2xl flex items-center justify-center text-2xl font-bold mb-4 relative z-10">
                  2
                </div>
                <h3 className="text-xl font-bold mb-2">Track</h3>
                <p className="text-[#8888AA]">
                  Continuum silently extracts decisions, bugs, tasks as you go
                </p>
              </div>
              <div className="relative">
                <div className="w-16 h-16 bg-[#6C63FF] rounded-2xl flex items-center justify-center text-2xl font-bold mb-4 relative z-10">
                  3
                </div>
                <h3 className="text-xl font-bold mb-2">Limit hit</h3>
                <p className="text-[#8888AA]">
                  Continuum detects the limit message automatically
                </p>
              </div>
              <div className="relative">
                <div className="w-16 h-16 bg-[#6C63FF] rounded-2xl flex items-center justify-center text-2xl font-bold mb-4 relative z-10">
                  4
                </div>
                <h3 className="text-xl font-bold mb-2">Continue</h3>
                <p className="text-[#8888AA]">
                  One click transfers your exact project state to any other AI
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HERO FEATURE SECTION */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">The one-click handoff</h2>
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-3xl p-8 md:p-12">
            <div className="max-w-md mx-auto">
              {/* Mock Extension Popup */}
              <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-2xl p-6 mb-8 shadow-2xl">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#1E1E2E]">
                  <span className="text-[#6C63FF] text-xl font-bold">C∞</span>
                  <span className="text-white font-semibold">Continuum</span>
                </div>
                <p className="text-white mb-6">Claude has reached its limit. Continue on:</p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button 
                    className="bg-[#12121A] border border-[#1E1E2E] hover:border-[#00D4FF] rounded-xl p-4 flex items-center gap-3 transition-colors"
                    onClick={() => setActivePlatform('chatgpt')}
                  >
                    <div className="w-3 h-3 rounded-full bg-[#10a37f]" />
                    <span className="text-white font-medium">ChatGPT</span>
                  </button>
                  <button 
                    className="bg-[#12121A] border border-[#1E1E2E] hover:border-[#00D4FF] rounded-xl p-4 flex items-center gap-3 transition-colors"
                    onClick={() => setActivePlatform('gemini')}
                  >
                    <div className="w-3 h-3 rounded-full bg-[#4285F4]" />
                    <span className="text-white font-medium">Gemini</span>
                  </button>
                  <button 
                    className="bg-[#12121A] border border-[#1E1E2E] hover:border-[#00D4FF] rounded-xl p-4 flex items-center gap-3 transition-colors"
                    onClick={() => setActivePlatform('grok')}
                  >
                    <div className="w-3 h-3 rounded-full bg-[#000000]" />
                    <span className="text-white font-medium">Grok</span>
                  </button>
                  <button 
                    className="bg-[#12121A] border border-[#1E1E2E] hover:border-[#00D4FF] rounded-xl p-4 flex items-center gap-3 transition-colors"
                    onClick={() => setActivePlatform('perplexity')}
                  >
                    <div className="w-3 h-3 rounded-full bg-[#20B8CD]" />
                    <span className="text-white font-medium">Perplexity</span>
                  </button>
                </div>
                <p className="text-xs text-[#8888AA] text-center">
                  Your project context will be transferred automatically
                </p>
              </div>
              <p className="text-[#8888AA] text-center leading-relaxed">
                When Claude hits its limit, Continuum appears. Click any platform. Your full project context is injected and submitted automatically. The new AI responds knowing everything.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section id="cta" className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Start building without limits.
          </h2>
          <p className="text-xl text-[#8888AA] mb-10">
            Free Chrome extension. Works on Claude, ChatGPT, Gemini, and more.
          </p>
          <button className="bg-[#6C63FF] hover:bg-[#5a52e6] text-white px-10 py-5 rounded-xl font-semibold text-xl transition-colors flex items-center gap-3 mx-auto">
            <Chrome size={24} />
            Add to Chrome — It's Free
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#1E1E2E] py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[#6C63FF] text-xl font-bold">C∞</span>
            <span className="text-white font-semibold">Continuum</span>
          </div>
          <div className="flex items-center gap-8 text-[#8888AA]">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
          </div>
          <p className="text-sm text-[#8888AA]">
            Built with zero VC money. Just vibes.
          </p>
        </div>
      </footer>
    </div>
  );
}
