import React, { useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ordersAPI } from '../api';
import { formatPrice } from '../components/product/ProductCard';
import ProductImage from '../components/product/ProductImage';
import { Package, Truck, CheckCircle, Clock, XCircle, MapPin, ChevronRight, ArrowLeft, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  pending: { label: 'Pending', icon: Clock, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  confirmed: { label: 'Confirmed', icon: CheckCircle, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  processing: { label: 'Processing', icon: Package, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  shipped: { label: 'Shipped', icon: Truck, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  out_for_delivery: { label: 'Out for Delivery', icon: Truck, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  delivered: { label: 'Delivered', icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-200' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-red-600 bg-red-50 border-red-200' },
  refunded: { label: 'Refunded', icon: RefreshCw, color: 'text-gray-600 bg-gray-50 border-gray-200' },
};

const ORDER_STEPS = ['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];

const OrdersPage = () => {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['orders', page, status],
    queryFn: () => ordersAPI.getAll({ page, limit: 10, ...(status && { status }) }),
    staleTime: 30000,
  });

  const orders = data?.orders || [];
  const pagination = data?.pagination;

  const handleCancel = async (orderId) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      await ordersAPI.cancel(orderId, 'Customer requested cancellation');
      toast.success('Order cancelled');
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {[{ v: '', l: 'All' }, { v: 'pending', l: 'Pending' }, { v: 'confirmed', l: 'Confirmed' }, { v: 'shipped', l: 'Shipped' }, { v: 'delivered', l: 'Delivered' }, { v: 'cancelled', l: 'Cancelled' }].map((tab) => (
          <button key={tab.v} onClick={() => { setStatus(tab.v); setPage(1); }}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${status === tab.v ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {tab.l}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <Package size={48} className="text-gray-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-700 mb-2">No orders yet</h2>
          <p className="text-gray-400 mb-6">Start shopping to see your orders here</p>
          <Link to="/products" className="btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const StatusIcon = config.icon;
            return (
              <div key={order.id} className="card p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Order #{order.order_number}</p>
                    <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-semibold ${config.color}`}>
                    <StatusIcon size={12} /> {config.label}
                  </div>
                </div>

                {/* Items preview */}
                {order.items && (
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                    {order.items.slice(0, 4).map((item, i) => (
                      <div key={i} className="flex-shrink-0">
                        <ProductImage src={item.product_image} name={item.product_name} className="h-14 w-14 rounded-xl" />
                      </div>
                    ))}
                    {order.items.length > 4 && (
                      <div className="flex-shrink-0 w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center text-sm text-gray-500 font-medium">
                        +{order.items.length - 4}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Total Amount</p>
                    <p className="text-base font-bold text-gray-900">{formatPrice(order.total)}</p>
                  </div>
                  <div className="flex gap-2">
                    {['pending', 'confirmed'].includes(order.status) && (
                      <button onClick={() => handleCancel(order.id)}
                        className="text-sm text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-xl transition-colors border border-red-200">
                        Cancel
                      </button>
                    )}
                    <Link to={`/orders/${order.id}`}
                      className="flex items-center gap-1 text-sm text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-xl transition-colors border border-indigo-200">
                      View Details <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>

                {order.estimated_delivery && order.status !== 'delivered' && order.status !== 'cancelled' && (
                  <p className="text-xs text-gray-400 mt-2">
                    Estimated delivery: {new Date(order.estimated_delivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}
                  </p>
                )}
              </div>
            );
          })}

          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50">Previous</button>
              <span className="px-4 py-2 text-sm text-gray-600">Page {page} of {pagination.pages}</span>
              <button disabled={page === pagination.pages} onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50">Next</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const OrderDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const isNewOrder = location.state?.newOrder;

  const { data, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersAPI.getById(id),
    staleTime: 30000,
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-40 bg-gray-200 rounded-2xl" />
          <div className="h-40 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data?.order) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Order not found</p>
      <Link to="/orders" className="btn-primary mt-4">View Orders</Link>
    </div>
  );

  const { order } = data;
  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = config.icon;
  const stepIndex = ORDER_STEPS.indexOf(order.status);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/orders" className="p-2 hover:bg-gray-100 rounded-xl"><ArrowLeft size={18} /></Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Order #{order.order_number}</h1>
          <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString('en-IN', { dateStyle: 'full' })}</p>
        </div>
      </div>

      {isNewOrder && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle size={24} className="text-green-500 flex-shrink-0" />
          <div>
            <p className="font-bold text-green-800">Order Placed Successfully! 🎉</p>
            <p className="text-sm text-green-700">We'll notify you when your order is shipped.</p>
          </div>
        </div>
      )}

      {/* Status */}
      <div className="card p-5 mb-5">
        <div className={`inline-flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-bold mb-4 ${config.color}`}>
          <StatusIcon size={14} /> {config.label}
        </div>

        {/* Progress tracker */}
        {order.status !== 'cancelled' && order.status !== 'refunded' && (
          <div className="flex items-center gap-0">
            {ORDER_STEPS.map((step, i) => {
              const isComplete = stepIndex >= i;
              const isCurrent = stepIndex === i;
              return (
                <React.Fragment key={step}>
                  <div className={`flex flex-col items-center flex-shrink-0 ${i === 0 ? '' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold ${isComplete ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200 text-gray-400'}`}>
                      {isComplete ? '✓' : i + 1}
                    </div>
                    <p className={`text-xs mt-1 text-center ${isComplete ? 'text-indigo-600 font-medium' : 'text-gray-400'}`} style={{ fontSize: '10px' }}>
                      {STATUS_CONFIG[step]?.label}
                    </p>
                  </div>
                  {i < ORDER_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 -mt-5 ${stepIndex > i ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {order.tracking_number && (
          <div className="mt-4 bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500">Tracking Number</p>
            <p className="text-sm font-bold text-gray-900">{order.tracking_number}</p>
          </div>
        )}
        {order.estimated_delivery && order.status !== 'delivered' && order.status !== 'cancelled' && (
          <p className="text-sm text-gray-500 mt-2">
            Expected by: <span className="font-semibold text-gray-700">{new Date(order.estimated_delivery).toLocaleDateString('en-IN', { dateStyle: 'long' })}</span>
          </p>
        )}
      </div>

      {/* Items */}
      <div className="card p-5 mb-5">
        <h2 className="font-bold text-gray-900 mb-4">Order Items</h2>
        <div className="space-y-3">
          {order.items?.map((item) => (
            <div key={item.id} className="flex gap-3">
              <ProductImage src={item.product_image} name={item.product_name} className="h-16 w-16 rounded-xl" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{item.product_name}</p>
                <p className="text-xs text-gray-500">Qty: {item.quantity} × {formatPrice(item.unit_price)}</p>
              </div>
              <p className="text-sm font-bold text-gray-900">{formatPrice(item.total_price)}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 mt-4 pt-4 space-y-1.5">
          {[
            { l: 'Subtotal', v: formatPrice(order.subtotal) },
            { l: 'Shipping', v: parseFloat(order.shipping_amount) === 0 ? 'Free' : formatPrice(order.shipping_amount) },
            { l: 'Tax (GST)', v: formatPrice(order.tax_amount) },
          ].map(({ l, v }) => (
            <div key={l} className="flex justify-between text-sm text-gray-500">
              <span>{l}</span><span>{v}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-100">
            <span>Total</span>
            <span className="text-indigo-600">{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Delivery address */}
      {order.shipping_address && (
        <div className="card p-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={16} className="text-indigo-600" />
            <h2 className="font-bold text-gray-900">Delivery Address</h2>
          </div>
          <p className="text-sm font-semibold text-gray-900">{order.shipping_address.first_name} {order.shipping_address.last_name}</p>
          <p className="text-sm text-gray-600">{order.shipping_address.address_line1}</p>
          <p className="text-sm text-gray-600">{order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.postal_code}</p>
        </div>
      )}

      {/* Status history */}
      {order.history && order.history.length > 0 && (
        <div className="card p-5">
          <h2 className="font-bold text-gray-900 mb-4">Order History</h2>
          <div className="space-y-3">
            {order.history.map((h) => {
              const hConfig = STATUS_CONFIG[h.status] || STATUS_CONFIG.pending;
              const HIcon = hConfig.icon;
              return (
                <div key={h.id} className="flex gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${hConfig.color}`}>
                    <HIcon size={12} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{hConfig.label}</p>
                    {h.comment && <p className="text-xs text-gray-500">{h.comment}</p>}
                    <p className="text-xs text-gray-400">{new Date(h.created_at).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export { OrdersPage, OrderDetailPage };
