import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../api';
import { AlertTriangle, Warehouse, Package } from 'lucide-react';

const AdminInventory = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-inventory'],
    queryFn: () => adminAPI.getInventory(),
    staleTime: 60000,
    refetchInterval: 5 * 60 * 1000,
  });

  const inventory = data?.inventory || [];
  const outOfStock = inventory.filter((p) => p.stock_status === 'out_of_stock');
  const lowStock = inventory.filter((p) => p.stock_status === 'low_stock');
  const inStock = inventory.filter((p) => p.stock_status === 'in_stock');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <p className="text-gray-500 text-sm">Monitor stock levels across all products</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Out of Stock', count: outOfStock.length, color: 'bg-red-50 border-red-200', textColor: 'text-red-700', icon: AlertTriangle },
          { label: 'Low Stock', count: lowStock.length, color: 'bg-orange-50 border-orange-200', textColor: 'text-orange-700', icon: AlertTriangle },
          { label: 'In Stock', count: inStock.length, color: 'bg-green-50 border-green-200', textColor: 'text-green-700', icon: Package },
        ].map(({ label, count, color, textColor, icon: Icon }) => (
          <div key={label} className={`border rounded-2xl p-5 ${color}`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon size={16} className={textColor} />
              <span className={`text-sm font-medium ${textColor}`}>{label}</span>
            </div>
            <p className={`text-3xl font-bold ${textColor}`}>{count}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading inventory...</div>
        ) : inventory.length === 0 ? (
          <div className="p-16 text-center">
            <Warehouse size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Product', 'Category', 'SKU', 'Stock', 'Threshold', 'Status'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {inventory.map((p) => (
                  <tr key={p.id} className={`hover:bg-gray-50 ${p.stock_status === 'out_of_stock' ? 'bg-red-50/30' : p.stock_status === 'low_stock' ? 'bg-orange-50/30' : ''}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500">{p.category_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{p.sku || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-lg font-bold ${p.stock_quantity === 0 ? 'text-red-500' : p.stock_status === 'low_stock' ? 'text-orange-500' : 'text-gray-900'}`}>
                        {p.stock_quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.low_stock_threshold}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${
                        p.stock_status === 'out_of_stock' ? 'bg-red-100 text-red-700' :
                        p.stock_status === 'low_stock' ? 'bg-orange-100 text-orange-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {p.stock_status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminInventory;
