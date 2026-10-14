import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../api';
import { formatPrice } from '../../components/product/ProductCard';
import { TrendingUp, Users, ShoppingBag, Package, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, sub, icon: Icon, color, link }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5">
    <div className="flex items-start justify-between mb-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      {link && <Link to={link} className="text-indigo-600 hover:text-indigo-700"><ArrowUpRight size={16} /></Link>}
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-500 mt-0.5">{title}</p>
    {sub && <p className="text-xs text-indigo-600 mt-1 font-medium">{sub}</p>}
  </div>
);

const AdminDashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminAPI.getStats(),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  if (isLoading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-32 animate-pulse" />)}
      </div>
    </div>
  );

  const { stats, recentOrders, chartData, topProducts } = data || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm">Welcome back! Here's your store overview.</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={formatPrice(stats?.revenue?.total_revenue || 0)}
          sub={`${formatPrice(stats?.revenue?.monthly_revenue || 0)} this month`}
          icon={TrendingUp} color="bg-green-500" />
        <StatCard title="Total Orders" value={stats?.orders?.total || 0}
          sub={`${stats?.orders?.pending || 0} pending`}
          icon={ShoppingBag} color="bg-blue-500" link="/admin/orders" />
        <StatCard title="Customers" value={stats?.users?.total || 0}
          sub={`+${stats?.users?.new_this_month || 0} this month`}
          icon={Users} color="bg-purple-500" link="/admin/users" />
        <StatCard title="Products" value={stats?.products?.total || 0}
          sub={stats?.products?.low_stock > 0 ? `${stats.products.low_stock} low stock` : 'All stocked'}
          icon={Package} color="bg-orange-500" link="/admin/products" />
      </div>

      {/* Order status breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900">Recent Orders</h2>
            <Link to="/admin/orders" className="text-sm text-indigo-600 hover:underline">View all</Link>
          </div>
          {recentOrders && recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">#{order.order_number}</p>
                    <p className="text-xs text-gray-500">{order.first_name} {order.last_name} • {order.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{formatPrice(order.total)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>{order.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">No orders yet</p>
          )}
        </div>

        <div className="space-y-4">
          {/* Order status breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-bold text-gray-900 mb-4">Order Status</h2>
            {[
              { label: 'Delivered', value: stats?.orders?.delivered || 0, color: 'bg-green-500' },
              { label: 'Pending', value: stats?.orders?.pending || 0, color: 'bg-yellow-500' },
              { label: 'Cancelled', value: stats?.orders?.cancelled || 0, color: 'bg-red-500' },
            ].map(({ label, value, color }) => {
              const total = parseInt(stats?.orders?.total) || 1;
              const pct = Math.round((value / total) * 100);
              return (
                <div key={label} className="mb-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{label}</span><span>{value} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div className={`h-2 ${color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-bold text-gray-900 mb-4">Top Sellers</h2>
            {topProducts && topProducts.length > 0 ? (
              <div className="space-y-2">
                {topProducts.slice(0, 4).map((p, i) => (
                  <div key={p.name} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.sold} sold</p>
                    </div>
                    <p className="text-xs font-bold text-gray-700">{formatPrice(p.revenue)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-xs text-center py-4">No sales data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Revenue chart */}
      {chartData && chartData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-900 mb-4">Revenue Trend (Last 6 months)</h2>
          <div className="flex items-end gap-3 h-32">
            {chartData.map((d) => {
              const maxRevenue = Math.max(...chartData.map((x) => parseFloat(x.revenue)));
              const height = maxRevenue > 0 ? (parseFloat(d.revenue) / maxRevenue) * 100 : 0;
              return (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                  <p className="text-xs font-bold text-indigo-600">{formatPrice(d.revenue)}</p>
                  <div className="w-full bg-indigo-600 rounded-t-lg" style={{ height: `${Math.max(4, height)}%` }} />
                  <p className="text-xs text-gray-500">{d.month}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Low stock alert */}
      {stats?.products?.low_stock > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-orange-500 flex-shrink-0" />
          <p className="text-sm text-orange-800">
            <span className="font-bold">{stats.products.low_stock} products</span> are running low on stock.{' '}
            <Link to="/admin/inventory" className="text-orange-600 font-medium underline">View inventory</Link>
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
