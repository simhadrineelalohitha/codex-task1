import React, { useState, useEffect } from 'react';
import { wishlistAPI } from '../api';
import { useWishlistStore } from '../store';
import ProductCard from '../components/product/ProductCard';
import { Heart, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

const WishlistPage = () => {
  const { items, setItems } = useWishlistStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    wishlistAPI.get().then((data) => {
      setItems(data.items || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card animate-pulse">
            <div className="aspect-square bg-gray-200" />
            <div className="p-3 space-y-2">
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-5 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Normalize items for ProductCard
  const products = items.map((item) => ({
    id: item.product_id,
    name: item.name,
    slug: item.slug,
    price: item.price,
    compare_price: item.compare_price,
    rating_average: item.rating_average,
    rating_count: item.rating_count,
    primary_image: item.image,
    image_status: item.image_status,
    stock_quantity: 1,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Heart size={22} className="text-red-500 fill-red-500" />
        <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
        {items.length > 0 && (
          <span className="bg-red-100 text-red-600 text-sm font-semibold px-2.5 py-0.5 rounded-full">
            {items.length} items
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <Heart size={56} className="text-gray-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-700 mb-2">Your wishlist is empty</h2>
          <p className="text-gray-400 mb-6">Save products you love to your wishlist</p>
          <Link to="/products" className="btn-primary flex items-center gap-2 mx-auto w-fit">
            <ShoppingBag size={16} /> Explore Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
