import { useEffect, useState } from 'react';
import { StatusMessage } from '../components/ui/StatusMessage';
import { useAuth } from '../context/AuthContext';
import { fetchAdminOrders, updateOrderStatus } from '../services/admin';

export function AdminPage() {
  const { profile, signOut } = useAuth();
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('loading');

  async function loadOrders() {
    setStatus('loading');
    try {
      setOrders(await fetchAdminOrders());
      setStatus('ready');
    } catch (error) {
      console.error('Unable to load admin orders:', error);
      setStatus('error');
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function changeStatus(orderId, nextStatus) {
    try {
      await updateOrderStatus(orderId, nextStatus);
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId ? { ...order, status: nextStatus } : order,
        ),
      );
    } catch (error) {
      console.error('Unable to update order status:', error);
      setStatus('error');
    }
  }

  return (
    <div className="inner-page admin-page">
      <div className="inner-page-heading admin-heading">
        <div>
          <p className="eyebrow"><span className="eyebrow-line" />Restricted workspace</p>
          <h1>Good work, <em>{profile?.name || 'admin'}.</em></h1>
        </div>
        <button className="outline-button" onClick={signOut} type="button">Sign out</button>
      </div>
      {status === 'loading' && <div className="order-list-loading">Loading workspace…</div>}
      {status === 'error' && (
        <StatusMessage
          action={<button className="outline-button" onClick={loadOrders} type="button">Try again</button>}
          description="We couldn't load the admin workspace."
          title="Something went quiet"
        />
      )}
      {status === 'ready' && (
        <div className="admin-content">
          <div className="admin-stat">
            <span>Orders</span>
            <strong>{orders.length}</strong>
          </div>
          <div className="admin-order-list">
            {orders.map((order) => (
              <article className="admin-order" key={order.id}>
                <div>
                  <p className="eyebrow">#{order.id.slice(0, 8)}</p>
                  <strong>{order.shippingInfo?.name || 'Customer'}</strong>
                  <span>{order.shippingInfo?.email || 'No email'} · PKR {Number(order.total || 0).toLocaleString()}</span>
                </div>
                <select
                  aria-label={`Status for order ${order.id}`}
                  onChange={(event) => changeStatus(order.id, event.target.value)}
                  value={order.status || 'processing'}
                >
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
