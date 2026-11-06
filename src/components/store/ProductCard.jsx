import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

export function ProductCard({ product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const fallbackImage = `https://placehold.co/800x1000/e6dfd5/24211f?text=${encodeURIComponent(product.name)}`;
  const image = product.imageUrl || fallbackImage;
  const isSoldOut = product.stock === 0;

  function handleAdd(event) {
    event.stopPropagation();
    if (isSoldOut) return;
    addItem({
      id: product.id,
      name: product.name,
      price: product.currentPrice,
      imageUrl: product.imageUrl || '',
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <article className="product-card">
      <Link className="product-card-link" to={`/products/${product.id}`} aria-label={`View ${product.name} details`}>
        <div className="product-image-wrap">
          <img src={image} alt={product.name} className="product-image" loading="lazy" onError={(event) => { event.currentTarget.src = fallbackImage; }} />
          <span className="product-category">{product.badge || product.category || 'Essential'}</span>
          {isSoldOut && <span className="product-stock-badge">Sold out</span>}
        </div>
        <div className="product-card-body">
          <div>
            <h3>{product.name}</h3>
            <p>{product.description || 'Made for your everyday rotation.'}</p>
          </div>
          <div className="product-card-footer">
            <span className="product-price">
              {product.salePrice && <del>PKR {product.price.toLocaleString()}</del>}
              PKR {product.currentPrice.toLocaleString()}
            </span>
            <button aria-disabled={isSoldOut} className="add-button" disabled={isSoldOut} onClick={handleAdd} type="button">
              {isSoldOut ? 'Sold out' : added ? 'Added' : 'Add +'}
            </button>
          </div>
        </div>
      </Link>
    </article>
  );
}
