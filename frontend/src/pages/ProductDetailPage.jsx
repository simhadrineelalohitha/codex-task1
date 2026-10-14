import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsAPI, reviewsAPI, aiAPI, wishlistAPI } from '../api';
import { useAuthStore, useCartStore, useWishlistStore } from '../store';
import { Star, ShoppingCart, Heart, Share2, Truck, Shield, RefreshCw, MessageSquare, ChevronRight, Bot, Loader2, CheckCircle, BarChart2 } from 'lucide-react';
import { formatPrice, StarRating } from '../components/product/ProductCard';
import ProductCard from '../components/product/ProductCard';
import ProductImage from '../components/product/ProductImage';
import toast from 'react-hot-toast';

const ImageGallery = ({ images, productName, imageStatus }) => {
  const [selected, setSelected] = useState(0);
  const imgs = images?.filter(Boolean) || [];

  const mainImage = imgs[selected]?.url || imgs[0]?.url;

  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden">
        <ProductImage src={mainImage} name={productName} status={imageStatus} className="h-full w-full" />
      </div>
      {imgs.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {imgs.map((img, i) => (
            <button key={i} onClick={() => setSelected(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${selected === i ? 'border-indigo-600' : 'border-gray-200 hover:border-gray-300'}`}>
              <ProductImage src={img.url} name={`${productName} ${i + 1}`} status={imageStatus} className="h-full w-full" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ReviewForm = ({ productId, onSuccess }) => {
  const { isAuthenticated } = useAuthStore();
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="bg-indigo-50 rounded-2xl p-6 text-center">
        <MessageSquare size={32} className="text-indigo-400 mx-auto mb-3" />
        <p className="text-gray-700 mb-4">Sign in to write a review</p>
        <Link to="/login" className="btn-primary text-sm">Sign In</Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await reviewsAPI.submit(productId, { rating, title, body });
      toast.success('Review submitted successfully!');
      onSuccess();
      setTitle(''); setBody(''); setRating(5);
    } catch (err) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-2xl p-6 space-y-4">
      <h3 className="text-lg font-bold text-gray-900">Write a Review</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} type="button"
              onMouseEnter={() => setHoveredRating(star)} onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setRating(star)}>
              <Star size={28} className={`${star <= (hoveredRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} transition-colors`} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Review Title (optional)</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Summarize your experience"
          className="input" maxLength={255} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Review (optional)</label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Share your experience with this product..."
          className="input resize-none" rows={4} maxLength={2000} />
      </div>
      <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
        Submit Review
      </button>
    </form>
  );
};

const ReviewSummaryAI = ({ productId }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const data = await aiAPI.getReviewSummary(productId);
      setSummary(data);
    } catch (err) {
      toast.error('Failed to get AI summary');
    } finally {
      setLoading(false);
    }
  };

  if (summary) {
    const sentimentColor = summary.sentiment === 'positive' ? 'text-green-600 bg-green-50' :
      summary.sentiment === 'negative' ? 'text-red-600 bg-red-50' : 'text-yellow-600 bg-yellow-50';
    return (
      <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100">
        <div className="flex items-center gap-2 mb-3">
          <Bot size={16} className="text-indigo-600" />
          <span className="text-sm font-bold text-indigo-700">AI Review Summary</span>
          <span className={`badge ${sentimentColor} text-xs capitalize`}>{summary.sentiment}</span>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed mb-3">{summary.summary}</p>
        {(summary.key_pros?.length > 0 || summary.key_cons?.length > 0) && (
          <div className="grid grid-cols-2 gap-3">
            {summary.key_pros?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-green-700 mb-1.5">👍 Pros</p>
                {summary.key_pros.map((pro, i) => (
                  <p key={i} className="text-xs text-gray-600">• {pro}</p>
                ))}
              </div>
            )}
            {summary.key_cons?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-red-700 mb-1.5">👎 Cons</p>
                {summary.key_cons.map((con, i) => (
                  <p key={i} className="text-xs text-gray-600">• {con}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <button onClick={fetchSummary} disabled={loading}
      className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-colors border border-indigo-200">
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Bot size={14} />}
      {loading ? 'Generating AI Summary...' : '✨ Get AI Review Summary'}
    </button>
  );
};

const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { addToCart } = useCartStore();
  const { items: wishlistItems, setItems } = useWishlistStore();
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewSort, setReviewSort] = useState('newest');

  const { data: productData, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsAPI.getBySlug(slug),
    staleTime: 2 * 60 * 1000,
  });

  const { data: reviewsData, refetch: refetchReviews } = useQuery({
    queryKey: ['reviews', productData?.product?.id, reviewPage, reviewSort],
    queryFn: () => reviewsAPI.getByProduct(productData?.product?.id, { page: reviewPage, limit: 10, sort: reviewSort }),
    enabled: !!productData?.product?.id,
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-pulse">
          <div className="aspect-square bg-gray-200 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-12 bg-gray-200 rounded w-1/3" />
            <div className="h-24 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !productData?.product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h2>
        <Link to="/products" className="btn-primary">Browse Products</Link>
      </div>
    );
  }

  const { product, related } = productData;
  const isInWishlist = wishlistItems.some((i) => i.product_id === product.id);
  const reviews = reviewsData?.reviews || [];
  const reviewStats = reviewsData?.stats;
  // Normalize images from product_images table, JSONB field, or primary_image
  const rawImages = product.image_list || product.images || [];
  const parsedImages = Array.isArray(rawImages) ? rawImages : [];
  const images = parsedImages.length > 0
    ? parsedImages
    : product.primary_image
      ? [{ url: product.primary_image, alt_text: product.name }]
      : [{ url: 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=600', alt_text: product.name }];

  const discount = product.compare_price
    ? Math.round((1 - parseFloat(product.price) / parseFloat(product.compare_price)) * 100) : 0;

  const handleAddToCart = async () => {
    if (!isAuthenticated) { toast.error('Please sign in to add to cart'); navigate('/login'); return; }
    if (product.stock_quantity === 0) { toast.error('Out of stock'); return; }
    try {
      setAddingToCart(true);
      await addToCart(product.id, quantity);
      toast.success(`${product.name} added to cart!`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) { toast.error('Please sign in to use wishlist'); return; }
    try {
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
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-indigo-600">Home</Link>
        <ChevronRight size={14} />
        <Link to="/products" className="hover:text-indigo-600">Products</Link>
        {product.category_name && (
          <>
            <ChevronRight size={14} />
            <Link to={`/products?category=${product.category_slug}`} className="hover:text-indigo-600">{product.category_name}</Link>
          </>
        )}
        <ChevronRight size={14} />
        <span className="text-gray-900 font-medium line-clamp-1">{product.name}</span>
      </div>

      {/* Product Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
        {/* Images */}
        <div>
          <ImageGallery images={images} productName={product.name} imageStatus={product.metadata?.image_status} />
        </div>

        {/* Info */}
        <div>
          {product.brand && <p className="text-sm font-medium text-indigo-600 mb-1">{product.brand}</p>}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{product.name}</h1>

          <div className="flex items-center gap-3 mb-4">
            <StarRating rating={product.rating_average} count={product.rating_count} size="md" />
            <span className="text-sm text-gray-500">({product.rating_count || 0} reviews)</span>
          </div>

          <div className="flex items-end gap-3 mb-6">
            <span className="text-3xl font-bold text-gray-900">{formatPrice(product.price)}</span>
            {product.compare_price && (
              <>
                <span className="text-lg text-gray-400 line-through">{formatPrice(product.compare_price)}</span>
                <span className="bg-red-100 text-red-600 text-sm font-bold px-2 py-0.5 rounded-full">{discount}% OFF</span>
              </>
            )}
          </div>

          {product.short_description && (
            <p className="text-gray-600 mb-6 leading-relaxed">{product.short_description}</p>
          )}

          {/* Stock status */}
          <div className="flex items-center gap-2 mb-6">
            {product.stock_quantity > 0 ? (
              <>
                <CheckCircle size={16} className="text-green-500" />
                <span className="text-sm font-medium text-green-600">
                  In Stock {product.stock_quantity <= 10 && `(Only ${product.stock_quantity} left!)`}
                </span>
              </>
            ) : (
              <span className="text-sm font-medium text-red-500">Out of Stock</span>
            )}
          </div>

          {/* Quantity + Add to cart */}
          {product.stock_quantity > 0 && (
            <div className="flex gap-3 mb-4">
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-3 hover:bg-gray-50 font-bold text-gray-600">−</button>
                <span className="px-4 py-3 font-semibold min-w-[50px] text-center">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  className="px-4 py-3 hover:bg-gray-50 font-bold text-gray-600">+</button>
              </div>
              <button onClick={handleAddToCart} disabled={addingToCart}
                className="flex-1 btn-primary flex items-center justify-center gap-2">
                {addingToCart ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
                Add to Cart
              </button>
              <button onClick={handleToggleWishlist}
                className={`p-3 border-2 rounded-xl transition-colors ${isInWishlist ? 'border-red-500 bg-red-50 text-red-500' : 'border-gray-200 hover:border-red-200 text-gray-400 hover:text-red-400'}`}>
                <Heart size={18} className={isInWishlist ? 'fill-red-500' : ''} />
              </button>
            </div>
          )}

          {/* Features */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { icon: Truck, label: 'Free Delivery', sub: 'On orders ₹500+' },
              { icon: Shield, label: 'Secure', sub: 'Payment' },
              { icon: RefreshCw, label: 'Easy Returns', sub: '7 days' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex flex-col items-center gap-1 bg-gray-50 rounded-xl p-3 text-center">
                <Icon size={18} className="text-indigo-600" />
                <span className="text-xs font-semibold text-gray-700">{label}</span>
                <span className="text-xs text-gray-400">{sub}</span>
              </div>
            ))}
          </div>

          {/* SKU + Category */}
          <div className="mt-6 space-y-1.5 text-sm text-gray-500">
            {product.sku && <p>SKU: <span className="text-gray-700">{product.sku}</span></p>}
            {product.category_name && (
              <p>Category: <Link to={`/products?category=${product.category_slug}`} className="text-indigo-600 hover:underline">{product.category_name}</Link></p>
            )}
            {product.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {product.tags.map((tag) => (
                  <Link key={tag} to={`/products?search=${tag}`}
                    className="text-xs bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 px-2.5 py-1 rounded-full text-gray-600 transition-colors">
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Product Description</h2>
          <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed bg-white rounded-2xl p-6 border border-gray-100">
            {product.description}
          </div>
        </div>
      )}

      {/* Reviews section */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Customer Reviews</h2>
          <ReviewSummaryAI productId={product.id} />
        </div>

        {/* Review stats */}
        {reviewStats && parseFloat(reviewStats.total_reviews) > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 flex items-center gap-8">
            <div className="text-center">
              <p className="text-5xl font-bold text-gray-900">{parseFloat(reviewStats.avg_rating || 0).toFixed(1)}</p>
              <StarRating rating={parseFloat(reviewStats.avg_rating || 0)} size="md" />
              <p className="text-sm text-gray-500 mt-1">{reviewStats.total_reviews} reviews</p>
            </div>
          </div>
        )}

        {/* Sort reviews */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-gray-500">Sort by:</span>
          {['newest', 'helpful', 'highest', 'lowest'].map((s) => (
            <button key={s} onClick={() => setReviewSort(s)}
              className={`text-sm px-3 py-1.5 rounded-xl transition-colors capitalize ${reviewSort === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s}
            </button>
          ))}
        </div>

        {/* Reviews list */}
        <div className="space-y-4 mb-6">
          {reviews.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-2xl">
              <MessageSquare size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500">No reviews yet. Be the first to review!</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-indigo-600">
                        {review.first_name?.[0]}{review.last_name?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{review.first_name} {review.last_name}</p>
                      <div className="flex items-center gap-2">
                        <StarRating rating={review.rating} size="sm" />
                        {review.is_verified_purchase && (
                          <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <CheckCircle size={10} /> Verified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString('en-IN')}</span>
                </div>
                {review.title && <p className="text-sm font-semibold text-gray-900 mb-1.5">{review.title}</p>}
                {review.body && <p className="text-sm text-gray-600 leading-relaxed">{review.body}</p>}
                {review.helpful_count > 0 && (
                  <p className="text-xs text-gray-400 mt-2">{review.helpful_count} people found this helpful</p>
                )}
              </div>
            ))
          )}
        </div>

        <ReviewForm productId={product.id} onSuccess={refetchReviews} />
      </div>

      {/* Related products */}
      {related && related.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Related Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
