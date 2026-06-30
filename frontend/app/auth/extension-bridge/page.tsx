'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ExtensionBridgePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [extensionConnected, setExtensionConnected] = useState(false);

  useEffect(() => {
    const accessToken = searchParams.get('token');
    if (accessToken) {
      setToken(accessToken);
      
      // Try to send token to extension
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          chrome.runtime.sendMessage(
            'your-extension-id-here', // This will need to be updated with actual extension ID
            { type: 'STORE_AUTH_TOKEN', token: accessToken },
            (response) => {
              if (chrome.runtime.lastError) {
                console.log('Extension not installed or not responding');
              } else {
                setExtensionConnected(true);
                // Redirect to dashboard after successful connection
                setTimeout(() => {
                  router.push('/dashboard');
                }, 1000);
              }
            }
          );
        }
      } catch (error) {
        console.log('Chrome API not available');
      }
    } else {
      // No token, redirect to dashboard
      router.push('/dashboard');
    }
  }, [searchParams, router]);

  const handleCopyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleManualContinue = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4">
      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-4">Connecting Extension</h1>
        
        {extensionConnected ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-[#10A37F] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-[#10A37F] font-semibold mb-2">Extension Connected!</p>
            <p className="text-[#8888AA] text-sm">Redirecting to dashboard...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <p className="text-[#8888AA] mb-4">
                We're trying to connect your Continuum extension. If the extension is installed, it should connect automatically.
              </p>
              <p className="text-[#8888AA] text-sm">
                If the extension doesn't connect, you can manually copy your authentication token and enter it in the extension settings.
              </p>
            </div>

            {token && (
              <div>
                <label className="block text-sm font-semibold text-[#6C63FF] mb-2">
                  Your Authentication Token
                </label>
                <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg p-3 mb-3">
                  <code className="text-xs text-[#8888AA] break-all block">
                    {token.substring(0, 50)}...
                  </code>
                </div>
                <button
                  onClick={handleCopyToken}
                  className="w-full bg-[#6C63FF] hover:bg-[#5a52e6] text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  {copied ? 'Copied!' : 'Copy Token'}
                </button>
              </div>
            )}

            <button
              onClick={handleManualContinue}
              className="w-full border border-[#1E1E2E] hover:border-[#6C63FF] text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Continue to Dashboard
            </button>

            <div className="text-center">
              <Link href="/dashboard" className="text-[#6C63FF] hover:underline text-sm">
                Skip and go to dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
