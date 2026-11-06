import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusMessage } from '../components/ui/StatusMessage';
import { useAuth } from '../context/AuthContext';
import {
  computeOrderStats,
  computeProductStats,
  fetchAdminOrders,
  fetchAdminProducts,
  updateOrderStatus,
  createProduct,
  updateProduct,
  deleteProduct,
  filterOrders,
  filterProducts,
} from '../services/admin';
import { CATEGORY_LABELS } from '../services/products';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'processing', label: 'Processing' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS);

function initialDraft() {
  return {
    name: '',
    description: '',
    price: '',
    salePrice: '',
    category: 'shirts',
    badge: '',
    featured: false,
    stock: '',
    imageUrl: '',
    thumbnailUrl: '',
    altText: '',
    gallery: '',
  };
}

export function AdminPage() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ order: null, product: null });
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [draft, setDraft] = useState(initialDraft());
  const [editingId, setEditingId] = useState(null);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [code, setCode] = useState('');

  const filteredOrders = filterOrders(orders, { search, status: statusFilter });
  const filteredProducts = filterProducts(products, { search });
  const lowStockProducts = products.filter((p) => p.stock != null && p.stock > 0 && p.stock <= 5).sort((a, b) => a.stock - b.stock);

  async function loadWorkspace() {
    try {
      const [ordersData, productsData] = await Promise.all([fetchAdminOrders(), fetchAdminProducts()]);
      setOrders(ordersData);
      setProducts(productsData);
      setStats((current) => ({ ...current, order: computeOrderStats(ordersData), product: computeProductStats(productsData) }));
    } catch (error) {
      console.error('Unable to load admin workspace:', error);
    }
  }

  useEffect(() => { loadWorkspace(); }, []);

  useEffect(() => {
    if (showCreateProduct) {
      startCreateProduct();
    }
  }, [showCreateProduct]);

  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function startCreateProduct() {
    setEditingId(null);
    setDraft(initialDraft());
    setShowCreateProduct(true);
  }

  function startEditProduct(product) {
    setEditingId(product.id);
    setDraft({
      name: product.name || '',
      description: product.description || '',
      price: product.price ?? '',
      salePrice: product.salePrice ?? '',
      category: product.category || 'shirts',
      badge: product.badge || '',
      featured: product.featured === true,
      stock: product.stock ?? '',
      imageUrl: product.imageUrl || '',
      thumbnailUrl: product.thumbnailUrl || '',
      altText: product.altText || '',
      gallery: (product.gallery || []).join('\n'),
    });
    setShowCreateProduct(true);
  }

  async function saveProduct() {
    if (!draft.name.trim()) {
      setSubmitError('Product name is required.');
      return;
    }
    const price = Number(draft.price);
    const salePrice = draft.salePrice ? Number(draft.salePrice) : null;
    if (!Number.isFinite(price) || price < 0) {
      setSubmitError('Enter a valid price.');
      return;
    }
    const stock = draft.stock ? Math.max(0, Math.floor(Number(draft.stock))) : 0;
    const gallery = draft.gallery
      .split('\n')
      .map((url) => url.trim())
      .filter(Boolean);

    setSubmitError('');
    setSubmitting(true);
    try {
      const productData = {
        name: draft.name.trim(),
        description: draft.description.trim(),
        price,
        salePrice,
        compareAtPrice: draft.compareAtPrice ? Number(draft.compareAtPrice) : null,
        category: draft.category.trim() || 'shirts',
        badge: draft.badge.trim(),
        featured: draft.featured,
        stock,
        gallery: gallery.length > 0 ? gallery : undefined,
        thumbnailUrl: draft.thumbnailUrl.trim(),
        altText: draft.altText.trim(),
      };
      if (editingId) {
        await updateProduct(editingId, productData);
      } else {
        await createProduct(productData);
      }
      setShowCreateProduct(false);
      setEditingId(null);
      loadWorkspace();
    } catch (error) {
      console.error('Unable to save product:', error);
      setSubmitError('Could not save that product. Check the details and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function removeProduct() {
    if (!editingId) return;
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    setSubmitError('');
    setDeleteError('');
    try {
      await deleteProduct(editingId);
      setShowCreateProduct(false);
      setEditingId(null);
      loadWorkspace();
    } catch (error) {
      console.error('Unable to delete product:', error);
      setDeleteError('Could not delete that product.');
    } finally {
      setDeletingId(null);
    }
  }

  function closeProductForm() {
    setShowCreateProduct(false);
    setEditingId(null);
  }

  return (
    <div className="inner-page admin-page">
      <div className="admin-header">
        <div className="admin-heading">
          <div>
            <p className="eyebrow"><span className="eyebrow-line" />Restricted workspace</p>
            <h1>Good work, <em>{profile?.name || 'admin'}</em>.</h1>
          </div>
          <button className="outline-button" onClick={signOut} type="button">Sign out</button>
        </div>
      </div>

      <div className="admin-content">
        <div className="admin-tabs" role="tablist" aria-label="Admin workspace">
          <button className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')} role="tab" aria-selected={activeTab === 'overview'} type="button">Overview</button>
          <button className={`admin-tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')} role="tab" aria-selected={activeTab === 'orders'} type="button">Orders</button>
          <button className={`admin-tab ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')} role="tab" aria-selected={activeTab === 'products'} type="button">Products</button>
          <button className={`admin-tab ${activeTab === 'stock' ? 'active' : ''}`} onClick={() => setActiveTab('stock')} role="tab" aria-selected={activeTab === 'stock'} type="button">Stock</button>
        </div>

        {activeTab === 'overview' && (
          <div className="admin-overlay">
            <div className="admin-stats">
              <div className="admin-stat"><span>Orders</span><strong>{stats.order?.totalOrders ?? 0}</strong></div>
              <div className="admin-stat"><span>Processing</span><strong>{stats.order?.processing ?? 0}</strong></div>
              <div className="admin-stat"><span>Delivered</span><strong>{stats.order?.delivered ?? 0}</strong></div>
              <div className="admin-stat"><span>Revenue</span><strong>PKR {Number(stats.order?.revenue ?? 0).toLocaleString()}</strong></div>
              <div className="admin-stat"><span>Products</span><strong>{stats.product?.productCount ?? 0}</strong></div>
              <div className="admin-stat"><span>Low stock</span><strong>{stats.product?.lowStock ?? 0}</strong></div>
            </div>
            <div className="admin-recent">
              <div className="admin-recent-heading">
                <h2>Recent orders</h2>
                <Link className="text-link" to="/orders">View all <span>↗</span></Link>
              </div>
              <div className="admin-order-list">
                {orders.slice(0, 5).map((order) => (
                  <article className="admin-order" key={order.id}>
                    <div>
                      <p className="eyebrow">#{order.id.slice(0, 8)}</p>
                      <strong>{order.shippingInfo?.name || 'Customer'}</strong>
                      <span>{order.shippingInfo?.email || 'No email'} · {order.status || 'processing'}</span>
                    </div>
                    <span className="admin-order-price">PKR {Number(order.total || 0).toLocaleString()}</span>
                  </article>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="admin-overlay">
            <div className="admin-orders-toolbar">
              <div className="search-box">
                <span aria-hidden="true">⌕</span>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customer email or name" type="search" />
              </div>
              <div className="admin-filter-select">
                <label htmlFor="statusFilter">Filter by status</label>
                <select id="statusFilter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
            </div>
            {filteredOrders.length === 0 ? (
              <div className="empty-state" style={{ margin: '6rem auto', maxWidth: '35rem', textAlign: 'center' }}>
                <span className="empty-number">00</span>
                <h2>Nothing to see here.</h2>
                <p>Try a different search term or filter.</p>
              </div>
            ) : (
              <div className="admin-order-list">
                {filteredOrders.map((order) => (
                  <article className="admin-order" key={order.id}>
                    <div>
                      <p className="eyebrow">#{order.id.slice(0, 8)}</p>
                      <strong>{order.shippingInfo?.name || 'Customer'}</strong>
                      <span className="admin-order-detail">{order.shippingInfo?.email || 'No email'} · {order.status || 'processing'} · PKR {Number(order.total || 0).toLocaleString()}</span>
                    </div>
                    <div className="admin-order-actions">
                      <select
                        aria-label={`Status for order ${order.id}`}
                        value={order.status || 'processing'}
                        onChange={(event) => updateOrderStatus(order.id, event.target.value)}
                        className="admin-order-select"
                      >
                        {STATUS_OPTIONS.filter((option) => option.value !== 'all').map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="admin-overlay admin-products">
            <div className="admin-products-toolbar">
              <div className="search-box">
                <span aria-hidden="true">⌕</span>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products" type="search" />
              </div>
              <button className="solid-button full" onClick={startCreateProduct} type="button">
                + New product
              </button>
            </div>
            {products.length === 0 ? (
              <div className="empty-state" style={{ margin: '6rem auto', maxWidth: '35rem', textAlign: 'center' }}>
                <span className="empty-number">00</span>
                <h2>Your collection is empty.</h2>
                <p>Add your first product to start selling.</p>
                <button className="solid-button" onClick={startCreateProduct} type="button">Create product</button>
              </div>
            ) : (
              <div className="admin-product-grid">
                {filteredProducts.map((product) => (
                  <article className="admin-product-card" key={product.id}>
                    <div className="admin-product-image">
                      <img src={product.imageUrl || ''} alt={product.name} loading="lazy" className="admin-product-main" />
                      <div className="admin-product-icon-wrap">
                        <Link className="admin-product-icon" to={`/products/${product.id}`} aria-label={`View ${product.name} in the store`}>
                          <span aria-hidden="true">↗</span>
                        </Link>
                        <button className="admin-product-icon" onClick={() => startEditProduct(product)} aria-label={`Edit ${product.name}`} type="button">
                          <span aria-hidden="true">✎</span>
                        </button>
                        <button className="admin-product-icon admin-product-icon--danger" onClick={() => startEditProduct(product)} aria-label={`Delete ${product.name}`} type="button">
                          <span aria-hidden="true">✕</span>
                        </button>
                      </div>
                    </div>
                    <div className="admin-product-body">
                      <p className="eyebrow">{product.category || 'Uncategorised'}</p>
                      <h3 className="admin-product-name">{product.name}</h3>
                      <p className="admin-product-price">PKR {Number(product.price || 0).toLocaleString()}</p>
                      <div className="admin-product-badges">
                        {product.badge && <span className="admin-badge">{product.badge}</span>}
                        {product.salePrice != null && product.salePrice > 0 && <span className="admin-badge admin-badge--sale">Sale</span>}
                        {product.stock === 0 && <span className="admin-badge admin-badge--sold-out">Sold out</span>}
                        {product.stock > 0 && product.stock <= 5 && <span className="admin-badge">{product.stock} left</span>}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
            {showCreateProduct && (
              <div className="admin-product-form-modal">
                <div className="admin-product-form">
                  <div className="admin-product-form-header">
                    <h2>{editingId ? 'Edit product' : 'New product'}</h2>
                    <button className="admin-product-form-close" onClick={closeProductForm} type="button" aria-label="Close">✕</button>
                  </div>
                  {submitError && <p className="form-error" role="alert">{submitError}</p>}
                  {deleteError && <p className="form-error" role="alert">{deleteError}</p>}
                  {deleteError && <button className="outline-button" onClick={() => setDeleteError('')} type="button">Dismiss</button>}
                  <div className="product-form-grid">
                    <label>Product name<input value={draft.name} onChange={(event) => updateDraft('name', event.target.value)} placeholder="E.g. Linen shirt" type="text" /></label>
                    <label>Price (PKR)<input value={draft.price} onChange={(event) => updateDraft('price', event.target.value)} placeholder="0" type="number" min="0" step="0.01" /></label>
                    <label>Sale price (PKR)<input value={draft.salePrice} onChange={(event) => updateDraft('salePrice', event.target.value)} placeholder="Optional" type="number" min="0" step="0.01" /></label>
                    <label>Category<select value={draft.category} onChange={(event) => updateDraft('category', event.target.value)}>
                      {CATEGORY_KEYS.map((key) => <option key={key} value={key}>{CATEGORY_LABELS[key]}</option>)}
                      <option value="other">+ Add custom category</option>
                    </select></label>
                    <label>Badge<input value={draft.badge} onChange={(event) => updateDraft('badge', event.target.value)} placeholder="e.g. New" type="text" /></label>
                    <label>Stock<input value={draft.stock} onChange={(event) => updateDraft('stock', event.target.value)} placeholder="0" type="number" min="0" step="1" /></label>
                    <label>Featured<input type="checkbox" checked={draft.featured} onChange={(event) => updateDraft('featured', event.target.checked)} /></label>
                    <label>Image URL<input value={draft.imageUrl} onChange={(event) => updateDraft('imageUrl', event.target.value)} placeholder="https://..." type="url" /></label>
                    <label>Thumbnail URL<input value={draft.thumbnailUrl} onChange={(event) => updateDraft('thumbnailUrl', event.target.value)} placeholder="Optional" type="url" /></label>
                    <label>Alt text<input value={draft.altText} onChange={(event) => updateDraft('altText', event.target.value)} placeholder="Descriptive alt text" type="text" /></label>
                    <label>Gallery (one URL per line)<textarea value={draft.gallery} onChange={(event) => updateDraft('gallery', event.target.value)} placeholder="https://..." rows="4"></textarea></label>
                    <label>Compare at price (PKR)<input value={draft.compareAtPrice ?? ''} onChange={(event) => updateDraft('compareAtPrice', event.target.value)} placeholder="Optional" type="number" min="0" step="0.01" /></label>
                  </div>
                  <div className="admin-product-form-actions">
                    <button className="outline-button" onClick={closeProductForm} type="button">Cancel</button>
                    <button className="solid-button" onClick={saveProduct} disabled={submitting} type="button">{submitting ? 'Saving…' : editingId ? 'Save changes' : 'Create product'}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stock' && (
          <div className="admin-overlay admin-stock">
            <div className="admin-stock-heading">
              <h2>Inventory</h2>
              <p>Items with 5 or fewer units remaining.</p>
            </div>
            {lowStockProducts.length === 0 ? (
              <div className="empty-state" style={{ margin: '6rem auto', maxWidth: '35rem', textAlign: 'center' }}>
                <span className="empty-number">00</span>
                <h2>Stock levels are healthy.</h2>
                <p>No products are at risk of selling out.</p>
              </div>
            ) : (
              <div className="admin-product-grid admin-product-grid--stock">
                {lowStockProducts.map((product) => (
                  <article className="admin-product-card" key={product.id}>
                    <div className="admin-product-image">
                      <img src={product.imageUrl || ''} alt={product.name} loading="lazy" className="admin-product-main" />
                    </div>
                    <div className="admin-product-body">
                      <p className="eyebrow">{product.category || 'Uncategorised'}</p>
                      <h3 className="admin-product-name">{product.name}</h3>
                      <p className="admin-product-price">PKR {Number(product.price || 0).toLocaleString()}</p>
                      <span className={`admin-badge admin-badge--${product.stock === 0 ? 'sold-out' : 'low'}`}>{product.stock === 0 ? 'Sold out' : `${product.stock} left`}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
            <div className="admin-stock-summary">
              <span>Total stock across all products: <strong>{stats.product?.totalStock ?? 0}</strong></span>
              <span>Featured products: <strong>{stats.product?.featured ?? 0}</strong></span>
              <span>On sale: <strong>{stats.product?.onSale ?? 0}</strong></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
