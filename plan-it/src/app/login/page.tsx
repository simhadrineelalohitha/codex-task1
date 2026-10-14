'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckSquare, ArrowRight, ShieldCheck, Zap, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('demo@taskpulse.io');
  const [password, setPassword] = useState('Demo1234!');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to login');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      toast.success('Welcome back to TaskPulse!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">TaskPulse</h1>
            <p className="text-xs text-zinc-400">Collaborative Sprint & Task Management</p>
          </div>
        </div>

        <div className="mb-6 p-3 bg-indigo-950/40 border border-indigo-800/40 rounded-lg text-xs text-indigo-300">
          <span className="font-semibold text-indigo-200">Demo Account Pre-filled:</span>
          <br />
          Email: <code className="text-white">demo@taskpulse.io</code> | Pass: <code className="text-white">Demo1234!</code>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-zinc-800/70 border border-zinc-700/80 rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-zinc-800/70 border border-zinc-700/80 rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In to Workspace'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-zinc-400 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-indigo-400 hover:underline font-medium">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
