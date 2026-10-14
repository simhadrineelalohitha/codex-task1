import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store';
import { ordersAPI, usersAPI } from '../api';
import { formatPrice } from '../components/product/ProductCard';
import ProductImage from '../components/product/ProductImage';
import { CreditCard, MapPin, Plus, CheckCircle, Loader2, ShoppingBag, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const AddressForm = ({ onSave, onCancel }) => {
  const [form, setForm] = useState({
    first_name: '', last_name: '', phone: '', address_line1: '', address_line2: '',
    city: '', state: '', postal_code: '', country: 'India', label: 'Home', is_default: false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.first_name || !form.address_line1 || !form.city || !form.state || !form.postal_code) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      setSaving(true);
      const data = await usersAPI.addAddress(form);
      onSave(data.address);
      toast.success('Address saved!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const STATES = ['Andhra Pradesh', 'Delhi', 'Gujarat', 'Karnataka', 'Kerala', 'Maharashtra', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal', 'Other'];

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">First Name *</label>
          <input className="input text-sm" placeholder="First name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Last Name *</label>
          <input className="input text-sm" placeholder="Last name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
        <input className="input text-sm" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Address Line 1 *</label>
        <input className="input text-sm" placeholder="House/Flat No, Street, Area" value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Address Line 2</label>
        <input className="input text-sm" placeholder="Landmark (optional)" value={form.address_line2} onChange={(e) => setForm({ ...form, address_line2: e.target.value })} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">City *</label>
          <input className="input text-sm" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">State *</label>
          <select className="input text-sm" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}>
            <option value="">State</option>
            {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">PIN Code *</label>
          <input className="input text-sm" placeholder="560001" maxLength={6} value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} />
        </div>
      </div>
      <div className="flex gap-2 items-center">
        <input type="checkbox" id="default-addr" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} className="w-4 h-4 accent-indigo-600" />
        <label htmlFor="default-addr" className="text-sm text-gray-600">Set as default address</label>
      </div>
      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={saving} className="btn-primary text-sm flex items-center gap-1.5">
          {saving ? <Loader2 size={14} className="animate-spin" /> : null} Save Address
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary text-sm">Cancel</button>
      </div>
    </form>
  );
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCartStore();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [step, setStep] = useState(1); // 1=address, 2=payment, 3=review

  useEffect(() => {
    if (items.length === 0) {
      navigate('/products', { replace: true });
      return;
    }

    usersAPI.getAddresses()
      .then((data) => {
        setAddresses(data.addresses || []);
        const defaultAddress = data.addresses?.find((address) => address.is_default) || data.addresses?.[0];
        if (defaultAddress) setSelectedAddress(defaultAddress);
      })
      .catch((error) => toast.error(error.message || 'Unable to load saved addresses'));
  }, [items.length, navigate]);

  const shipping = parseFloat(subtotal) >= 500 ? 0 : 49;
  const tax = parseFloat(subtotal) * 0.18;
  const total = parseFloat(subtotal) + shipping + tax;

  const handlePlaceOrder = async () => {
    if (!selectedAddress) { toast.error('Please select a delivery address'); return; }
    try {
      setPlacing(true);
      const data = await ordersAPI.create({
        shipping_address: selectedAddress,
        payment_method: paymentMethod,
        notes,
      });
      toast.success('Order placed successfully! 🎉');
      clearCart();
      navigate(`/orders/${data.order.id}`, { state: { newOrder: true } });
    } catch (err) {
      toast.error(err.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  const PAYMENT_METHODS = [
    { id: 'cod', label: 'Cash on Delivery', desc: 'Pay when your order arrives', icon: '💵' },
    { id: 'upi', label: 'UPI Payment', desc: 'Pay via PhonePe, GPay, Paytm', icon: '📱' },
    { id: 'card', label: 'Credit/Debit Card', desc: 'Secure card payment', icon: '💳' },
    { id: 'netbanking', label: 'Net Banking', desc: 'Pay via your bank', icon: '🏦' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/products" className="p-2 hover:bg-gray-100 rounded-xl">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {[{ n: 1, l: 'Address' }, { n: 2, l: 'Payment' }, { n: 3, l: 'Review' }].map((s, i) => (
          <React.Fragment key={s.n}>
            <button onClick={() => step > s.n && setStep(s.n)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${step === s.n ? 'bg-indigo-600 text-white' : step > s.n ? 'bg-green-100 text-green-700 cursor-pointer' : 'bg-gray-100 text-gray-400'}`}>
              {step > s.n ? <CheckCircle size={14} /> : <span className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center text-xs">{s.n}</span>}
              {s.l}
            </button>
            {i < 2 && <div className={`flex-1 h-0.5 ${step > s.n ? 'bg-green-400' : 'bg-gray-200'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Address */}
          {step === 1 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-indigo-600" />
                  <h2 className="font-bold text-gray-900">Delivery Address</h2>
                </div>
                <button onClick={() => setShowAddressForm(true)} className="flex items-center gap-1 text-sm text-indigo-600 hover:underline">
                  <Plus size={14} /> Add New
                </button>
              </div>

              {showAddressForm ? (
                <AddressForm onSave={(addr) => { setAddresses([...addresses, addr]); setSelectedAddress(addr); setShowAddressForm(false); }}
                  onCancel={() => setShowAddressForm(false)} />
              ) : addresses.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin size={32} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">No saved addresses</p>
                  <button onClick={() => setShowAddressForm(true)} className="btn-primary text-sm">Add Address</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <button key={addr.id} onClick={() => setSelectedAddress(addr)}
                      className={`w-full text-left p-4 border-2 rounded-xl transition-all ${selectedAddress?.id === addr.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-200'}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-gray-900">{addr.first_name} {addr.last_name}</span>
                            <span className="badge bg-gray-100 text-gray-600">{addr.label}</span>
                            {addr.is_default && <span className="badge bg-green-100 text-green-600">Default</span>}
                          </div>
                          <p className="text-sm text-gray-600">{addr.address_line1}{addr.address_line2 && `, ${addr.address_line2}`}</p>
                          <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.postal_code}</p>
                          {addr.phone && <p className="text-sm text-gray-500 mt-0.5">📞 {addr.phone}</p>}
                        </div>
                        {selectedAddress?.id === addr.id && <CheckCircle size={18} className="text-indigo-600 flex-shrink-0" />}
                      </div>
                    </button>
                  ))}
                  <button onClick={() => setStep(2)} disabled={!selectedAddress} className="btn-primary w-full mt-4">
                    Continue to Payment
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-5">
                <CreditCard size={18} className="text-indigo-600" />
                <h2 className="font-bold text-gray-900">Payment Method</h2>
              </div>
              <div className="space-y-3 mb-6">
                {PAYMENT_METHODS.map((method) => (
                  <button key={method.id} onClick={() => setPaymentMethod(method.id)}
                    className={`w-full text-left p-4 border-2 rounded-xl transition-all flex items-center gap-4 ${paymentMethod === method.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-200'}`}>
                    <span className="text-2xl">{method.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{method.label}</p>
                      <p className="text-xs text-gray-500">{method.desc}</p>
                    </div>
                    {paymentMethod === method.id && <CheckCircle size={18} className="text-indigo-600" />}
                  </button>
                ))}
              </div>
              {(paymentMethod === 'upi' || paymentMethod === 'card' || paymentMethod === 'netbanking') && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
                  <p className="text-sm text-yellow-800">ℹ️ This is a demo app. No actual payment will be processed. Use COD for realistic demo experience.</p>
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Order Notes (optional)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special instructions for delivery..."
                  className="input resize-none text-sm" rows={3} />
              </div>
              <button onClick={() => setStep(3)} className="btn-primary w-full">Review Order</button>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-5">
                <ShoppingBag size={18} className="text-indigo-600" />
                <h2 className="font-bold text-gray-900">Review Order</h2>
              </div>
              
              {/* Delivery address summary */}
              {selectedAddress && (
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Delivery To</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedAddress.first_name} {selectedAddress.last_name}</p>
                  <p className="text-sm text-gray-600">{selectedAddress.address_line1}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.postal_code}</p>
                </div>
              )}

              {/* Payment summary */}
              <div className="bg-gray-50 rounded-xl p-4 mb-5">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Payment</p>
                <p className="text-sm font-semibold text-gray-900">{PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label}</p>
              </div>

              {/* Items */}
              <div className="space-y-3 mb-5">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <ProductImage src={item.image} name={item.name} status={item.image_status} className="h-14 w-14 rounded-xl" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1">{item.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900">{formatPrice(parseFloat(item.price) * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <button onClick={handlePlaceOrder} disabled={placing} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                {placing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                {placing ? 'Placing Order...' : `Place Order • ${formatPrice(total)}`}
              </button>
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
            <h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex gap-2 text-sm">
                  <ProductImage src={item.image} name={item.name} status={item.image_status} className="h-10 w-10 flex-shrink-0 rounded-lg" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 line-clamp-2">{item.name}</p>
                    <p className="text-xs text-gray-400">×{item.quantity}</p>
                  </div>
                  <p className="text-xs font-semibold text-gray-900 flex-shrink-0">{formatPrice(parseFloat(item.price) * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3 space-y-2">
              {[
                { label: 'Subtotal', value: formatPrice(subtotal) },
                { label: 'Shipping', value: shipping === 0 ? 'Free' : formatPrice(shipping), cls: shipping === 0 ? 'text-green-600' : '' },
                { label: 'Tax (18% GST)', value: formatPrice(tax) },
              ].map(({ label, value, cls }) => (
                <div key={label} className="flex justify-between text-sm text-gray-600">
                  <span>{label}</span><span className={cls}>{value}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
                <span>Total</span>
                <span className="text-indigo-600">{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
