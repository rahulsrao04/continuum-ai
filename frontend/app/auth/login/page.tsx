'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-8">
          <div className="flex items-center gap-2 mb-8 justify-center">
            <span className="text-[#6C63FF] text-2xl font-bold">C∞</span>
            <span className="text-white text-xl font-semibold">Continuum</span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2 text-center">Welcome back</h1>
          <p className="text-[#8888AA] text-center mb-8">
            Enter your email and we'll send you a magic link
          </p>

          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-[#6C63FF]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#6C63FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
              <p className="text-[#8888AA]">Link sent to {email}</p>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-6">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl px-4 py-3 text-white placeholder-[#8888AA] focus:outline-none focus:border-[#6C63FF] transition-colors"
                />
                {error && (
                  <p className="text-red-500 text-sm mt-2">{error}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#6C63FF] hover:bg-[#5a52e6] disabled:bg-[#6C63FF]/50 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                {loading ? 'Sending...' : 'Send magic link'}
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <Link href="/" className="text-[#8888AA] hover:text-white text-sm transition-colors">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
