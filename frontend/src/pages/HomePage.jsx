import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsAPI, categoriesAPI } from '../api';
import ProductCard from '../components/product/ProductCard';
import { ArrowRight, ShoppingBag, Star, Truck, Shield, RefreshCw, Bot, Zap, TrendingUp, ChevronRight } from 'lucide-react';
import { useUIStore } from '../store';

const HeroBanner = () => {
  const { openAIChat } = useUIStore();
  return (
    <section className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white py-20 px-4 overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-white/5 rounded-full" />
      </div>
      <div className="max-w-7xl mx-auto relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-6">
              <Zap size={14} className="text-yellow-400" /> AI-Powered Shopping Experience
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Shop Smarter with <span className="text-yellow-400">AI Assistance</span>
            </h1>
            <p className="text-indigo-200 text-lg mb-8 leading-relaxed">
              Discover products tailored to your needs. Get AI-powered recommendations, honest comparisons, and find the best deals — all in one place.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/products" className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold px-6 py-3 rounded-xl transition-colors flex items-center gap-2">
                <ShoppingBag size={18} /> Shop Now <ArrowRight size={16} />
              </Link>
              <button onClick={openAIChat} className="border-2 border-white/30 hover:border-white hover:bg-white/10 font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2">
                <Bot size={18} /> Ask AI Assistant
              </button>
            </div>
            <div className="flex gap-8 mt-10">
              {[{ label: '50,000+', sub: 'Products' }, { label: '4.8★', sub: 'Avg Rating' }, { label: '2-5 Days', sub: 'Delivery' }].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold">{stat.label}</p>
                  <p className="text-indigo-300 text-sm">{stat.sub}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden md:flex justify-center">
            <div className="relative">
              <img src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600" alt="Shopping"
                className="w-80 h-96 object-cover rounded-3xl shadow-2xl" />
              <div className="absolute -bottom-4 -left-4 bg-white text-gray-900 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="fill-yellow-400 text-yellow-400 w-4 h-4" />
                  <span className="text-sm font-bold">4.9/5 Rating</span>
                </div>
                <p className="text-xs text-gray-500">Based on 12,000+ reviews</p>
              </div>
              <div className="absolute -top-4 -right-4 bg-indigo-500 text-white rounded-2xl p-3 shadow-xl">
                <Bot size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const FeatureBar = () => (
  <section className="bg-white border-y border-gray-100 py-4">
    <div className="max-w-7xl mx-auto px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Truck, title: 'Free Delivery', sub: 'On orders above ₹500' },
          { icon: Shield, title: 'Secure Payment', sub: 'COD & Online options' },
          { icon: RefreshCw, title: 'Easy Returns', sub: '7-day return policy' },
          { icon: Bot, title: 'AI Shopping', sub: 'Personalized recommendations' },
        ].map(({ icon: Icon, title, sub }) => (
          <div key={title} className="flex items-center gap-3 py-2">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon size={18} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{title}</p>
              <p className="text-xs text-gray-500">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const CategoryGrid = ({ categories }) => (
  <section className="max-w-7xl mx-auto px-4 py-10">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-gray-900">Shop by Category</h2>
      <Link to="/products" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1">
        View all <ChevronRight size={16} />
      </Link>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {categories.map((cat) => (
        <Link key={cat.id} to={`/products?category=${cat.slug}`}
          className="group flex flex-col items-center gap-2 p-3 bg-white rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-sm transition-all">
          <div className="w-12 h-12 rounded-xl overflow-hidden">
            <img src={cat.image_url || 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=100'}
              alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200" />
          </div>
          <span className="text-xs font-medium text-gray-700 text-center leading-tight">{cat.name}</span>
          <span className="text-xs text-gray-400">{cat.product_count} items</span>
        </Link>
      ))}
    </div>
  </section>
);

const ProductSection = ({ title, products, link, icon: Icon }) => (
  <section className="max-w-7xl mx-auto px-4 py-8">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={20} className="text-indigo-600" />}
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      </div>
      <Link to={link} className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1">
        View all <ChevronRight size={16} />
      </Link>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  </section>
);

const AISection = () => {
  const { openAIChat } = useUIStore();
  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-8 border border-indigo-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 rounded-full px-3 py-1 text-sm mb-4">
              <Bot size={14} /> AI Shopping Assistant
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Your Personal Shopping Expert</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Chat with our AI to get product recommendations, compare options, analyze images, and get honest reviews — in your preferred language.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {['Budget recommendations', 'Product comparisons', 'Image-based search', 'Multilingual support'].map((feat) => (
                <div key={feat} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs font-bold">✓</span>
                  {feat}
                </div>
              ))}
            </div>
            <button onClick={openAIChat} className="btn-primary flex items-center gap-2">
              <Bot size={18} /> Chat with AI Assistant
            </button>
          </div>
          <div className="hidden md:block">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
              {[
                { role: 'user', text: 'Find me a laptop under ₹50,000 with good battery life' },
                { role: 'ai', text: 'Based on your budget, I recommend the Dell XPS 15 (₹39,990) with 10+ hour battery and excellent build quality! ⭐ 4.5/5' },
                { role: 'user', text: 'Is it good for video editing?' },
                { role: 'ai', text: 'Yes! It has Intel i7, 32GB RAM and RTX 4060 GPU — perfect for 4K editing! 🎬' },
              ].map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                    msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const HomePage = () => {
  const { data: featuredData, isLoading: loadingFeatured } = useQuery({
    queryKey: ['featured-products'],
    queryFn: () => productsAPI.getFeatured(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAll(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: topRatedData } = useQuery({
    queryKey: ['top-rated-products'],
    queryFn: () => productsAPI.getAll({ sort: 'rating_desc', limit: 8 }),
    staleTime: 5 * 60 * 1000,
  });

  const featuredProducts = featuredData?.products || [];
  const categories = categoriesData?.categories || [];
  const topRated = topRatedData?.products || [];

  return (
    <div>
      <HeroBanner />
      <FeatureBar />

      {categories.length > 0 && <CategoryGrid categories={categories} />}

      {loadingFeatured ? (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="h-6 w-48 bg-gray-200 rounded mb-6 animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-square bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                  <div className="h-5 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : featuredProducts.length > 0 ? (
        <ProductSection title="Featured Products" products={featuredProducts} link="/products?featured=true" icon={Star} />
      ) : null}

      <AISection />

      {topRated.length > 0 && (
        <ProductSection title="Top Rated" products={topRated} link="/products?sort=rating_desc" icon={TrendingUp} />
      )}
    </div>
  );
};

export default HomePage;
