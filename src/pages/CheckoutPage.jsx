import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { createOrder } from '../services/orders';

export function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', paymentMethod: 'cod' });
  const [status, setStatus] = useState('idle');
  const [orderId, setOrderId] = useState('');
  const shipping = 5;

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function submitOrder(event) {
    event.preventDefault();
    if (!items.length) return;
    setStatus('submitting');
    try {
      const id = await createOrder({ userId: auth.currentUser.uid, items, shippingInfo: { name: form.name, email: form.email, phone: form.phone, address: form.address }, paymentMethod: form.paymentMethod });
      setOrderId(id);
      clearCart();
      setStatus('success');
    } catch (error) {
      console.error('Unable to place order:', error);
      setStatus('error');
    }
  }

  if (!items.length && status !== 'success') {
    return <div className="inner-page"><div className="empty-state"><span className="empty-number">—</span><h2>Your bag is empty.</h2><p>Add something to your bag before checking out.</p><Link className="solid-button" to="/">Back to the collection</Link></div></div>;
  }

  if (status === 'success') {
    return <div className="inner-page"><div className="confirmation-state"><p className="eyebrow"><span className="eyebrow-line" />Order received</p><h1>It's on <em>its way.</em></h1><p>Your order has been placed. Keep this reference close: <strong>#{orderId.slice(0, 8)}</strong></p><button className="solid-button" onClick={() => navigate('/orders')} type="button">View your orders <span>↗</span></button></div></div>;
  }

  return (
    <div className="inner-page checkout-page">
      <div className="inner-page-heading"><p className="eyebrow"><span className="eyebrow-line" />Almost there</p><h1>Make it <em>yours.</em></h1></div>
      <form className="checkout-layout" onSubmit={submitOrder}>
        <div className="checkout-form">
          <div className="form-section"><span className="section-number">01</span><div><h2>Delivery details</h2><p className="form-hint">Where should we send your order?</p></div></div>
          <div className="field-grid">
            <label>Full name<input name="name" onChange={updateField} required value={form.name} /></label>
            <label>Email address<input name="email" onChange={updateField} required type="email" value={form.email} /></label>
            <label>Phone number<input name="phone" onChange={updateField} required value={form.phone} /></label>
            <label className="wide">Delivery address<textarea name="address" onChange={updateField} required rows="3" value={form.address} /></label>
          </div>
          <div className="form-section"><span className="section-number">02</span><div><h2>Payment method</h2><p className="form-hint">Simple and secure.</p></div></div>
          <div className="payment-options">
            <label className={form.paymentMethod === 'cod' ? 'payment-option selected' : 'payment-option'}><input checked={form.paymentMethod === 'cod'} name="paymentMethod" onChange={updateField} type="radio" value="cod" /><span><strong>Cash on delivery</strong><small>Pay when your order arrives</small></span></label>
            <label className={form.paymentMethod === 'card' ? 'payment-option selected' : 'payment-option'}><input checked={form.paymentMethod === 'card'} name="paymentMethod" onChange={updateField} type="radio" value="card" /><span><strong>Card payment</strong><small>Secure card checkout coming soon</small></span></label>
          </div>
          {status === 'error' && <p className="form-error" role="alert">We couldn't place that order. Please check your details and try again.</p>}
          <button className="solid-button" disabled={status === 'submitting'} type="submit">{status === 'submitting' ? 'Placing order…' : 'Place order'} <span>↗</span></button>
        </div>
        <aside className="summary-card checkout-summary"><p className="eyebrow"><span className="eyebrow-line" />Your order</p>{items.map((item) => <div className="checkout-item" key={item.id}><span>{item.name} × {item.quantity}</span><strong>PKR {(item.price * item.quantity).toLocaleString()}</strong></div>)}<div className="summary-total"><span>Total</span><strong>PKR {(subtotal + shipping).toLocaleString()}</strong></div></aside>
      </form>
    </div>
  );
}
