import { Link } from 'react-router-dom';
import { ProductCard } from './ProductCard';

export function RelatedProducts({ products, currentProductId }) {
  const related = products.filter((product) => product.id !== currentProductId);

  if (related.length === 0) return null;

  return (
    <section className="related-products">
      <div className="related-heading">
        <h2>Considered <em>companions.</em></h2>
        <Link className="text-link" to="/">
          Browse the full edit <span>↗</span>
        </Link>
      </div>
      <div className="product-grid">{related.map((product) => <ProductCard key={product.id} product={product} />)}</div>
    </section>
  );
}
