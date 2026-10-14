import React, { useState } from 'react';
import { useAuthStore } from '../store';
import { authAPI, usersAPI, ordersAPI } from '../api';
import { useQuery } from '@tanstack/react-query';
import { User, Package, MapPin, Key, Loader2, Plus, Edit2, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatPrice } from '../components/product/ProductCard';
import { Link } from 'react-router-dom';

const ProfilePage = () => {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({ first_name: user?.first_name || '', last_name: user?.last_name || '', phone: user?.phone || '' });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [saving, setSaving] = useState(false);

  const { data: ordersData } = useQuery({
    queryKey: ['user-orders'],
    queryFn: () => ordersAPI.getAll({ limit: 5 }),
    enabled: activeTab === 'orders',
  });

  const { data: addressData, refetch: refetchAddresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => usersAPI.getAddresses(),
    enabled: activeTab === 'addresses',
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const data = await authAPI.updateProfile(profileForm);
      updateUser(data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password) { toast.error('Passwords do not match'); return; }
    if (pwForm.new_password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    try {
      setSaving(true);
      await authAPI.changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password });
      toast.success('Password changed successfully!');
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteAddress = async (id) => {
    if (!confirm('Delete this address?')) return;
    try {
      await usersAPI.deleteAddress(id);
      toast.success('Address deleted');
      refetchAddresses();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const TABS = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'security', label: 'Security', icon: Key },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center">
          <span className="text-2xl font-bold text-indigo-600">{user?.first_name?.[0]}{user?.last_name?.[0]}</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{user?.first_name} {user?.last_name}</h1>
          <p className="text-gray-500">{user?.email}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Tabs sidebar */}
        <div className="md:w-48 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 p-2">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === id ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1">
          {/* Profile tab */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5">Personal Information</h2>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
                    <input className="input" value={profileForm.first_name} onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
                    <input className="input" value={profileForm.last_name} onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input className="input bg-gray-50" value={user?.email} disabled />
                  <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                  <input className="input" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" />
                </div>
                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                  {saving ? <Loader2 size={15} className="animate-spin" /> : null} Save Changes
                </button>
              </form>
            </div>
          )}

          {/* Orders tab */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
                <Link to="/orders" className="text-sm text-indigo-600 hover:underline">View all</Link>
              </div>
              {!ordersData ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-200 rounded-xl" />)}
                </div>
              ) : ordersData.orders?.length === 0 ? (
                <div className="text-center py-10">
                  <Package size={32} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">No orders yet</p>
                  <Link to="/products" className="btn-primary text-sm">Start Shopping</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {ordersData.orders.map((order) => (
                    <Link key={order.id} to={`/orders/${order.id}`}
                      className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/50 transition-all">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">#{order.order_number}</p>
                        <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString('en-IN')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{formatPrice(order.total)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>{order.status}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Addresses tab */}
          {activeTab === 'addresses' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">Saved Addresses</h2>
                <Link to="/checkout" className="flex items-center gap-1 text-sm text-indigo-600 hover:underline">
                  <Plus size={14} /> Add via Checkout
                </Link>
              </div>
              {addressData?.addresses?.length === 0 ? (
                <div className="text-center py-10">
                  <MapPin size={32} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500">No addresses saved</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {addressData?.addresses?.map((addr) => (
                    <div key={addr.id} className="p-4 border border-gray-100 rounded-xl">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">{addr.first_name} {addr.last_name}</span>
                            <span className="badge bg-gray-100 text-gray-600">{addr.label}</span>
                            {addr.is_default && <span className="badge bg-green-100 text-green-600">Default</span>}
                          </div>
                          <p className="text-sm text-gray-600">{addr.address_line1}</p>
                          <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.postal_code}</p>
                          {addr.phone && <p className="text-xs text-gray-400 mt-0.5">📞 {addr.phone}</p>}
                        </div>
                        <button onClick={() => deleteAddress(addr.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Security tab */}
          {activeTab === 'security' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5">Change Password</h2>
              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-sm">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
                  <input type="password" className="input" value={pwForm.current_password}
                    onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                  <input type="password" className="input" value={pwForm.new_password}
                    onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })} placeholder="Min 8 characters" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                  <input type="password" className="input" value={pwForm.confirm_password}
                    onChange={(e) => setPwForm({ ...pwForm, confirm_password: e.target.value })} />
                </div>
                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                  {saving ? <Loader2 size={15} className="animate-spin" /> : null} Update Password
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
