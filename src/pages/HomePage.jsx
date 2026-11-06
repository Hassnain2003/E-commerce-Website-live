import { useEffect, useMemo, useState } from 'react';
import { ProductCard } from '../components/store/ProductCard';
import { StatusMessage } from '../components/ui/StatusMessage';
import { CATEGORY_LABELS, fetchProducts } from '../services/products';

export function HomePage() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('featured');
  const [status, setStatus] = useState('loading');

  async function loadProducts() {
    setStatus('loading');
    try {
      setProducts(await fetchProducts());
      setStatus('ready');
    } catch (error) {
      console.error('Unable to load products:', error);
      setStatus('error');
    }
  }

  useEffect(() => { loadProducts(); }, []);

  const categories = useMemo(() => {
    const available = [...new Set(products.map((product) => product.category).filter(Boolean))];
    return [
      { value: 'all', label: 'All pieces' },
      ...available.map((value) => ({ value, label: CATEGORY_LABELS[value] || value.replaceAll('-', ' ') })),
    ];
  }, [products]);

  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const matchesCategory = category === 'all' || product.category === category;
      const haystack = `${product.name} ${product.description || ''}`.toLowerCase();
      return matchesCategory && haystack.includes(search.toLowerCase().trim());
    });
    return [...filtered].sort((a, b) => {
      if (sort === 'price-low') return Number(a.price || 0) - Number(b.price || 0);
      if (sort === 'price-high') return Number(b.price || 0) - Number(a.price || 0);
      if (sort === 'featured') return Number(b.featured) - Number(a.featured) || b.createdAtValue - a.createdAtValue;
      return b.createdAtValue - a.createdAtValue;
    });
  }, [category, products, search, sort]);

  function clearFilters() {
    setCategory('all');
    setSearch('');
    setSort('featured');
  }

  return (
    <div className="shop-page">
      <section className="shop-hero">
        <div>
          <p className="eyebrow"><span className="eyebrow-line" />The D&Z edit / 01</p>
          <h1>Wear what<br /><em>feels like you.</em></h1>
          <p className="hero-description">Everyday pieces with a little more intention. Designed in Pakistan, made for wherever you are going.</p>
          <a className="line-link" href="#catalog">Explore the edit <span>↘</span></a>
        </div>
        <div className="hero-stamp" aria-hidden="true">
          <span>NEW</span><strong>FORM<br />FOLLOWS<br /><i>FEELING</i></strong><small>EST. 2025 / D&Z</small>
        </div>
      </section>

      <section className="catalog" id="catalog">
        <div className="catalog-heading">
          <div>
            <p className="eyebrow"><span className="eyebrow-line" />Shop the collection</p>
            <h2>Considered <em>pieces.</em></h2>
          </div>
          <span className="catalog-count">{products.length} pieces</span>
        </div>
        <div className="catalog-toolbar">
          <div className="category-tabs" aria-label="Product categories">
            {categories.map((item) => (
              <button className={category === item.value ? 'category-tab active' : 'category-tab'} key={item.value} onClick={() => setCategory(item.value)} type="button">{item.label}</button>
            ))}
          </div>
          <div className="catalog-controls">
            <label className="search-field">
              <span className="sr-only">Search products</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search the edit" type="search" />
              <span>⌕</span>
            </label>
            <label className="sort-field">
              <span className="sr-only">Sort products</span>
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="featured">Featured</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
              </select>
            </label>
          </div>
        </div>
        {(category !== 'all' || search) && <div className="active-filters"><span>Showing {visibleProducts.length} of {products.length}</span><button onClick={clearFilters} type="button">Clear filters ×</button></div>}
        {status === 'loading' && <div className="product-grid"><div className="skeleton-card" /><div className="skeleton-card" /><div className="skeleton-card" /></div>}
        {status === 'error' && <StatusMessage action={<button className="outline-button" onClick={loadProducts} type="button">Try again</button>} description="We couldn't load the collection right now. Check your connection and try again." title="Something went quiet" />}
        {status === 'ready' && visibleProducts.length === 0 && <StatusMessage action={<button className="outline-button" onClick={clearFilters} type="button">Clear filters</button>} description="Try another search or browse a different category." title="No pieces found" />}
        {status === 'ready' && visibleProducts.length > 0 && <div className="product-grid">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div>}
      </section>
    </div>
  );
}
