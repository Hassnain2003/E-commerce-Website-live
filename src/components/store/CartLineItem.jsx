import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

export function CartLineItem({ item }) {
  const { updateQuantity, removeItem } = useCart();
  const fallbackImage = `https://placehold.co/240x300/e6dfd5/24211f?text=${encodeURIComponent(item.name)}`;
  const image = item.imageUrl || fallbackImage;

  return (
    <article className="cart-line">
      <img src={image} alt="" className="cart-line-image" loading="lazy" sizes="(max-width: 520px) 20vw, 10vw" onError={(event) => { event.currentTarget.src = fallbackImage; }} />
      <div className="cart-line-details">
        <p className="eyebrow">{item.category || 'D&Z essential'}</p>
        <h2>{item.name}</h2>
        <span>PKR {Number(item.price || 0).toLocaleString()}</span>
        <div className="quantity-control" aria-label={`Quantity for ${item.name}`}>
          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} type="button" aria-label="Decrease quantity">−</button>
          <span>{item.quantity}</span>
          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} type="button" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <div className="cart-line-actions">
        <strong>PKR {(item.price * item.quantity).toLocaleString()}</strong>
        <button className="remove-button" onClick={() => removeItem(item.id)} type="button">Remove</button>
      </div>
    </article>
  );
}
