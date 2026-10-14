import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsAPI, categoriesAPI } from '../api';
import ProductCard from '../components/product/ProductCard';
import { Search, SlidersHorizontal, X, ChevronDown, Grid, List, Loader2 } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'created_at_desc', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating_desc', label: 'Highest Rated' },
  { value: 'sold_desc', label: 'Most Popular' },
];

const PRICE_RANGES = [
  { label: 'Under ₹500', min: 0, max: 500 },
  { label: '₹500 - ₹2,000', min: 500, max: 2000 },
  { label: '₹2,000 - ₹5,000', min: 2000, max: 5000 },
  { label: '₹5,000 - ₹20,000', min: 5000, max: 20000 },
  { label: 'Above ₹20,000', min: 20000, max: null },
];

const FilterSidebar = ({ filters, setFilters, categories, onClose }) => {
  const handlePriceRange = (range) => {
    setFilters((prev) => ({ ...prev, min_price: range.min, max_price: range.max }));
  };

  const clearFilters = () => {
    setFilters({ category: '', min_price: '', max_price: '', min_rating: '', sort: 'created_at_desc', search: filters.search });
  };

  const activeFiltersCount = [filters.category, filters.min_price, filters.max_price, filters.min_rating]
    .filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Category</h3>
        <div className="space-y-1.5">
          <button
            onClick={() => setFilters((p) => ({ ...p, category: '' }))}
            className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors ${!filters.category ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button key={cat.slug}
              onClick={() => setFilters((p) => ({ ...p, category: cat.slug }))}
              className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors flex items-center justify-between ${filters.category === cat.slug ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span>{cat.name}</span>
              <span className="text-xs text-gray-400">({cat.product_count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Price Range</h3>
        <div className="space-y-1.5">
          {PRICE_RANGES.map((range) => {
            const isActive = filters.min_price == range.min && filters.max_price == (range.max || '');
            return (
              <button key={range.label} onClick={() => handlePriceRange(range)}
                className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors ${isActive ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                {range.label}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex gap-2">
          <input type="number" placeholder="Min ₹" value={filters.min_price}
            onChange={(e) => setFilters((p) => ({ ...p, min_price: e.target.value }))}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <input type="number" placeholder="Max ₹" value={filters.max_price}
            onChange={(e) => setFilters((p) => ({ ...p, max_price: e.target.value }))}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>

      {/* Rating */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Minimum Rating</h3>
        <div className="space-y-1.5">
          {[4, 3, 2].map((rating) => (
            <button key={rating} onClick={() => setFilters((p) => ({ ...p, min_rating: p.min_rating == rating ? '' : rating }))}
              className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors flex items-center gap-2 ${filters.min_rating == rating ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
              <span className="text-yellow-400">{'★'.repeat(rating)}</span>
              <span className="text-gray-400">{'☆'.repeat(5 - rating)}</span>
              <span>& above</span>
            </button>
          ))}
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <button onClick={clearFilters} className="w-full text-sm text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors border border-red-200 flex items-center justify-center gap-2">
          <X size={14} /> Clear Filters ({activeFiltersCount})
        </button>
      )}
    </div>
  );
};

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    min_rating: searchParams.get('min_rating') || '',
    sort: searchParams.get('sort') || 'created_at_desc',
    featured: searchParams.get('featured') || '',
  });

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      featured: searchParams.get('featured') || '',
      sort: searchParams.get('sort') || 'created_at_desc',
    }));
    setCurrentPage(1);
  }, [searchParams]);

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAll(),
    staleTime: 10 * 60 * 1000,
  });

  const queryParams = {
    page: currentPage,
    limit: 12,
    ...(filters.search && { search: filters.search }),
    ...(filters.category && { category: filters.category }),
    ...(filters.min_price && { min_price: filters.min_price }),
    ...(filters.max_price && { max_price: filters.max_price }),
    ...(filters.min_rating && { min_rating: filters.min_rating }),
    ...(filters.sort && { sort: filters.sort }),
    ...(filters.featured && { featured: filters.featured }),
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['products', queryParams],
    queryFn: () => productsAPI.getAll(queryParams),
    staleTime: 2 * 60 * 1000,
    keepPreviousData: true,
  });

  const products = data?.products || [];
  const pagination = data?.pagination;
  const categories = categoriesData?.categories || [];

  const handleFilterChange = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  const activeFiltersCount = [filters.category, filters.min_price, filters.max_price, filters.min_rating]
    .filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {filters.category ? categories.find((c) => c.slug === filters.category)?.name || 'Products' : 'All Products'}
          </h1>
          {pagination && (
            <p className="text-sm text-gray-500 mt-0.5">
              {isFetching ? 'Loading...' : `${pagination.total} products found`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Sort */}
          <div className="relative">
            <select value={filters.sort}
              onChange={(e) => handleFilterChange({ sort: e.target.value })}
              className="appearance-none bg-white border border-gray-200 rounded-xl pl-4 pr-8 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          {/* Filter button (mobile) */}
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-medium transition-colors ${showFilters || activeFiltersCount > 0 ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
            <SlidersHorizontal size={15} />
            Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Search products..." value={filters.search}
          onChange={(e) => handleFilterChange({ search: e.target.value })}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
        {filters.search && (
          <button onClick={() => handleFilterChange({ search: '' })} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className={`${showFilters ? 'block' : 'hidden'} lg:block w-64 flex-shrink-0`}>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Filters</h2>
              <button onClick={() => setShowFilters(false)} className="lg:hidden p-1 hover:bg-gray-100 rounded-lg">
                <X size={16} />
              </button>
            </div>
            <FilterSidebar filters={filters} setFilters={handleFilterChange} categories={categories} onClose={() => setShowFilters(false)} />
          </div>
        </aside>

        {/* Products grid */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="aspect-square bg-gray-200" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-gray-200 rounded" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                    <div className="h-5 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <Search size={48} className="text-gray-200 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-700">No products found</h3>
              <p className="text-gray-400 mb-6">Try adjusting your filters or search terms</p>
              <button onClick={() => setFilters({ search: '', category: '', min_price: '', max_price: '', min_rating: '', sort: 'created_at_desc', featured: '' })}
                className="btn-primary">Clear All Filters</button>
            </div>
          ) : (
            <>
              {isFetching && !isLoading && (
                <div className="flex justify-center mb-4">
                  <div className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-sm">
                    <Loader2 size={14} className="animate-spin" /> Updating results...
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}
                    className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    Previous
                  </button>
                  {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button key={page} onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 text-sm border rounded-xl ${currentPage === page ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-200 hover:bg-gray-50'}`}>
                        {page}
                      </button>
                    );
                  })}
                  <button disabled={currentPage === pagination.pages} onClick={() => setCurrentPage((p) => p + 1)}
                    className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
