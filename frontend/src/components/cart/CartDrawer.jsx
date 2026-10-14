import React from 'react';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../../store';
import { formatPrice } from '../product/ProductCard';
import ProductImage from '../product/ProductImage';
import toast from 'react-hot-toast';

const CartDrawer = () => {
  const { items, subtotal, isOpen, closeCart, removeFromCart, updateQuantity, isLoading } = useCartStore();

  const handleQuantityChange = async (item, delta) => {
    const newQty = item.quantity + delta;
    if (newQty < 1) return;
    if (newQty > item.stock_quantity) {
      toast.error('Not enough stock');
      return;
    }
    try {
      await updateQuantity(item.id, newQty);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await removeFromCart(itemId);
      toast.success('Removed from cart');
    } catch (err) {
      toast.error('Failed to remove item');
    }
  };

  const shipping = parseFloat(subtotal) >= 500 ? 0 : 49;
  const tax = parseFloat(subtotal) * 0.18;
  const total = parseFloat(subtotal) + shipping + tax;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={closeCart} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900">Shopping Cart</h2>
            {items.length > 0 && (
              <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                {items.reduce((s, i) => s + i.quantity, 0)} items
              </span>
            )}
          </div>
          <button onClick={closeCart} className="p-2 rounded-xl hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-20 h-20 bg-gray-200 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <ShoppingBag size={48} className="text-gray-200 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700">Cart is empty</h3>
              <p className="text-sm text-gray-400 mb-6">Add some products to get started</p>
              <Link to="/products" onClick={closeCart} className="btn-primary text-sm">
                Browse Products
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-3">
                <Link to={`/products/${item.slug}`} onClick={closeCart}>
                  <ProductImage src={item.image} name={item.name} status={item.image_status} className="h-20 w-20 rounded-xl" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${item.slug}`} onClick={closeCart}>
                    <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 hover:text-indigo-600">{item.name}</h4>
                  </Link>
                  <p className="text-sm font-bold text-indigo-600 mt-1">{formatPrice(item.price)}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-2 py-1">
                      <button onClick={() => handleQuantityChange(item, -1)} className="w-5 h-5 flex items-center justify-center hover:text-indigo-600">
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => handleQuantityChange(item, 1)} className="w-5 h-5 flex items-center justify-center hover:text-indigo-600">
                        <Plus size={12} />
                      </button>
                    </div>
                    <button onClick={() => handleRemove(item.id)} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4 space-y-3">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{shipping === 0 ? <span className="text-green-600 font-medium">Free</span> : formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax (18% GST)</span><span>{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
                <span>Total</span><span className="text-indigo-600">{formatPrice(total)}</span>
              </div>
            </div>
            {shipping > 0 && (
              <p className="text-xs text-gray-400 text-center">
                Add {formatPrice(500 - parseFloat(subtotal))} more for free shipping!
              </p>
            )}
            <Link to="/checkout" onClick={closeCart}
              className="btn-primary w-full text-center flex items-center justify-center gap-2">
              Proceed to Checkout <ArrowRight size={16} />
            </Link>
            <Link to="/products" onClick={closeCart}
              className="btn-secondary w-full text-center text-sm">
              Continue Shopping
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
