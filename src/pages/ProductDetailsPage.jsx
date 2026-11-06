import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { StatusMessage } from '../components/ui/StatusMessage';
import { useCart } from '../context/CartContext';
import { fetchProductById, fetchProducts } from '../services/products';
import { ProductGallery } from '../components/store/ProductGallery';
import { RelatedProducts } from '../components/store/RelatedProducts';

export function ProductDetailsPage() {
  const { productId } = useParams();
  const { addItem, updateQuantity } = useCart();
  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  async function loadProduct() {
    setStatus('loading');
    setError('');
    try {
      const found = await fetchProductById(productId);
      if (!found) {
        setStatus('not-found');
        return;
      }
      const products = await fetchProducts();
      setProduct(found);
      setAllProducts(products);
      setStatus('ready');
      setQuantity(1);
    } catch (err) {
      console.error('Unable to load product:', err);
      setStatus('error');
      setError('We could not load that piece right now. Check your connection and try again.');
    }
  }

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const isSoldOut = product?.stock === 0;
  const maxQuantity = product?.stock != null && product.stock > 0 ? product.stock : 99;

  function handleQuantityChange(event) {
    const next = Math.max(1, Math.floor(Number(event.target.value) || 1));
    setQuantity(Math.min(next, maxQuantity));
  }

  async function handleAddToCart(event) {
    event.preventDefault();
    if (isSoldOut || quantity < 1) return;
    const productToAdd = {
      id: product.id,
      name: product.name,
      price: product.currentPrice,
      imageUrl: product.imageUrl || '',
    };
    addItem(productToAdd);
    if (quantity > 1) {
      updateQuantity(product.id, quantity);
    }
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  if (status === 'loading') {
    return (
      <div className="inner-page product-page">
        <div className="inner-page-heading"><p className="eyebrow"><span className="eyebrow-line" />Product details</p><h1>Loading…</h1></div>
        <div className="product-loading"><div className="skeleton-card" /><div className="skeleton-card" /><div className="skeleton-card" /></div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="inner-page product-page">
        <div className="inner-page-heading"><p className="eyebrow"><span className="eyebrow-line" />Product details</p><h1>That page moved.</h1></div>
        <StatusMessage action={<button className="outline-button" onClick={loadProduct} type="button">Try again</button>} description={error} title="Something went quiet" />
        <p style={{ marginTop: '1.5rem' }}><Link className="text-link" to="/">Return to the shop</Link></p>
      </div>
    );
  }

  if (status === 'not-found') {
    return (
      <div className="inner-page product-page">
        <div className="inner-page-heading"><p className="eyebrow"><span className="eyebrow-line" />Product details</p><h1>That page moved.</h1></div>
        <div className="empty-state" style={{ margin: '4rem auto', maxWidth: '35rem', textAlign: 'center' }}>
          <span className="empty-number">—</span>
          <h2>That piece isn't here.</h2>
          <p>The product you're looking for doesn't exist or has been removed from the collection.</p>
          <Link className="solid-button" to="/">Return to the shop <span>↘</span></Link>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const hasSale = Boolean(product.salePrice);
  const lowStock = product.stock != null && product.stock > 0 && product.stock <= 5;
  const relatedProducts = allProducts.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 4);

  return (
    <div className="inner-page product-page">
      <div className="inner-page-heading"><p className="eyebrow"><span className="eyebrow-line" />Product details</p><h1>{product.name}<em>.</em></h1></div>
      <div className="product-detail">
        <aside className="product-media">
          <ProductGallery imageUrl={product.imageUrl} alt={product.altText || product.name} thumbnails={product.gallery || []} />
          {product.altText && <p className="product-image-caption">{product.altText}</p>}
        </aside>
        <div className="product-info">
          <div className="product-badges">
            {product.badge && <span className="product-badge">{product.badge}</span>}
            <span className="product-category">{product.category}</span>
          </div>
          <p className="product-description">{product.description || 'Made for your everyday rotation.'}</p>
          <div className="product-pricing">
            {hasSale && <del>PKR {product.price.toLocaleString()}</del>}
            <strong>PKR {product.currentPrice.toLocaleString()}</strong>
          </div>
          <div className="product-stock">
            {isSoldOut ? <span className="stock sold-out">Sold out</span> : lowStock ? <span className="stock low-stock">Low stock — only {product.stock} left</span> : <span className="stock in-stock">In stock</span>}
          </div>
          <form className="product-actions" onSubmit={handleAddToCart}>
            <div className="quantity-field">
              <label htmlFor="product-quantity">Quantity</label>
              <input id="product-quantity" max={maxQuantity} min={1} onChange={handleQuantityChange} type="number" value={quantity} />
            </div>
            <button className="solid-button full" disabled={isSoldOut || added} type="submit">
              {added ? 'Added' : isSoldOut ? 'Sold out' : 'Add to bag'}
            </button>
          </form>
          <p className="product-cart-hint">Adds to your persistent bag. Checkout when you're ready.</p>
        </div>
      </div>

      {relatedProducts.length > 0 && <RelatedProducts products={relatedProducts} currentProductId={product.id} />}

      <p style={{ marginTop: '3rem', textAlign: 'center' }}><Link className="text-link" to="/">Back to the shop <span>↗</span></Link></p>
    </div>
  );
}