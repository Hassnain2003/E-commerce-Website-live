import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { StatusMessage } from '../components/ui/StatusMessage';
import { useAuth } from '../context/AuthContext';
import { subscribeToOrder } from '../services/orderHistory';

const STATUS_STEPS = ['processing', 'confirmed', 'shipped', 'delivered'];
const STATUS_LABELS = {
  processing: 'Processing',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function orderDate(order) {
  if (!order?.createdAt) return null;
  if (typeof order.createdAt.toDate === 'function') return order.createdAt.toDate();
  if (typeof order.createdAt === 'number') return new Date(order.createdAt);
  if (order.createdAt instanceof Date) return order.createdAt;
  return null;
}

function formatDate(date) {
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function estimatedDelivery(order) {
  const base = orderDate(order);
  if (!base) return '—';
  const status = order.status || 'processing';
  if (status === 'cancelled') return 'Cancelled';
  if (status === 'delivered') return `Delivered on ${formatDate(base)}`;
  const days = status === 'shipped' ? 3 : status === 'confirmed' ? 5 : 7;
  const estimated = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
  return `Estimated delivery ${formatDate(estimated)}`;
}
export function OrderDetailsPage() {
  const { orderId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    setStatus('loading');
    setError('');
    const unsubscribe = subscribeToOrder(
      orderId,
      (next) => {
        if (!next) {
          setStatus('not-found');
          return;
        }
        setOrder(next);
        setStatus('ready');
      },
      (err) => {
        console.error('Unable to subscribe to order:', err);
        setStatus('error');
        setError('We could not load that order right now. Check your connection and try again.');
      },
    );
    return unsubscribe;
  }, [orderId]);

  if (status === 'loading') {
    return (
      <div className="inner-page order-page">
        <div className="inner-page-heading"><p className="eyebrow"><span className="eyebrow-line" />Order details</p><h1>Loading…</h1></div>
        <div className="order-detail-loading">Loading your order…</div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="inner-page order-page">
        <div className="inner-page-heading"><p className="eyebrow"><span className="eyebrow-line" />Order details</p><h1>That page moved.</h1></div>
        <StatusMessage action={<button className="outline-button" onClick={() => navigate('/orders')} type="button">View your orders</button>} description={error} title="Something went quiet" />
      </div>
    );
  }

  if (status === 'not-found') {
    return (
      <div className="inner-page order-page">
        <div className="inner-page-heading"><p className="eyebrow"><span className="eyebrow-line" />Order details</p><h1>That page moved.</h1></div>
        <div className="empty-state" style={{ margin: '4rem auto', maxWidth: '35rem', textAlign: 'center' }}>
          <span className="empty-number">—</span>
          <h2>That order isn't here.</h2>
          <p>The order you're looking for doesn't exist or you don't have access to it.</p>
          <Link className="solid-button" to="/orders" type="button">View your orders <span>↗</span></Link>
        </div>
      </div>
    );
  }

  if (!order) return null;
  const orderStatus = order.status || 'processing';
  const isCancelled = orderStatus === 'cancelled';
  const stepIndex = STATUS_STEPS.indexOf(orderStatus);
  const date = orderDate(order);
  const items = order.items || [];
  const tracking = order.trackingNumber;
  const shippingInfo = order.shippingInfo || {};

  return (
    <div className="inner-page order-page">
      <div className="inner-page-heading">
        <div>
          <p className="eyebrow"><span className="eyebrow-line" />Order details</p>
          <h1>Order #{order.id.slice(0, 8)}</h1>
        </div>
        <Link className="text-link" to="/orders">Back to your orders <span>↗</span></Link>
      </div>

      <div className="order-status-badge">{isCancelled ? STATUS_LABELS.cancelled : STATUS_LABELS[orderStatus]}</div>

      <div className="order-timeline">
        {STATUS_STEPS.map((step, index) => {
          const completed = stepIndex >= 0 && index <= stepIndex;
          const current = stepIndex === index;
          return (
            <div className="order-timeline-step" key={step}>
              <div className={`order-timeline-marker ${completed ? 'completed' : ''} ${current ? 'current' : ''}`}>
                {completed ? '✔' : index + 1}
              </div>
              <span className={`order-timeline-label ${completed || current ? '' : 'faint'}`}>{STATUS_LABELS[step]}</span>
            </div>
          );
        })}
      </div>

      <div className="order-detail">
        <aside className="order-meta">
          <h3>Order summary</h3>
          <div className="meta-row"><span>Order number</span><strong>#{order.id}</strong></div>
          <div className="meta-row"><span>Placed on</span><strong>{date ? formatDate(date) : '—'}</strong></div>
          <div className="meta-row"><span>Status</span><strong className={`order-status ${orderStatus}`}>{STATUS_LABELS[orderStatus]}</strong></div>
          <div className="meta-row"><span>Payment method</span><strong>{order.paymentMethod === 'card' ? 'Card payment' : 'Cash on delivery'}</strong></div>
          {tracking && <div className="meta-row"><span>Tracking number</span><strong>{tracking}</strong></div>}
          <div className="meta-row"><span>Estimated delivery</span><strong>{estimatedDelivery(order)}</strong></div>
          <div className="meta-divider" />
          <div className="meta-row"><span>Items total</span><strong>PKR {Number(order.subtotal || 0).toLocaleString()}</strong></div>
          <div className="meta-row"><span>Delivery</span><strong>{order.shipping === 0 ? 'Free' : `PKR ${Number(order.shipping || 0).toLocaleString()}`}</strong></div>
          <div className="meta-row total-row"><span>Total</span><strong>PKR {Number(order.total || 0).toLocaleString()}</strong></div>
        </aside>

        <section className="order-items">
          <h3>Items ({items.length})</h3>
          <div className="order-items-grid">
            {items.map((item) => (
              <article className="order-item-card" key={item.id}>
                <img className="order-item-image" src={item.imageUrl || ''} alt={item.name} loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
                <div className="order-item-info">
                  <strong>{item.name}</strong>
                  <span className="order-item-qty">× {item.quantity}</span>
                </div>
                <strong className="order-item-price">PKR {(item.price * item.quantity).toLocaleString()}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="order-delivery">
          <h3>Delivery to</h3>
          <p className="delivery-name">{shippingInfo.name || '—'}</p>
          <p className="delivery-address">{shippingInfo.address || '—'}</p>
          <p className="delivery-contact">{shippingInfo.phone || '—'} · {shippingInfo.email || '—'}</p>
        </section>
      </div>

      <p style={{ marginTop: '3rem', textAlign: 'center' }}><Link className="text-link" to="/orders">Back to your orders <span>↗</span></Link></p>
    </div>
  );
}
