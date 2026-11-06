import { useState } from 'react';
import { useCart } from '../../context/CartContext';

export function ProductCard({ product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const fallbackImage = `https://placehold.co/800x1000/e6dfd5/24211f?text=${encodeURIComponent(product.name)}`;
  const image = product.imageUrl || fallbackImage;

  function handleAdd() {
    addItem({
      id: product.id,
      name: product.name,
      price: Number(product.price) || 0,
      imageUrl: product.imageUrl || '',
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <img src={image} alt={product.name} className="product-image" onError={(event) => { event.currentTarget.src = fallbackImage; }} />
        <span className="product-category">{product.category || 'Essential'}</span>
      </div>
      <div className="product-card-body">
        <div>
          <h3>{product.name}</h3>
          <p>{product.description || 'Made for your everyday rotation.'}</p>
        </div>
        <div className="product-card-footer">
          <span className="product-price">PKR {Number(product.price || 0).toLocaleString()}</span>
          <button className="add-button" onClick={handleAdd} type="button">
            {added ? 'Added' : 'Add +'}
          </button>
        </div>
      </div>
    </article>
  );
}
