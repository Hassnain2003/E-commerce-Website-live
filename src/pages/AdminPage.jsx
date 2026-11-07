import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StatusMessage } from '../components/ui/StatusMessage';
import { useAuth } from '../context/AuthContext';
import {
  computeOrderStats,
  computeProductStats,
  fetchAdminOrders,
  fetchAdminOrder,
  fetchAdminProducts,
  fetchAdminUsers,
  updateOrderStatus,
  updateOrderTracking,
  updateOrderPayment,
  deleteOrder,
  createProduct,
  updateProduct,
  deleteProduct,
  updateUserRole,
  deleteUser,
  filterOrders,
  filterProducts,
  subscribeToOrders,
  subscribeToProducts,
  subscribeToUsers,
  bulkUpdateOrderStatus,
  bulkUpdateProductStock,
  bulkDeleteOrders,
  formatPKR,
  formatOrderDate,
  formatOrderDateTime,
  estimatedDeliveryDays,
} from '../services/admin';
import { CATEGORY_LABELS } from '../services/products';

const STATUS_OPTIONS = [
  { value: 'processing', label: 'Processing' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS);

const STATUS_COLORS = {
  processing: '#a36145',
  confirmed: '#7a6a37',
  shipped: '#7a6a37',
  delivered: '#3d765d',
  cancelled: '#a44938',
};

function initialDraft() {
  return {
    name: '',
    description: '',
    price: '',
    salePrice: '',
    compareAtPrice: '',
    category: 'shirts',
    badge: '',
    featured: false,
    stock: '0',
    imageUrl: '',
    thumbnailUrl: '',
    altText: '',
    gallery: [],
    newGalleryImage: '',
  };
}

export function AdminPage() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  // Data state
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [stats, setStats] = useState({ order: null, product: null });

  // UI state
  const [activeTab, setActiveTab] = useState('overview');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productStockFilter, setProductStockFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [draft, setDraft] = useState(initialDraft());
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [deletingType, setDeletingType] = useState(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState(new Set());
  const [selectedProductIds, setSelectedProductIds] = useState(new Set());
  const [bulkAction, setBulkAction] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Real-time subscriptions
  useEffect(() => {
    const unsubOrders = subscribeToOrders(
      (nextOrders) => {
        setOrders(nextOrders);
        setStats((current) => ({ ...current, order: computeOrderStats(nextOrders) }));
      },
      (err) => console.error('Orders subscription error:', err),
    );
    const unsubProducts = subscribeToProducts(
      (nextProducts) => {
        setProducts(nextProducts);
        setStats((current) => ({ ...current, product: computeProductStats(nextProducts) }));
      },
      (err) => console.error('Products subscription error:', err),
    );
    const unsubUsers = subscribeToUsers(
      (nextUsers) => setUsers(nextUsers),
      (err) => console.error('Users subscription error:', err),
    );
    return () => { unsubOrders(); unsubProducts(); unsubUsers(); };
  }, []);

  // Computed
  const filteredOrders = filterOrders(orders, { search: orderSearch, status: orderStatusFilter });
  const filteredProducts = filterProducts(products, {
    search: productSearch,
    category: productCategoryFilter,
    stock: productStockFilter,
  });
  const lowStockProducts = products.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5).sort((a, b) => a.stock - b.stock);
  const orderStats = stats.order;
  const productStats = stats.product;

  // ---- Order actions ----
  async function handleOrderStatusChange(orderId, newStatus) {
    setSubmitError('');
    setSubmitSuccess('');
    try {
      await updateOrderStatus(orderId, newStatus);
      setSubmitSuccess(`Order #${orderId.slice(0, 8)} status updated to ${newStatus}.`);
      setTimeout(() => setSubmitSuccess(''), 4000);
    } catch (error) {
      console.error('Order status update failed:', error);
      setSubmitError('Failed to update order status. Please try again.');
    }
  }

  async function handleBulkOrderStatus(status) {
    const ids = Array.from(selectedOrderIds);
    if (!ids.length) return;
    setSubmitError('');
    setSubmitSuccess('');
    try {
      await bulkUpdateOrderStatus(ids, status);
      setSelectedOrderIds(new Set());
      setSubmitSuccess(`${ids.length} order(s) updated to ${status}.`);
      setTimeout(() => setSubmitSuccess(''), 4000);
    } catch (error) {
      console.error('Bulk status update failed:', error);
      setSubmitError('Bulk update failed. Please try again.');
    }
  }

  async function handleOrderTracking(orderId, trackingNumber) {
    setSubmitError('');
    try {
      await updateOrderTracking(orderId, trackingNumber.trim());
      setSubmitSuccess(`Tracking number added to order #${orderId.slice(0, 8)}.`);
      setTimeout(() => setSubmitSuccess(''), 4000);
    } catch (error) {
      console.error('Tracking update failed:', error);
      setSubmitError('Failed to add tracking number.');
    }
  }

  async function handleDeleteOrder(orderId) {
    if (!window.confirm(`Delete order #${orderId.slice(0, 8)}? This cannot be undone.`)) return;
    setDeletingId(orderId);
    setDeletingType('order');
    setSubmitError('');
    try {
      await deleteOrder(orderId);
      setSelectedOrderIds(new Set());
      setSubmitSuccess('Order deleted.');
      setTimeout(() => setSubmitSuccess(''), 4000);
    } catch (error) {
      console.error('Order delete failed:', error);
      setSubmitError('Failed to delete order.');
    } finally {
      setDeletingId(null);
      setDeletingType(null);
    }
  }

  // ---- Product actions ----
  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function setMainImage(index) {
    const gallery = draft.gallery || [];
    const newMain = gallery[index];
    setDraft((current) => ({
      ...current,
      imageUrl: newMain,
      gallery: gallery.filter((_, i) => i !== index),
    }));
  }

  function removeGalleryImage(index) {
    setDraft((current) => ({
      ...current,
      gallery: (current.gallery || []).filter((_, i) => i !== index),
    }));
  }

  function startCreateProduct() {
    setEditingProductId(null);
    setDraft(initialDraft());
    setShowProductForm(true);
  }

  function startEditProduct(product) {
    const existingGallery = Array.isArray(product.gallery) ? product.gallery : (product.gallery ? String(product.gallery).split('\n').filter(Boolean) : []);
    setEditingProductId(product.id);
    setDraft({
      name: product.name || '',
      description: product.description || '',
      price: product.price ?? '',
      salePrice: product.salePrice ?? '',
      compareAtPrice: product.compareAtPrice ?? '',
      category: product.category || 'shirts',
      badge: product.badge || '',
      featured: product.featured === true,
      stock: (product.stock ?? '').toString(),
      imageUrl: product.imageUrl || '',
      thumbnailUrl: product.thumbnailUrl || '',
      altText: product.altText || '',
      gallery: existingGallery,
      newGalleryImage: '',
    });
    setShowProductForm(true);
  }

  function closeProductForm() {
    setShowProductForm(false);
    setEditingProductId(null);
  }

  async function saveProduct() {
    if (!draft.name.trim()) {
      setSubmitError('Product name is required.');
      return;
    }
    const price = Number(draft.price);
    if (!Number.isFinite(price) || price < 0) {
      setSubmitError('Enter a valid price.');
      return;
    }
    const stock = draft.stock ? Math.max(0, Math.floor(Number(draft.stock))) : 0;
    const gallery = Array.isArray(draft.gallery) ? draft.gallery.filter((u) => typeof u === 'string' && u.trim()) : [];
    setSubmitError('');
    setSubmitSuccess('');
    try {
      const productData = {
        name: draft.name.trim(),
        description: draft.description.trim(),
        price,
        salePrice: draft.salePrice ? Number(draft.salePrice) : null,
        compareAtPrice: draft.compareAtPrice ? Number(draft.compareAtPrice) : null,
        category: draft.category.trim() || 'shirts',
        badge: draft.badge.trim(),
        featured: draft.featured,
        stock,
        gallery: gallery.length > 0 ? gallery : undefined,
        thumbnailUrl: draft.thumbnailUrl.trim(),
        altText: draft.altText.trim(),
      };
      if (editingProductId) {
        await updateProduct(editingProductId, productData);
      } else {
        await createProduct(productData);
      }
      setShowProductForm(false);
      setEditingProductId(null);
      setSubmitSuccess(`Product "${draft.name.trim()}" ${editingProductId ? 'updated' : 'created'}.`);
      setTimeout(() => setSubmitSuccess(''), 4000);
    } catch (error) {
      console.error('Product save failed:', error);
      setSubmitError('Could not save product. Check details and try again.');
    }
  }

  async function deleteProductConfirmed(productId) {
    if (!window.confirm(`Delete product? This cannot be undone.`)) return;
    setDeletingId(productId);
    setDeletingType('product');
    setSubmitError('');
    try {
      await deleteProduct(productId);
      setSelectedProductIds(new Set());
      setSubmitSuccess('Product deleted.');
      setTimeout(() => setSubmitSuccess(''), 4000);
    } catch (error) {
      console.error('Product delete failed:', error);
      setSubmitError('Failed to delete product.');
    } finally {
      setDeletingId(null);
      setDeletingType(null);
    }
  }

  async function handleBulkProductStock() {
    const updates = Array.from(selectedProductIds).map((id) => {
      const p = products.find((x) => x.id === id);
      return { productId: id, stock: (p?.stock ?? 0) + 10 };
    });
    if (!updates.length) return;
    setSubmitError('');
    try {
      await bulkUpdateProductStock(updates);
      setSelectedProductIds(new Set());
      setSubmitSuccess(`${updates.length} product(s) restocked (+10).`);
      setTimeout(() => setSubmitSuccess(''), 4000);
    } catch (error) {
      console.error('Bulk restock failed:', error);
      setSubmitError('Bulk restock failed.');
    }
  }

  // ---- User actions ----
  async function handleUserRoleChange(userId, newRole) {
    setSubmitError('');
    try {
      await updateUserRole(userId, newRole);
      setSubmitSuccess(`User role updated to ${newRole}.`);
      setTimeout(() => setSubmitSuccess(''), 4000);
    } catch (error) {
      console.error('Role update failed:', error);
      setSubmitError('Failed to update user role.');
    }
  }

  async function deleteUserConfirmed(userId) {
    if (!window.confirm(`Delete this user? This cannot be undone.`)) return;
    setDeletingId(userId);
    setDeletingType('user');
    setSubmitError('');
    try {
      await deleteUser(userId);
      setSubmitSuccess('User deleted.');
      setTimeout(() => setSubmitSuccess(''), 4000);
    } catch (error) {
      console.error('User delete failed:', error);
      setSubmitError('Failed to delete user.');
    } finally {
      setDeletingId(null);
      setDeletingType(null);
    }
  }

  // ---- Selection helpers ----
  const toggleOrderSelect = (id) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleAllOrders = () => {
    if (selectedOrderIds.size === filteredOrders.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(filteredOrders.map((o) => o.id)));
    }
  };
  const toggleProductSelect = (id) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleAllProducts = () => {
    if (selectedProductIds.size === filteredProducts.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  const openOrderDetail = (orderId) => {
    setSelectedOrderId(orderId);
  };

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

      {submitError && (
        <div className="form-error" role="alert">{submitError}</div>
      )}
      {submitSuccess && (
        <div className="form-error" style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent)', color: 'var(--ink)' }} role="status">{submitSuccess}</div>
      )}

      <div className="admin-content">
        <div className="admin-tabs" role="tablist" aria-label="Admin workspace">
          <button className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')} role="tab" aria-selected={activeTab === 'overview'} type="button">Overview</button>
          <button className={`admin-tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')} role="tab" aria-selected={activeTab === 'orders'} type="button">Orders</button>
          <button className={`admin-tab ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')} role="tab" aria-selected={activeTab === 'products'} type="button">Products</button>
          <button className={`admin-tab ${activeTab === 'stock' ? 'active' : ''}`} onClick={() => setActiveTab('stock')} role="tab" aria-selected={activeTab === 'stock'} type="button">Stock</button>
          <button className={`admin-tab ${activeTab === 'customers' ? 'active' : ''}`} onClick={() => setActiveTab('customers')} role="tab" aria-selected={activeTab === 'customers'} type="button">Customers</button>
          <button className={`admin-tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')} role="tab" aria-selected={activeTab === 'settings'} type="button">Settings</button>
        </div>

        {/* ==================== OVERVIEW ==================== */}
        {activeTab === 'overview' && (
          <div className="admin-overlay">
            <div className="admin-stats">
              <div className="admin-stat"><span>Total Orders</span><strong>{orderStats?.totalOrders ?? 0}</strong></div>
              <div className="admin-stat"><span>Processing</span><strong>{orderStats?.processing ?? 0}</strong></div>
              <div className="admin-stat"><span>Shipped</span><strong>{orderStats?.shipped ?? 0}</strong></div>
              <div className="admin-stat"><span>Delivered</span><strong>{orderStats?.delivered ?? 0}</strong></div>
              <div className="admin-stat"><span>Revenue</span><strong>{formatPKR(orderStats?.revenue ?? 0)}</strong></div>
              <div className="admin-stat"><span>Products</span><strong>{productStats?.productCount ?? 0}</strong></div>
              <div className="admin-stat"><span>Low Stock</span><strong>{productStats?.lowStock ?? 0}</strong></div>
              <div className="admin-stat"><span>Cancelled</span><strong>{orderStats?.cancelled ?? 0}</strong></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
              <div className="admin-overlay" style={{ padding: '1.2rem' }}>
                <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontFamily: 'var(--serif)' }}>Recent Orders</h2>
                <div className="admin-order-list">
                  {orders.slice(0, 5).map((order) => (
                    <article className="admin-order" key={order.id} onClick={() => openOrderDetail(order.id)} role="button" tabIndex={0} style={{ cursor: 'pointer' }}>
                      <div>
                        <p className="eyebrow">#{order.id.slice(0, 8)}</p>
                        <strong>{order.shippingInfo?.name || 'Customer'}</strong>
                        <span className="admin-order-detail">{order.shippingInfo?.email || 'No email'} · {order.status || 'processing'} · {formatOrderDate(order)}</span>
                      </div>
                      <span className="admin-order-price">{formatPKR(order.total || 0)}</span>
                    </article>
                  ))}
                </div>
              </div>
              <div className="admin-overlay" style={{ padding: '1.2rem' }}>
                <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontFamily: 'var(--serif)' }}>Low Stock Alerts</h2>
                {lowStockProducts.length === 0 ? (
                  <p style={{ color: 'var(--muted)', fontSize: '0.75rem', fontFamily: 'var(--mono)' }}>All products have healthy stock levels.</p>
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
                          <p className="admin-product-price">{formatPKR(product.price || 0)}</p>
                          <span className={`admin-badge admin-badge--${product.stock === 0 ? 'sold-out' : 'low'}`}>{product.stock === 0 ? 'Sold out' : `${product.stock} left`}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== ORDERS ==================== */}
        {activeTab === 'orders' && (
          <div className="admin-overlay">
            <div className="admin-orders-toolbar">
              {selectedOrderIds.size > 0 && (
                <div className="admin-bulk-bar">
                  <span>{selectedOrderIds.size} order(s) selected</span>
                  <select value={bulkAction || ''} onChange={(e) => setBulkAction(e.target.value)} className="admin-order-select">
                    <option value="">Bulk action</option>
                    <option value="processing">Mark Processing</option>
                    <option value="confirmed">Mark Confirmed</option>
                    <option value="shipped">Mark Shipped</option>
                    <option value="delivered">Mark Delivered</option>
                    <option value="cancelled">Mark Cancelled</option>
                  </select>
                  <button className="solid-button" onClick={() => bulkAction && handleBulkOrderStatus(bulkAction)} disabled={!bulkAction} type="button">Apply</button>
                  <button className="outline-button" onClick={() => setSelectedOrderIds(new Set())} type="button">Clear</button>
                </div>
              )}
              {!selectedOrderIds.size || selectedOrderIds.size === 0 && (
                <>
                  <div className="search-box">
                    <span aria-hidden="true">⌕</span>
                    <input value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} placeholder="Search customer, email, or order ID" type="search" />
                  </div>
                  <div className="admin-filter-select">
                    <label htmlFor="orderStatusFilter">Status</label>
                    <select id="orderStatusFilter" value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)}>
                      <option value="all">All statuses</option>
                      {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>
                </>
              )}
            </div>

            {submitError && <div className="form-error" role="alert">{submitError}</div>}
            {submitSuccess && <div className="form-error" style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent)', color: 'var(--ink)' }} role="status">{submitSuccess}</div>}

            {filteredOrders.length === 0 ? (
              <div className="empty-state" style={{ margin: '4rem auto', maxWidth: '35rem', textAlign: 'center' }}>
                <span className="empty-number">00</span>
                <h2>No orders found.</h2>
                <p>Try a different search or status filter.</p>
              </div>
            ) : (
              <div className="admin-order-list">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', padding: '0 0.5rem', fontSize: '0.62rem', color: 'var(--muted)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <span>Select</span>
                  <span>Order</span>
                  <span style={{ flex: 1 }}>Customer</span>
                  <span>Status</span>
                  <span>Total</span>
                  <span>Actions</span>
                </div>
                {filteredOrders.map((order) => {
                  const isSelected = selectedOrderIds.has(order.id);
                  const orderStatus = order.status || 'processing';
                  return (
                    <article className={`admin-order ${isSelected ? 'selected' : ''}`} key={order.id} onClick={() => openOrderDetail(order.id)} role="button" tabIndex={0} style={{ cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleOrderSelect(order.id)} style={{ width: '1rem', height: '1rem', cursor: 'pointer' }} />
                        <div>
                          <p className="eyebrow">#{order.id.slice(0, 8)}</p>
                          <strong>{order.shippingInfo?.name || 'Customer'}</strong>
                          <span className="admin-order-detail">{order.shippingInfo?.email || 'No email'} · {formatOrderDate(order)}</span>
                        </div>
                      </div>
                      <span className="admin-order-price">{formatPKR(order.total || 0)}</span>
                      <div className="admin-order-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                        <select
                          aria-label={`Status for order ${order.id}`}
                          value={orderStatus}
                          onChange={(e) => handleOrderStatusChange(order.id, e.target.value)}
                          className="admin-order-select"
                          style={{ width: '120px', marginBottom: '0.5rem' }}
                        >
                          {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                        {order.trackingNumber && (
                          <span className="admin-order-detail" style={{ fontSize: '0.6rem', whiteSpace: 'nowrap' }}>Tracking: {order.trackingNumber}</span>
                        )}
                        <button
                          className="outline-button"
                          onClick={(e) => { e.stopPropagation(); handleOrderTracking(order.id, order.trackingNumber || ''); }}
                          type="button"
                          style={{ width: '120px', fontSize: '0.62rem', padding: '0.35rem 0.7rem' }}
                        >
                          {order.trackingNumber ? 'Update Tracking' : 'Add Tracking'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
              <span>{filteredOrders.length} of {orders.length} orders</span>
            </div>
          </div>
        )}

        {/* ==================== PRODUCTS ==================== */}
        {activeTab === 'products' && (
          <div className="admin-overlay admin-products">
            <div className="admin-products-toolbar">
              {selectedProductIds.size > 0 && (
                <div className="admin-bulk-bar">
                  <span>{selectedProductIds.size} product(s) selected</span>
                  <button className="solid-button" onClick={handleBulkProductStock} type="button">Restock (+10)</button>
                  <button className="outline-button" onClick={() => setSelectedProductIds(new Set())} type="button">Clear</button>
                </div>
              )}
              {!selectedProductIds.size && (
                <>
                  <div className="search-box">
                    <span aria-hidden="true">⌕</span>
                    <input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Search products" type="search" />
                  </div>
                  <div className="admin-filter-select">
                    <label htmlFor="productCategoryFilter">Category</label>
                    <select id="productCategoryFilter" value={productCategoryFilter} onChange={(e) => setProductCategoryFilter(e.target.value)}>
                      <option value="all">All categories</option>
                      {CATEGORY_KEYS.map((key) => <option key={key} value={key}>{CATEGORY_LABELS[key]}</option>)}
                    </select>
                  </div>
                  <div className="admin-filter-select">
                    <label htmlFor="productStockFilter">Stock</label>
                    <select id="productStockFilter" value={productStockFilter} onChange={(e) => setProductStockFilter(e.target.value)}>
                      <option value="all">All stock</option>
                      <option value="in-stock">In stock</option>
                      <option value="low-stock">Low stock (≤5)</option>
                      <option value="out-of-stock">Out of stock</option>
                    </select>
                  </div>
                  <button className="solid-button full" onClick={startCreateProduct} type="button">+ New product</button>
                </>
              )}
            </div>

            {submitError && <div className="form-error" role="alert">{submitError}</div>}
            {submitSuccess && <div className="form-error" style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent)', color: 'var(--ink)' }} role="status">{submitSuccess}</div>}

            {products.length === 0 ? (
              <div className="empty-state" style={{ margin: '4rem auto', maxWidth: '35rem', textAlign: 'center' }}>
                <span className="empty-number">00</span>
                <h2>Your collection is empty.</h2>
                <p>Add your first product to start selling.</p>
                <button className="solid-button" onClick={startCreateProduct} type="button">Create product</button>
              </div>
            ) : (
              <div className="admin-product-grid">
                {filteredProducts.map((product) => {
                  const isSelected = selectedProductIds.has(product.id);
                  return (
                    <article className={`admin-product-card ${isSelected ? 'selected' : ''}`} key={product.id} onClick={(e) => { if (!e.target.closest('.admin-product-icon-wrap')) startEditProduct(product); }} role="button" tabIndex={0} style={{ cursor: 'pointer' }}>
                      <div className="admin-product-image">
                        <img src={product.imageUrl || ''} alt={product.name} loading="lazy" className="admin-product-main" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        <div className="admin-product-icon-wrap">
                          <Link className="admin-product-icon" to={`/products/${product.id}`} aria-label={`View ${product.name} in the store`} onClick={(e) => e.stopPropagation()}>
                            <span aria-hidden="true">↗</span>
                          </Link>
                          <button className="admin-product-icon" onClick={(e) => { e.stopPropagation(); startEditProduct(product); }} aria-label={`Edit ${product.name}`} type="button">
                            <span aria-hidden="true">✎</span>
                          </button>
                          <button className="admin-product-icon admin-product-icon--danger" onClick={(e) => { e.stopPropagation(); deleteProductConfirmed(product.id); }} aria-label={`Delete ${product.name}`} type="button">
                            <span aria-hidden="true">✕</span>
                          </button>
                        </div>
                      </div>
                      <div className="admin-product-body">
                        <p className="eyebrow">{product.category || 'Uncategorised'}</p>
                        <h3 className="admin-product-name">{product.name}</h3>
                        <p className="admin-product-price">{formatPKR(product.price || 0)}</p>
                        <div className="admin-product-badges">
                          {product.badge && <span className="admin-badge">{product.badge}</span>}
                          {product.salePrice != null && product.salePrice > 0 && <span className="admin-badge admin-badge--sale">Sale</span>}
                          {product.stock === 0 && <span className="admin-badge admin-badge--sold-out">Sold out</span>}
                          {product.stock > 0 && product.stock <= 5 && <span className="admin-badge admin-badge--low">{product.stock} left</span>}
                        </div>
                        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleProductSelect(product.id)}
                            style={{ width: '1rem', height: '1rem', cursor: 'pointer' }}
                          />
                          <label style={{ fontSize: '0.62rem', color: 'var(--muted)', fontFamily: 'var(--mono)', cursor: 'pointer', margin: 0 }}>{product.stock === 0 ? 'Out' : product.stock <= 5 ? 'Low' : 'OK'}</label>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
              <span>{filteredProducts.length} of {products.length} products</span>
            </div>
          </div>
        )}

        {/* ==================== STOCK ==================== */}
        {activeTab === 'stock' && (
          <div className="admin-overlay admin-stock">
            <div className="admin-stock-heading">
              <h2>Inventory Control</h2>
              <p>Manage stock levels for all products.</p>
            </div>
            {products.length === 0 ? (
              <div className="empty-state" style={{ margin: '4rem auto', maxWidth: '35rem', textAlign: 'center' }}>
                <span className="empty-number">00</span>
                <h2>No products in inventory.</h2>
                <p>Add products first to manage stock.</p>
              </div>
            ) : (
              <div className="admin-product-grid admin-product-grid--stock">
                {products.map((product) => {
                  const isLowStock = (product.stock ?? 0) > 0 && (product.stock ?? 0) <= 5;
                  const isOut = (product.stock ?? 0) === 0;
                  return (
                    <article className="admin-product-card" key={product.id}>
                      <div className="admin-product-image">
                        <img src={product.imageUrl || ''} alt={product.name} loading="lazy" className="admin-product-main" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      </div>
                      <div className="admin-product-body" style={{ textAlign: 'left' }}>
                        <p className="eyebrow">{product.category || 'Uncategorised'}</p>
                        <h3 className="admin-product-name">{product.name}</h3>
                        <p className="admin-product-price">{formatPKR(product.price || 0)}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
                          <label style={{ fontSize: '0.62rem', color: 'var(--muted)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, flex: 1 }}>Stock</label>
                          <input
                            type="number"
                            min="0"
                            value={draft[product.id] ?? product.stock ?? ''}
                            onChange={(e) => {
                              const val = Math.max(0, Math.floor(Number(e.target.value) || 0));
                              setDraft((d) => ({ ...d, [product.id]: val }));
                            }}
                            style={{ width: '80px', padding: '0.4rem', border: '1px solid var(--line)', background: 'var(--paper-deep)', color: 'var(--ink)', fontFamily: 'var(--mono)', fontSize: '0.78rem' }}
                          />
                          <button
                            className="solid-button"
                            onClick={() => {
                              const val = draft[product.id] ?? (product.stock ?? 0);
                              setSubmitError('');
                              setSubmitSuccess('');
                              updateProduct(product.id, { stock: val }).then(() => {
                                setSubmitSuccess(`Stock updated for "${product.name}".`);
                                setTimeout(() => setSubmitSuccess(''), 3000);
                                setDraft((d) => { const n = { ...d }; delete n[product.id]; return n; });
                              }).catch(() => setSubmitError('Failed to update stock.'));
                            }}
                            type="button"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem' }}
                          >
                            Save
                          </button>
                        </div>
                        <span className={`admin-badge ${isOut ? 'admin-badge--sold-out' : isLowStock ? 'admin-badge--low' : ''}`}>
                          {isOut ? 'Sold out' : isLowStock ? `${product.stock} left` : 'In stock'}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
            <div className="admin-stock-summary">
              <span>Total products: <strong>{products.length}</strong></span>
              <span>Low stock: <strong>{lowStockProducts.length}</strong></span>
              <span>Out of stock: <strong>{products.filter((p) => (p.stock ?? 0) === 0).length}</strong></span>
              <span>Total units: <strong>{productStats?.totalStock ?? 0}</strong></span>
            </div>
          </div>
        )}

        {/* ==================== CUSTOMERS ==================== */}
        {activeTab === 'customers' && (
          <div className="admin-overlay">
            <div className="admin-orders-toolbar">
              <div className="search-box">
                <span aria-hidden="true">⌕</span>
                <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search customer name or email" type="search" />
              </div>
            </div>
            {submitError && <div className="form-error" role="alert">{submitError}</div>}
            {submitSuccess && <div className="form-error" style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent)', color: 'var(--ink)' }} role="status">{submitSuccess}</div>}
            {users.length === 0 ? (
              <div className="empty-state" style={{ margin: '4rem auto', maxWidth: '35rem', textAlign: 'center' }}>
                <span className="empty-number">00</span>
                <h2>No customers yet.</h2>
                <p>Customers appear here after their first account registration.</p>
              </div>
            ) : (
              <div className="admin-order-list">
                {users.filter((u) => !userSearch || (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) || (u.email || '').toLowerCase().includes(userSearch.toLowerCase())).map((user) => {
                  const userOrders = orders.filter((o) => o.userId === user.id);
                  const userRole = user.role || 'user';
                  const isSelf = user.id === profile?.uid;
                  return (
                    <article className="admin-order" key={user.id}>
                      <div>
                        <p className="eyebrow">#{user.id.slice(0, 8)}</p>
                        <strong>{user.name || 'No name'}</strong>
                        <span className="admin-order-detail">{user.email || 'No email'} · {user.role || 'user'} · {userOrders.length} order(s)</span>
                      </div>
                      <div className="admin-order-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                        <select
                          value={userRole}
                          onChange={(e) => handleUserRoleChange(user.id, e.target.value)}
                          className="admin-order-select"
                          style={{ width: '110px', marginBottom: '0.5rem', opacity: isSelf ? 0.5 : 1, cursor: isSelf ? 'not-allowed' : 'pointer' }}
                          disabled={isSelf}
                        >
                          <option value="user">Customer</option>
                          <option value="admin">Administrator</option>
                        </select>
                        {!isSelf && (
                          <button
                            className="outline-button"
                            onClick={() => deleteUserConfirmed(user.id)}
                            type="button"
                            style={{ width: '110px', fontSize: '0.62rem', padding: '0.35rem 0.7rem' }}
                          >
                            Delete user
                          </button>
                        )}
                        <button
                          className="outline-button"
                          onClick={() => navigate(`/orders?search=${user.email || ''}`)}
                          type="button"
                          style={{ width: '110px', fontSize: '0.62rem', padding: '0.35rem 0.7rem' }}
                        >
                          View orders
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
            <div style={{ marginTop: '1rem', fontSize: '0.65rem', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
              <span>{users.filter((u) => !userSearch || (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) || (u.email || '').toLowerCase().includes(userSearch.toLowerCase())).length} of {users.length} customers</span>
              {users.some((u) => u.role === 'admin') && <span style={{ marginLeft: '1rem' }}>{users.filter((u) => u.role === 'admin').length} admin(s)</span>}
            </div>
          </div>
        )}

        {/* ==================== SETTINGS ==================== */}
        {activeTab === 'settings' && (
          <div className="admin-overlay">
            <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.2rem', fontFamily: 'var(--serif)' }}>Store Settings</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div style={{ background: 'var(--paper-raised)', border: '1px solid var(--line)', borderRadius: '0.4rem', padding: '1.2rem' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontFamily: 'var(--serif)' }}>Shipping &amp; Delivery</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>Free delivery threshold</span>
                    <strong style={{ fontSize: '0.85rem', fontFamily: 'var(--mono)' }}>PKR 20,000</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>Standard delivery fee</span>
                    <strong style={{ fontSize: '0.85rem', fontFamily: 'var(--mono)' }}>PKR 5</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>Payment method</span>
                    <strong style={{ fontSize: '0.85rem', fontFamily: 'var(--mono)' }}>Cash on delivery</strong>
                  </div>
                </div>
              </div>
              <div style={{ background: 'var(--paper-raised)', border: '1px solid var(--line)', borderRadius: '0.4rem', padding: '1.2rem' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontFamily: 'var(--serif)' }}>Store Information</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>Store name</span>
                    <strong style={{ fontSize: '0.85rem', fontFamily: 'var(--mono)' }}>D&Z Cartique</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>Contact email</span>
                    <strong style={{ fontSize: '0.85rem', fontFamily: 'var(--mono)' }}>hello@dzcartique.com</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>Currency</span>
                    <strong style={{ fontSize: '0.85rem', fontFamily: 'var(--mono)' }}>PKR</strong>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ marginTop: '1.5rem', background: 'var(--paper-deep)', border: '1px solid var(--line)', borderRadius: '0.4rem', padding: '1.2rem' }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontFamily: 'var(--serif)' }}>Danger Zone</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  className="outline-button"
                  onClick={() => {
                    if (!window.confirm('Clear ALL orders? This cannot be undone.')) return;
                    setSubmitError('');
                    const ids = orders.map((o) => o.id);
                    bulkDeleteOrders(ids).then(() => {
                      setSubmitSuccess('All orders cleared.');
                      setTimeout(() => setSubmitSuccess(''), 4000);
                    }).catch(() => setSubmitError('Failed to clear orders.'));
                  }}
                  type="button"
                  style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
                >
                  Clear all orders
                </button>
                <p style={{ fontSize: '0.65rem', color: 'var(--muted)', margin: 0, fontFamily: 'var(--mono)' }}>
                  This permanently deletes every order in the database. Use with caution.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Order Detail Modal */}
        {selectedOrderId && (
          <div className="admin-modal-overlay" onClick={() => setSelectedOrderId(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(36,33,31,0.5)', zIndex: 60, display: 'grid', placeItems: 'center' }}>
            <div className="admin-modal" style={{ background: 'var(--paper-raised)', border: '1px solid var(--line)', borderRadius: '0.6rem', padding: '1.8rem', width: '100%', maxWidth: '48rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-float)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontFamily: 'var(--serif)' }}>Order #{selectedOrderId.slice(0, 8)}</h2>
                <button className="admin-product-form-close" onClick={() => setSelectedOrderId(null)} type="button" aria-label="Close">✕</button>
              </div>
              {orders.find((o) => o.id === selectedOrderId) ? (
                <>
                  {selectedOrder && (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div>
                          <p style={{ fontSize: '0.65rem', color: 'var(--muted)', fontFamily: 'var(--mono)', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>Customer</p>
                          <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem' }}>{selectedOrder.shippingInfo?.name || '—'}</p>
                          <p style={{ margin: '0', fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{selectedOrder.shippingInfo?.email || '—'} · {selectedOrder.shippingInfo?.phone || '—'}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.65rem', color: 'var(--muted)', fontFamily: 'var(--mono)', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>Order Meta</p>
                          <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem' }}>{formatOrderDate(selectedOrder)}</p>
                          <p style={{ margin: '0', fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{selectedOrder.paymentMethod === 'card' ? 'Card payment' : 'Cash on delivery'}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.65rem', color: 'var(--muted)', fontFamily: 'var(--mono)', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>Shipping Address</p>
                          <p style={{ margin: '0', fontSize: '0.75rem', lineHeight: '1.5' }}>{selectedOrder.shippingInfo?.address || '—'}</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <p style={{ fontSize: '0.65rem', color: 'var(--muted)', fontFamily: 'var(--mono)', textTransform: 'uppercase', margin: 0 }}>Status</p>
                          <select
                            value={selectedOrder.status || 'processing'}
                            onChange={(e) => handleOrderStatusChange(selectedOrder.id, e.target.value)}
                            className="admin-order-select"
                            style={{ width: '100%', padding: '0.5rem', background: 'var(--paper-deep)', border: '1px solid var(--line)', color: 'var(--ink)', fontFamily: 'var(--mono)', fontSize: '0.78rem' }}
                          >
                            {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                          </select>
                          {selectedOrder.trackingNumber && (
                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>Tracking: {selectedOrder.trackingNumber}</p>
                          )}
                          <input
                            type="text"
                            placeholder="Add tracking number"
                            value=""
                            onChange={(e) => handleOrderTracking(selectedOrder.id, e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem', background: 'var(--paper-deep)', border: '1px solid var(--line)', color: 'var(--ink)', fontFamily: 'var(--mono)', fontSize: '0.78rem' }}
                          />
                          <button
                            className="solid-button"
                            onClick={() => handleDeleteOrder(selectedOrder.id)}
                            type="button"
                            style={{ marginTop: '0.75rem', width: '100%', color: 'var(--accent)', borderColor: 'var(--accent)', background: 'transparent' }}
                          >
                            Delete order
                          </button>
                        </div>
                      </div>
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontFamily: 'var(--serif)' }}>Items ({selectedOrder.items?.length || 0})</h3>
                        <div style={{ border: '1px solid var(--line)', borderRadius: '0.4rem' }}>
                          {selectedOrder.items?.map((item) => (
                            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderBottom: '1px solid var(--line)' }}>
                              <img src={item.imageUrl || ''} alt={item.name} style={{ width: '4rem', height: '5rem', objectFit: 'cover', borderRadius: '0.3rem', background: 'var(--paper-deep)' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                              <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 500 }}>{item.name}</p>
                                <p style={{ margin: '0.15rem 0 0', fontSize: '0.7rem', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{item.quantity} × {formatPKR(item.price)}</p>
                              </div>
                              <strong style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem' }}>{formatPKR(item.price * item.quantity)}</strong>
                            </div>
                          ))}
                          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.75rem', borderTop: '1px solid var(--line)', background: 'var(--paper-deep)' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'var(--mono)', marginRight: '0.75rem' }}>Total:</span>
                            <strong style={{ fontSize: '0.95rem', fontFamily: 'var(--serif)' }}>{formatPKR(selectedOrder.total || 0)}</strong>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', fontFamily: 'var(--mono)' }}>Loading order details…</p>
              )}
            </div>
          </div>
        )}

        {/* Product Form Modal */}
        {showProductForm && (
          <div className="admin-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeProductForm(); }} style={{ position: 'fixed', inset: 0, background: 'rgba(36,33,31,0.5)', zIndex: 60, display: 'grid', placeItems: 'center' }}>
            <div className="admin-product-form">
              <div className="admin-product-form-header">
                <h2>{editingProductId ? 'Edit product' : 'New product'}</h2>
                <button className="admin-product-form-close" onClick={closeProductForm} type="button" aria-label="Close">✕</button>
              </div>
              {submitError && <p className="form-error" role="alert">{submitError}</p>}
              {submitSuccess && <p className="form-error" style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent)', color: 'var(--ink)' }} role="status">{submitSuccess}</p>}
              <div className="product-form-grid">
                <label>Product name
                  <input value={draft.name} onChange={(e) => updateDraft('name', e.target.value)} placeholder="E.g. Linen shirt" type="text" />
                </label>
                <label>Price (PKR)
                  <input value={draft.price} onChange={(e) => updateDraft('price', e.target.value)} placeholder="0" type="number" min="0" step="0.01" />
                </label>
                <label>Sale price (PKR)
                  <input value={draft.salePrice} onChange={(e) => updateDraft('salePrice', e.target.value)} placeholder="Optional" type="number" min="0" step="0.01" />
                </label>
                <label>Compare at price (PKR)
                  <input value={draft.compareAtPrice} onChange={(e) => updateDraft('compareAtPrice', e.target.value)} placeholder="Optional" type="number" min="0" step="0.01" />
                </label>
                <label>Category
                  <select value={draft.category} onChange={(e) => updateDraft('category', e.target.value)}>
                    {CATEGORY_KEYS.map((key) => <option key={key} value={key}>{CATEGORY_LABELS[key]}</option>)}
                    <option value="other">+ Add custom category</option>
                  </select>
                </label>
                <label>Badge
                  <input value={draft.badge} onChange={(e) => updateDraft('badge', e.target.value)} placeholder="e.g. New" type="text" />
                </label>
                <label>Stock
                  <input value={draft.stock} onChange={(e) => updateDraft('stock', e.target.value)} placeholder="0" type="number" min="0" step="1" />
                </label>
                <label>Featured
                  <input type="checkbox" checked={draft.featured} onChange={(e) => updateDraft('featured', e.target.checked)} />
                </label>
                <label>Main Image URL
                  <input value={draft.imageUrl} onChange={(e) => updateDraft('imageUrl', e.target.value)} placeholder="https://..." type="url" />
                </label>
                <label>Alt Text
                  <input value={draft.altText} onChange={(e) => updateDraft('altText', e.target.value)} placeholder="Descriptive alt text" type="text" />
                </label>
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.62rem', color: 'var(--muted)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem' }}>Image Gallery</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    {(draft.gallery || []).map((imgUrl, idx) => (
                      <div key={idx} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                        <img
                          src={imgUrl}
                          alt={`Gallery ${idx + 1}`}
                          style={{ width: '5rem', height: '6rem', objectFit: 'cover', borderRadius: '0.3rem', border: draft.imageUrl === imgUrl ? '2px solid var(--accent)' : '1px solid var(--line)', background: 'var(--paper-deep)' }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setMainImage(idx); }}
                            type="button"
                            style={{ background: draft.imageUrl === imgUrl ? 'var(--accent)' : 'var(--paper-deep)', border: 'none', color: draft.imageUrl === imgUrl ? 'var(--paper)' : 'var(--ink)', padding: '0.2rem', borderRadius: '0.2rem', cursor: 'pointer', fontSize: '0.6rem' }}
                            title={draft.imageUrl === imgUrl ? 'Main image' : 'Set as main'}
                          >
                            {draft.imageUrl === imgUrl ? '★ Main' : '☆ Main'}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeGalleryImage(idx); }}
                            type="button"
                            style={{ background: 'transparent', border: 'none', color: 'var(--accent)', padding: '0.2rem', borderRadius: '0.2rem', cursor: 'pointer', fontSize: '0.6rem' }}
                            title="Remove"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="url"
                      placeholder="Add image URL…"
                      value={draft.newGalleryImage}
                      onChange={(e) => updateDraft('newGalleryImage', e.target.value)}
                      style={{ flex: 1, padding: '0.5rem', border: '1px solid var(--line)', background: 'var(--paper-deep)', color: 'var(--ink)', fontFamily: 'var(--mono)', fontSize: '0.7rem' }}
                    />
                    <button
                      className="solid-button"
                      onClick={() => {
                        const url = draft.newGalleryImage.trim();
                        if (!url) return;
                        setDraft((d) => ({
                          ...d,
                          gallery: [...(d.gallery || []), url],
                          newGalleryImage: '',
                        }));
                      }}
                      type="button"
                      style={{ padding: '0.5rem 0.8rem', fontSize: '0.7rem' }}
                    >
                      Add
                    </button>
                  </div>
                </div>
                <label>Thumbnail URL
                  <input value={draft.thumbnailUrl} onChange={(e) => updateDraft('thumbnailUrl', e.target.value)} placeholder="Optional" type="url" />
                </label>
              </div>
              <div className="admin-product-form-actions">
                <button className="outline-button" onClick={closeProductForm} type="button">Cancel</button>
                <button className="solid-button" onClick={saveProduct} disabled={submitting} type="button">{submitting ? 'Saving…' : editingProductId ? 'Save changes' : 'Create product'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
