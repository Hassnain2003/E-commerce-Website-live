import { Link } from 'react-router-dom';
import { CartLineItem } from '../components/store/CartLineItem';
import { useCart } from '../context/CartContext';
import { shippingFor, FREE_DELIVERY_THRESHOLD } from '../services/orders';

export function CartPage() {
  const { items, subtotal } = useCart();
  const shipping = shippingFor(subtotal);

  return (
    <div className="inner-page cart-page">
      <div className="inner-page-heading">
        <p className="eyebrow"><span className="eyebrow-line" />Your selection</p>
        <h1>Your <em>bag.</em></h1>
      </div>
      {items.length === 0 ? (
        <div className="empty-state">
          <span className="empty-number">00</span>
          <h2>Nothing here yet.</h2>
          <p>Good things take time. Start with one piece that feels like you.</p>
          <Link className="solid-button" to="/">Explore the collection <span>↘</span></Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">{items.map((item) => <CartLineItem item={item} key={item.id} />)}</div>
          <aside className="summary-card">
            <p className="eyebrow"><span className="eyebrow-line" />Summary</p>
            <div className="summary-row"><span>Subtotal</span><strong>PKR {subtotal.toLocaleString()}</strong></div>
            <div className="summary-row"><span>Delivery</span><strong>PKR {shipping.toLocaleString()}</strong></div>
            <div className="summary-total"><span>Total</span><strong>PKR {(subtotal + shipping).toLocaleString()}</strong></div>
            <Link className="solid-button full" to="/checkout">Continue to checkout <span>↗</span></Link>
            {shipping === 0 ? (
              <p className="summary-note">Delivery is free on this order.</p>
            ) : (
              <>
                <p className="summary-note">Free delivery on orders over PKR {FREE_DELIVERY_THRESHOLD.toLocaleString()}.</p>
                {subtotal > 0 && subtotal < FREE_DELIVERY_THRESHOLD && <p className="summary-note">Add PKR {(FREE_DELIVERY_THRESHOLD - subtotal).toLocaleString()} more for free delivery.</p>}
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
