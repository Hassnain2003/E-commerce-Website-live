import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusMessage } from '../components/ui/StatusMessage';
import { useAuth } from '../context/AuthContext';
import { fetchOrdersForUser } from '../services/orderHistory';

export function OrderHistoryPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('loading');

  async function loadOrders() {
    setStatus('loading');
    try {
      setOrders(await fetchOrdersForUser(user.uid));
      setStatus('ready');
    } catch (error) {
      console.error('Unable to load orders:', error);
      setStatus('error');
    }
  }

  useEffect(() => { loadOrders(); }, [user.uid]);

  return (
    <div className="inner-page orders-page">
      <div className="inner-page-heading"><p className="eyebrow"><span className="eyebrow-line" />Account history</p><h1>Your <em>orders.</em></h1></div>
      {status === 'loading' && <div className="order-list-loading">Loading your orders…</div>}
      {status === 'error' && <StatusMessage action={<button className="outline-button" onClick={loadOrders} type="button">Try again</button>} description="We couldn't load your order history right now." title="Something went quiet" />}
      {status === 'ready' && orders.length === 0 && <div className="empty-state"><span className="empty-number">00</span><h2>No orders yet.</h2><p>Your next favorite piece is waiting in the collection.</p><Link className="solid-button" to="/">Explore the collection <span>↘</span></Link></div>}
      {status === 'ready' && orders.length > 0 && <div className="order-list">{orders.map((order) => <OrderCard key={order.id} order={order} />)}</div>}
    </div>
  );
}

function OrderCard({ order }) {
  const date = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'Date pending';
  return <article className="order-card"><div className="order-card-header"><div><p className="eyebrow">Order #{order.id.slice(0, 8)}</p><span>{date}</span></div><strong className={`order-status ${order.status || 'processing'}`}>{order.status || 'processing'}</strong></div><div className="order-card-items">{(order.items || []).map((item) => <div className="order-item" key={item.id}><span>{item.name} × {item.quantity}</span><strong>PKR {(item.price * item.quantity).toLocaleString()}</strong></div>)}</div><div className="order-card-total"><span>Total</span><strong>PKR {Number(order.total || 0).toLocaleString()}</strong></div></article>;
}
