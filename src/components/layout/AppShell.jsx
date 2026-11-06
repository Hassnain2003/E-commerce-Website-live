import { NavLink, Outlet } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

const navigation = [
  { label: 'Shop', to: '/' },
  { label: 'Cart', to: '/cart' },
  { label: 'Orders', to: '/orders' },
];

export function AppShell() {
  const { itemCount } = useCart();

  return (
    <div className="app-shell">
      <div className="announcement-bar">
        <span>New season, considered essentials.</span>
        <span className="announcement-detail">Free delivery on orders over PKR 20,000</span>
      </div>
      <header className="site-header">
        <NavLink className="brand" to="/" aria-label="D&Z Cartique home">
          <span className="brand-mark">D<span>&</span>Z</span>
          <span className="brand-name">CARTIQUE</span>
        </NavLink>
        <nav className="site-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <NavLink
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              end={item.to === '/'}
              key={item.to}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
          <NavLink
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            to="/login"
          >
            Account
          </NavLink>
        </nav>
        <div className="header-actions">
          <button className="icon-button" type="button" aria-label="Search">
            <span aria-hidden="true">⌕</span>
          </button>
          <NavLink className="bag-button" to="/cart" aria-label="Shopping bag">
            <span aria-hidden="true">Bag</span>
            <span className="bag-count">{itemCount}</span>
          </NavLink>
        </div>
      </header>
      <main className="page-content">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="footer-brand">
          <span className="brand-mark small">D<span>&</span>Z</span>
          <span>© {new Date().getFullYear()} D&Z Cartique</span>
        </div>
        <div className="footer-links">
          <a href="mailto:hello@dzcartique.com">Contact</a>
          <a href="/">Instagram</a>
          <a href="/">Journal</a>
        </div>
      </footer>
    </div>
  );
}
