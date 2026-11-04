'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/admin/dashboard');
          router.refresh();
        }, 500);
      } else {
        setError(data.error || 'Authentication failed. Please check your credentials.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md space-y-6 bg-clay-milk p-8 sm:p-10 rounded-5xl border-4 border-clay-milk/80 shadow-2xl relative overflow-hidden">
        
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-clay-brown-muted hover:text-clay-wine transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Storefront</span>
          </a>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-clay-paper text-[10px] font-bold text-clay-brown">
            <ShieldCheck className="w-3.5 h-3.5 text-clay-wine" />
            <span>Staff Terminal</span>
          </div>
        </div>

        {/* Logo and Brand Header */}
        <div className="text-center space-y-2">
          <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-clay-pink mx-auto shadow-md bg-white">
            <Image
              src="/images/logo.jpg"
              alt="Dxlea Printing Services Logo"
              fill
              className="object-contain p-1"
              priority
            />
          </div>
          <h1 className="font-serif font-black text-2xl sm:text-3xl text-clay-wine tracking-tight">
            Admin Sign In
          </h1>
          <p className="text-xs text-clay-brown-muted max-w-xs mx-auto">
            Manage print jobs, update order statuses, and scan pickup QR codes
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>Authentication verified! Launching dashboard...</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-serif font-bold text-clay-wine block mb-1">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-clay-brown-muted absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@dxleaprinting.com"
                autoComplete="email"
                className="w-full bg-clay-cream border border-clay-paper rounded-2xl pl-10 pr-3.5 py-2.5 text-xs text-clay-brown placeholder-clay-brown-muted focus:outline-none focus:border-clay-terracotta shadow-clay-inner font-medium"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-serif font-bold text-clay-wine block">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] font-bold text-clay-terracotta hover:underline flex items-center gap-1"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPassword ? 'Hide' : 'Show'}</span>
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-clay-brown-muted absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full bg-clay-cream border border-clay-paper rounded-2xl pl-10 pr-10 py-2.5 text-xs text-clay-brown placeholder-clay-brown-muted focus:outline-none focus:border-clay-terracotta shadow-clay-inner font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-3.5 rounded-full bg-clay-wine hover:bg-clay-wine-dark text-clay-milk font-serif font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-75 mt-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-clay-milk/40 border-t-clay-milk rounded-full animate-spin"></span>
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div className="p-3.5 rounded-2xl bg-clay-cream/80 border border-clay-paper text-[11px] text-clay-brown-muted flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-clay-terracotta flex-shrink-0 mt-0.5" />
          <p>
            Authorized staff access only. Failed attempts are rate-limited and logged for security.
          </p>
        </div>
      </div>
    </div>
  );
}
