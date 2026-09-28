import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, AlertCircle, ArrowRight, Shield, Wrench, GraduationCap, Lock, Mail } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(location.search.includes('expired') ? 'Your session expired. Please sign in again.' : '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      // Route to appropriate dashboard based on user role
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'MAINTENANCE') {
        navigate('/maintenance/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail, demoRole) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-[#09090c] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Glow Backdrop */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 group mb-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-pink-600 to-pink-400 p-0.5 shadow-pink-glow-sm">
              <div className="h-full w-full rounded-[10px] bg-[#09090c] flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-pink-400" />
              </div>
            </div>
            <span className="text-2xl font-black tracking-tight text-white">
              CAMPUS<span className="text-pink-500">FIX</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold text-white">Welcome back</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Sign in to access your campus facilities portal
          </p>
        </div>

        {/* Demo Fast Login Switcher */}
        <div className="rounded-xl border border-zinc-800 bg-[#121219]/90 p-3 mb-6 backdrop-blur-md">
          <p className="text-[11px] font-bold uppercase tracking-wider text-pink-400 mb-2 text-center">
            ⚡ Quick Demo Accounts
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('student@campusfix.edu', 'STUDENT')}
              className="flex flex-col items-center gap-1 p-2 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:border-pink-500/40 hover:bg-pink-950/20 text-zinc-300 hover:text-white transition-all text-center"
            >
              <GraduationCap className="w-4 h-4 text-pink-400" />
              <span className="text-[10px] font-semibold">Student</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('tech@campusfix.edu', 'MAINTENANCE')}
              className="flex flex-col items-center gap-1 p-2 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:border-amber-500/40 hover:bg-amber-950/20 text-zinc-300 hover:text-white transition-all text-center"
            >
              <Wrench className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] font-semibold">Maintenance</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('admin@campusfix.edu', 'ADMIN')}
              className="flex flex-col items-center gap-1 p-2 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:border-purple-500/40 hover:bg-purple-950/20 text-zinc-300 hover:text-white transition-all text-center"
            >
              <Shield className="w-4 h-4 text-purple-400" />
              <span className="text-[10px] font-semibold">Admin</span>
            </button>
          </div>
        </div>

        {/* Main Form */}
        <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-300 mb-5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-pink-400" />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@campusfix.edu"
                required
                className="w-full rounded-xl border border-zinc-700 bg-[#161622] px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-pink-400" />
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl border border-zinc-700 bg-[#161622] px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-pink-600 hover:bg-pink-500 py-3 text-sm font-bold text-white shadow-pink-glow-sm hover:shadow-pink-glow disabled:opacity-50 transition-all mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  Authenticating...
                </span>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-zinc-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-pink-400 hover:text-pink-300 transition-colors">
              Register now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
