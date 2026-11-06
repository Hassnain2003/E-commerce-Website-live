import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StatusMessage } from '../components/ui/StatusMessage';
import { useAuth } from '../context/AuthContext';
import { fetchOrdersForUser, subscribeToOrders } from '../services/orderHistory';

export function OrderHistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  async function loadOrders() {
    setStatus('loading');
    try {
      setOrders(await fetchOrdersForUser(user.uid));
      setStatus('ready');
    } catch (error) {
      console.error('Unable to load orders:', error);
      setStatus('error');
      setError("We couldn't load your order history right now.");
    }
  }

  useEffect(() => {
    setStatus('loading');
    const unsubscribe = subscribeToOrders(
      user.uid,
      (nextOrders) => {
        setOrders(nextOrders);
        setStatus('ready');
      },
      (err) => {
        console.error('Unable to subscribe to orders:', err);
        setStatus('error');
        setError("We couldn't load your order history right now.");
      },
    );
    return unsubscribe;
  }, [user.uid]);

  return (
    <div className="inner-page orders-page">
      <div className="inner-page-heading">
        <div>
          <p className="eyebrow"><span className="eyebrow-line" />Account history</p>
          <h1>Your <em>orders.</em></h1>
        </div>
      </div>
      {status === 'loading' && <div className="order-list-loading">Loading your orders…</div>}
      {status === 'error' && <StatusMessage action={<button className="outline-button" onClick={loadOrders} type="button">Try again</button>} description={error} title="Something went quiet" />}
      {status === 'ready' && orders.length === 0 && <div className="empty-state"><span className="empty-number">00</span><h2>No orders yet.</h2><p>Your next favorite piece is waiting in the collection.</p><Link className="solid-button" to="/">Explore the collection <span>↘</span></Link></div>}
      {status === 'ready' && orders.length > 0 && (
        <div className="order-list">
          {orders.map((order) => (
            <article className="order-card" key={order.id} onClick={() => navigate(`/orders/${order.id}`)} role="button" tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && navigate(`/orders/${order.id}`)}>
              <div className="order-card-header">
                <div>
                  <p className="eyebrow">Order #{order.id.slice(0, 8)}</p>
                  <span>{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'Date pending'}</span>
                </div>
                <strong className={`order-status ${order.status || 'processing'}`}>{order.status || 'processing'}</strong>
              </div>
              <div className="order-card-items">
                {(order.items || []).map((item) => (
                  <div className="order-item" key={item.id}>
                    <span>{item.name} × {item.quantity}</span>
                    <strong>PKR {(item.price * item.quantity).toLocaleString()}</strong>
                  </div>
                ))}
              </div>
              <div className="order-card-total">
                <span>Total</span>
                <strong>PKR {Number(order.total || 0).toLocaleString()}</strong>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
