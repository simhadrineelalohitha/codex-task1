import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { useAuthStore, useCartStore, useWishlistStore } from '../../store';
import { wishlistAPI } from '../../api';
import ProductImage from './ProductImage';
import toast from 'react-hot-toast';

const formatPrice = (price) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
};

const StarRating = ({ rating, count, size = 'sm' }) => {
  const stars = Array.from({ length: 5 }, (_, i) => i < Math.floor(rating));
  const sizeClass = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {stars.map((filled, i) => (
          <Star key={i} className={`${sizeClass} ${filled ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`} />
        ))}
      </div>
      {count !== undefined && <span className="text-xs text-gray-500">({count})</span>}
    </div>
  );
};

const ProductCard = ({ product, className = '' }) => {
  const { isAuthenticated } = useAuthStore();
  const { addToCart } = useCartStore();
  const { items: wishlistItems, setItems } = useWishlistStore();
  const [addingToCart, setAddingToCart] = React.useState(false);
  const [togglingWishlist, setTogglingWishlist] = React.useState(false);

  const imageUrl = product.primary_image || product.image ||
    (product.image_list && product.image_list[0]?.url);

  const isInWishlist = wishlistItems.some((item) => item.product_id === product.id);
  const discount = product.compare_price
    ? Math.round((1 - parseFloat(product.price) / parseFloat(product.compare_price)) * 100)
    : 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please sign in to add to cart');
      return;
    }
    if (product.stock_quantity === 0) {
      toast.error('Out of stock');
      return;
    }
    try {
      setAddingToCart(true);
      await addToCart(product.id, 1);
      toast.success('Added to cart!');
    } catch (err) {
      toast.error(err.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please sign in to use wishlist');
      return;
    }
    try {
      setTogglingWishlist(true);
      if (isInWishlist) {
        await wishlistAPI.remove(product.id);
        setItems(wishlistItems.filter((i) => i.product_id !== product.id));
        toast.success('Removed from wishlist');
      } else {
        await wishlistAPI.add(product.id);
        setItems([...wishlistItems, { product_id: product.id }]);
        toast.success('Added to wishlist!');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTogglingWishlist(false);
    }
  };

  return (
    <Link to={`/products/${product.slug}`} className={`card group hover:shadow-md transition-all duration-200 ${className}`}>
      {/* Image */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        <ProductImage
          src={imageUrl}
          name={product.name}
          status={product.image_status}
          className="h-full w-full"
          imageClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            -{discount}%
          </span>
        )}
        {product.stock_quantity === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-gray-800 text-xs font-semibold px-3 py-1 rounded-full">Out of Stock</span>
          </div>
        )}
        {/* Wishlist button */}
        <button
          onClick={handleToggleWishlist}
          disabled={togglingWishlist}
          className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
        >
          <Heart size={15} className={isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
        </button>
      </div>

      {/* Content */}
      <div className="p-3">
        {product.brand && (
          <p className="text-xs text-indigo-600 font-medium mb-0.5">{product.brand}</p>
        )}
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1.5 group-hover:text-indigo-600 transition-colors">
          {product.name}
        </h3>
        <StarRating rating={product.rating_average || 0} count={product.rating_count || 0} />
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="text-base font-bold text-gray-900">{formatPrice(product.price)}</span>
            {product.compare_price && (
              <span className="text-xs text-gray-400 line-through ml-1.5">{formatPrice(product.compare_price)}</span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={addingToCart || product.stock_quantity === 0}
            className="w-8 h-8 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"
          >
            <ShoppingCart size={14} className={product.stock_quantity === 0 ? 'text-gray-400' : 'text-white'} />
          </button>
        </div>
      </div>
    </Link>
  );
};

export { StarRating, formatPrice };
export default ProductCard;
