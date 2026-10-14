import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Share2, MessageCircle, Heart, Star, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <ShoppingCart size={18} className="text-white" />
              </div>
              <span className="font-bold text-xl text-white">SmartCart <span className="text-indigo-400">AI</span></span>
            </Link>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              Your AI-powered shopping companion. Discover products, compare prices, and get personalized recommendations.
            </p>
            <div className="flex gap-3">
            {[Share2, MessageCircle, Heart, Star].map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-indigo-600 transition-colors">
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {[
                { label: 'All Products', href: '/products' },
                { label: 'Electronics', href: '/products?category=electronics' },
                { label: 'Fashion', href: '/products?category=fashion' },
                { label: 'Home & Kitchen', href: '/products?category=home-kitchen' },
                { label: 'Deals & Offers', href: '/products?sort=price_asc' },
              ].map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="hover:text-indigo-400 transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h3 className="font-semibold text-white mb-4">Customer Support</h3>
            <ul className="space-y-2 text-sm">
              {[
                { label: 'My Orders', href: '/orders' },
                { label: 'Track Order', href: '/orders' },
                { label: 'Returns & Refunds', href: '#' },
                { label: 'FAQ', href: '#' },
                { label: 'Contact Us', href: '#' },
              ].map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="hover:text-indigo-400 transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-indigo-400 flex-shrink-0" />
                <span>support@smartcart.ai</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-indigo-400 flex-shrink-0" />
                <span>+91-1800-SMART-AI</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={14} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                <span>SmartCart Headquarters, Hyderabad, Telangana, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">© 2024 SmartCart AI. All rights reserved.</p>
          <div className="flex gap-4 text-sm text-gray-500">
            <a href="#" className="hover:text-indigo-400">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-400">Terms of Service</a>
            <a href="#" className="hover:text-indigo-400">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
