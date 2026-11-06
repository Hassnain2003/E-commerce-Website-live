import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductCard } from '../components/store/ProductCard';
import { StatusMessage } from '../components/ui/StatusMessage';
import { CATEGORY_LABELS, fetchProducts } from '../services/products';

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState('loading');
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  const category = searchParams.get('category') || 'all';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'featured';
  const priceMinRaw = searchParams.get('priceMin') || '';
  const priceMaxRaw = searchParams.get('priceMax') || '';
  const availability = searchParams.get('availability') || '';
  const featured = searchParams.get('featured') || '';
  const sale = searchParams.get('sale') || '';

  const priceMin = priceMinRaw ? Number(priceMinRaw) : null;
  const priceMax = priceMaxRaw ? Number(priceMaxRaw) : null;

  const categories = useMemo(() => {
    const available = [...new Set(products.map((product) => product.category).filter(Boolean))];
    return [
      { value: 'all', label: 'All pieces' },
      ...available.map((value) => ({ value, label: CATEGORY_LABELS[value] || value.replaceAll('-', ' ') })),
    ];
  }, [products]);

  const activeFilters = [];
  if (category !== 'all') activeFilters.push({ key: 'category', label: CATEGORY_LABELS[category] || category.replaceAll('-', ' ') });
  if (search) activeFilters.push({ key: 'search', label: `Search: "${search}"` });
  if (sort !== 'featured') activeFilters.push({ key: 'sort', label: `Sort: ${sort.replaceAll('-', ' ')}` });
  if (priceMin) activeFilters.push({ key: 'priceMin', label: `Min PKR ${priceMin.toLocaleString()}` });
  if (priceMax) activeFilters.push({ key: 'priceMax', label: `Max PKR ${priceMax.toLocaleString()}` });
  if (availability === 'in-stock') activeFilters.push({ key: 'availability', label: 'In stock' });
  if (availability === 'sold-out') activeFilters.push({ key: 'availability', label: 'Sold out' });
  if (featured) activeFilters.push({ key: 'featured', label: 'Featured' });
  if (sale) activeFilters.push({ key: 'sale', label: 'On sale' });

  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      if (category !== 'all' && product.category !== category) return false;
      if (search) {
        const haystack = `${product.name} ${product.description || ''} ${product.category} ${(product.tags || []).join(' ')}`.toLowerCase();
        if (!haystack.includes(search.trim().toLowerCase())) return false;
      }
      if (priceMin != null && product.price < priceMin) return false;
      if (priceMax != null && product.price > priceMax) return false;
      if (availability === 'in-stock' && (product.stock == null || product.stock <= 0)) return false;
      if (availability === 'sold-out' && product.stock !== 0) return false;
      if (featured && !product.featured) return false;
      if (sale && !product.salePrice) return false;
      return true;
    });
    return [...filtered].sort((a, b) => {
      if (sort === 'price-low') return Number(a.price || 0) - Number(b.price || 0);
      if (sort === 'price-high') return Number(b.price || 0) - Number(a.price || 0);
      if (sort === 'featured') return Number(b.featured) - Number(a.featured) || b.createdAtValue - a.createdAtValue;
      return b.createdAtValue - a.createdAtValue;
    });
  }, [category, products, search, sort, priceMin, priceMax, availability, featured, sale]);

  function setFilter(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value === '' || value == null) next.delete(key);
    else next.set(key, value);
    setSearchParams(next);
  }

  function clearFilter(key) {
    const next = new URLSearchParams(searchParams);
    next.delete(key);
    setSearchParams(next);
  }

  function clearAllFilters() {
    setSearchParams({});
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

        {activeFilters.length > 0 && (
          <div className="filter-bar">
            <div className="filter-chips">
              {activeFilters.map((filter) => (
                <span className="filter-chip" key={filter.key}>
                  {filter.label}
                  <button onClick={() => clearFilter(filter.key)} type="button" aria-label={`Remove ${filter.label} filter`}>×</button>
                </span>
              ))}
            </div>
            <span className="filter-count">Showing {visibleProducts.length} of {products.length}</span>
            <button className="clear-all" onClick={clearAllFilters} type="button">Clear all ×</button>
          </div>
        )}

        <div className="catalog-toolbar catalog-toolbar--desktop">
          <div className="category-tabs" aria-label="Product categories">
            {categories.map((item) => (
              <button className={category === item.value ? 'category-tab active' : 'category-tab'} key={item.value} onClick={() => setFilter('category', item.value)} type="button">{item.label}</button>
            ))}
          </div>
          <div className="catalog-controls">
            <label className="search-field">
              <span className="sr-only">Search products</span>
              <input value={search} onChange={(event) => setFilter('search', event.target.value)} placeholder="Search the edit" type="search" />
              <span>⌕</span>
            </label>
            <label className="sort-field">
              <span className="sr-only">Sort products</span>
              <select value={sort} onChange={(event) => setFilter('sort', event.target.value)}>
                <option value="featured">Featured</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
              </select>
            </label>
            <label className="price-range">
              <span className="sr-only">Price range</span>
              <input name="priceMin" value={priceMinRaw} onChange={(event) => setFilter('priceMin', event.target.value)} placeholder="Min" type="number" />
              <span>–</span>
              <input name="priceMax" value={priceMaxRaw} onChange={(event) => setFilter('priceMax', event.target.value)} placeholder="Max" type="number" />
            </label>
          </div>
          <button className="mobile-filter-toggle" onClick={() => setDrawerOpen(true)} type="button">Filters</button>
        </div>

        <button className="mobile-filter-toggle mobile-filter-toggle--mobile" onClick={() => setDrawerOpen(true)} type="button">
          {activeFilters.length > 0 ? `Filters (${activeFilters.length})` : 'Filters'}
        </button>

        {drawerOpen && (
          <div className="filter-drawer-overlay" onClick={() => setDrawerOpen(false)}>
            <div className="filter-drawer-panel" onClick={(event) => event.stopPropagation()}>
              <button className="filter-drawer-close" onClick={() => setDrawerOpen(false)} type="button">✕</button>
              <div className="filter-section">
                <h3>Category</h3>
                {categories.map((item) => (
                  <label className="filter-option" key={item.value}>
                    <input type="radio" name="category" checked={category === item.value} onChange={() => setFilter('category', item.value)} />
                    {item.label}
                  </label>
                ))}
              </div>
              <div className="filter-section">
                <label className="search-field">
                  <span className="sr-only">Search products</span>
                  <input value={search} onChange={(event) => setFilter('search', event.target.value)} placeholder="Search the edit" type="search" />
                </label>
                <label className="sort-field">
                  <span className="sr-only">Sort products</span>
                  <select value={sort} onChange={(event) => setFilter('sort', event.target.value)}>
                    <option value="featured">Featured</option>
                    <option value="price-low">Price: low to high</option>
                    <option value="price-high">Price: high to low</option>
                  </select>
                </label>
              </div>
              <div className="filter-section">
                <h3>Price range</h3>
                <div className="price-range">
                  <input name="priceMin" value={priceMinRaw} onChange={(event) => setFilter('priceMin', event.target.value)} placeholder="Min" type="number" />
                  <span>–</span>
                  <input name="priceMax" value={priceMaxRaw} onChange={(event) => setFilter('priceMax', event.target.value)} placeholder="Max" type="number" />
                </div>
              </div>
              <div className="filter-section">
                <h3>Availability</h3>
                <label className="filter-option"><input type="radio" name="availability" checked={availability === ''} onChange={() => setFilter('availability', '')} /> All</label>
                <label className="filter-option"><input type="radio" name="availability" checked={availability === 'in-stock'} onChange={() => setFilter('availability', 'in-stock')} /> In stock</label>
                <label className="filter-option"><input type="radio" name="availability" checked={availability === 'sold-out'} onChange={() => setFilter('availability', 'sold-out')} /> Sold out</label>
              </div>
              <div className="filter-section">
                <label className="filter-option">
                  <input type="checkbox" checked={featured === 'true'} onChange={() => setFilter('featured', featured ? '' : 'true')} /> Featured
                </label>
                <label className="filter-option">
                  <input type="checkbox" checked={sale === 'true'} onChange={() => setFilter('sale', sale ? '' : 'true')} /> On sale
                </label>
              </div>
              <div className="filter-drawer-actions">
                <button className="outline-button" onClick={clearAllFilters} type="button">Clear all</button>
                <button className="solid-button" onClick={() => setDrawerOpen(false)} type="button">Show results</button>
              </div>
            </div>
          </div>
        )}

        {status === 'loading' && <div className="product-grid"><div className="skeleton-card" /><div className="skeleton-card" /><div className="skeleton-card" /></div>}
        {status === 'loading' && <div className="product-grid"><div className="skeleton-card" /><div className="skeleton-card" /><div className="skeleton-card" /></div>}
        {status === 'error' && <StatusMessage action={<button className="outline-button" onClick={loadProducts} type="button">Try again</button>} description="We couldn't load the collection right now. Check your connection and try again." title="Something went quiet" />}
        {status === 'ready' && visibleProducts.length === 0 && <StatusMessage action={<button className="outline-button" onClick={clearAllFilters} type="button">Clear filters</button>} description="Try another search or browse a different category." title="No pieces found" />}
        {status === 'ready' && visibleProducts.length > 0 && <div className="product-grid">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div>}
      </section>
    </div>
  );
}
