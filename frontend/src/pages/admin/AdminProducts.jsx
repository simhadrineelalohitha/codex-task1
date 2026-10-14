import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI, categoriesAPI } from '../../api';
import ProductImage from '../../components/product/ProductImage';
import { formatPrice } from '../../components/product/ProductCard';
import { Plus, Search, Edit2, Trash2, Upload, X, Loader2, ChevronDown, Package, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const ProductModal = ({ product, categories, onClose, onSave }) => {
  const isEdit = !!product;
  const [form, setForm] = useState(product || {
    name: '', description: '', short_description: '', price: '', compare_price: '',
    brand: '', sku: '', stock_quantity: 0, is_featured: false, is_active: true,
    category_id: '', images: [{ url: '', alt_text: '' }], tags: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) { toast.error('Name and price are required'); return; }
    try {
      setSaving(true);
      const payload = {
        ...form,
        price: parseFloat(form.price),
        compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
        stock_quantity: parseInt(form.stock_quantity) || 0,
        tags: typeof form.tags === 'string' ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : form.tags,
        images: form.images?.filter((img) => img.url),
      };
      if (isEdit) await adminAPI.updateProduct(product.id, payload);
      else await adminAPI.createProduct(payload);
      toast.success(isEdit ? 'Product updated!' : 'Product created!');
      onSave();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addImage = () => setForm({ ...form, images: [...(form.images || []), { url: '', alt_text: '' }] });
  const removeImage = (i) => setForm({ ...form, images: form.images.filter((_, idx) => idx !== i) });
  const updateImage = (i, field, val) => {
    const imgs = [...(form.images || [])];
    imgs[i] = { ...imgs[i], [field]: val };
    setForm({ ...form, images: imgs });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Product name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
              <input type="number" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" min="0" step="0.01" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Compare Price (₹)</label>
              <input type="number" className="input" value={form.compare_price} onChange={(e) => setForm({ ...form, compare_price: e.target.value })} placeholder="Original price" min="0" step="0.01" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <input className="input" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Brand name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input className="input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="Product SKU" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
              <input type="number" className="input" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select className="input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
              <input className="input" value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} placeholder="Brief description" maxLength={500} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea className="input resize-none" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Full product description" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
              <input className="input" value={Array.isArray(form.tags) ? form.tags.join(', ') : form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="electronics, smartphone, android" />
            </div>

            {/* Images */}
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Product Images</label>
                <button type="button" onClick={addImage} className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                  <Plus size={12} /> Add Image
                </button>
              </div>
              <div className="space-y-2">
                {(form.images || []).map((img, i) => (
                  <div key={i} className="flex gap-2">
                    <input className="input flex-1 text-sm" value={img.url} onChange={(e) => updateImage(i, 'url', e.target.value)} placeholder="https://example.com/image.jpg" />
                    <input className="input w-32 text-sm" value={img.alt_text} onChange={(e) => updateImage(i, 'alt_text', e.target.value)} placeholder="Alt text" />
                    <button type="button" onClick={() => removeImage(i)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Checkboxes */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="w-4 h-4 accent-indigo-600" />
                Featured Product
              </label>
              {isEdit && (
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 accent-indigo-600" />
                  Active
                </label>
              )}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <Loader2 size={15} className="animate-spin" /> : null}
              {saving ? 'Saving...' : (isEdit ? 'Update Product' : 'Create Product')}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminProducts = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [editProduct, setEditProduct] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAll(),
    staleTime: 10 * 60 * 1000,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-products', page, search, status],
    queryFn: () => adminAPI.getProducts({ page, limit: 20, search, status }),
    staleTime: 30000,
  });

  const products = data?.products || [];
  const pagination = data?.pagination;
  const categories = categoriesData?.categories || [];

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this product?')) return;
    try {
      await adminAPI.deleteProduct(id);
      toast.success('Product deactivated');
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleBulkImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImporting(true);
      const formData = new FormData();
      formData.append('file', file);
      const data = await adminAPI.bulkImport(formData);
      toast.success(`Imported ${data.imported} products! ${data.failed > 0 ? `(${data.failed} failed)` : ''}`);
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm">{pagination?.total || 0} total products</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { fileRef.current?.click(); }} disabled={importing}
            className="btn-secondary text-sm flex items-center gap-1.5">
            {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {importing ? 'Importing...' : 'Import CSV/Excel'}
          </button>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleBulkImport} />
          <button onClick={() => setShowCreateModal(true)} className="btn-primary text-sm flex items-center gap-1.5">
            <Plus size={14} /> Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search products..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="low_stock">Low Stock</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center">
            <Package size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Product', 'Category', 'Price', 'Stock', 'Rating', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ProductImage src={p.primary_image} name={p.name} status={p.image_status} className="h-10 w-10 rounded-lg" />
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.brand || 'No brand'} • {p.sku || 'No SKU'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.category_name || '—'}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{formatPrice(p.price)}</p>
                      {p.compare_price && <p className="text-xs text-gray-400 line-through">{formatPrice(p.compare_price)}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${p.stock_quantity === 0 ? 'text-red-500' : p.stock_quantity <= 5 ? 'text-orange-500' : 'text-gray-900'}`}>
                        {p.stock_quantity}
                      </span>
                      {p.stock_quantity <= (p.low_stock_threshold || 5) && p.stock_quantity > 0 && (
                        <AlertTriangle size={12} className="inline text-orange-400 ml-1" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-yellow-500">★</span>{' '}
                      <span className="text-gray-700">{parseFloat(p.rating_average || 0).toFixed(1)}</span>
                      <span className="text-gray-400 text-xs"> ({p.rating_count})</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => setEditProduct(p)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50">Previous</button>
          <span className="px-4 py-2 text-sm text-gray-500">Page {page} of {pagination.pages}</span>
          <button disabled={page === pagination.pages} onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50">Next</button>
        </div>
      )}

      {(editProduct || showCreateModal) && (
        <ProductModal
          product={editProduct}
          categories={categories}
          onClose={() => { setEditProduct(null); setShowCreateModal(false); }}
          onSave={() => { setEditProduct(null); setShowCreateModal(false); refetch(); }}
        />
      )}
    </div>
  );
};

export default AdminProducts;
