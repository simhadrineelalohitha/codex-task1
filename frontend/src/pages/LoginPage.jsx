import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../api';
import { useAuthStore, useCartStore } from '../store';
import { Eye, EyeOff, ShoppingCart, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';
  const { login } = useAuthStore();
  const { fetchCart } = useCartStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (!form.password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setIsLoading(true);
      const data = await authAPI.login(form);
      login(data.user, data.token);
      fetchCart();
      toast.success(`Welcome back, ${data.user.first_name}!`);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'admin') setForm({ email: 'admin@smartcart.ai', password: 'Admin@123456' });
    else setForm({ email: 'customer@smartcart.ai', password: 'password' });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-indigo-600 to-purple-700 items-center justify-center p-12">
        <div className="text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShoppingCart size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Welcome to SmartCart AI</h1>
          <p className="text-indigo-200 text-lg leading-relaxed max-w-sm">
            Shop smarter with AI-powered recommendations, honest product comparisons, and personalized suggestions.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            {[{ v: '50K+', l: 'Products' }, { v: '4.8★', l: 'Avg Rating' }, { v: '2-5d', l: 'Delivery' }].map((s) => (
              <div key={s.l} className="bg-white/10 rounded-xl p-3">
                <p className="text-xl font-bold">{s.v}</p>
                <p className="text-xs text-indigo-200">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <ShoppingCart size={16} className="text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">SmartCart <span className="text-indigo-600">AI</span></span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Sign in to your account</h2>
          <p className="text-gray-500 mb-8">
            Don't have an account? <Link to="/register" className="text-indigo-600 font-medium hover:underline">Create one</Link>
          </p>

          {import.meta.env.DEV && (
            <div className="grid grid-cols-2 gap-2 mb-6">
              <button onClick={() => fillDemo('customer')}
                className="text-xs border border-gray-200 rounded-xl px-3 py-2 hover:bg-gray-50 text-gray-600 transition-colors">
                🛒 Demo Customer
              </button>
              <button onClick={() => fillDemo('admin')}
                className="text-xs border border-gray-200 rounded-xl px-3 py-2 hover:bg-gray-50 text-gray-600 transition-colors">
                👨‍💼 Demo Admin
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com" className={`input ${errors.email ? 'border-red-400' : ''}`} autoComplete="email" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••" className={`input pr-10 ${errors.password ? 'border-red-400' : ''}`} autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2">
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {import.meta.env.DEV && (
            <p className="text-xs text-gray-400 text-center mt-6">
              Demo credentials: customer@smartcart.ai / password
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
