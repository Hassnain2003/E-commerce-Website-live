import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { ProfileMenu } from './ProfileMenu';

const navigation = [
  { label: 'Shop', to: '/' },
  { label: 'Cart', to: '/cart' },
  { label: 'Orders', to: '/orders' },
];

export function AppShell() {
  const { itemCount } = useCart();
  const { user, profile } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const displayName = profile?.name || user?.email?.split('@')[0] || 'Account';

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (!profileRef.current?.contains(event.target)) setProfileOpen(false);
    }
    function closeOnEscape(event) {
      if (event.key === 'Escape') setProfileOpen(false);
    }
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  return (
    <div className="app-shell">
      <div className="announcement-bar"><span>New season, considered essentials.</span><span className="announcement-detail">Free delivery on orders over PKR 20,000</span></div>
      <header className="site-header">
        <NavLink className="brand" to="/" aria-label="D&Z Cartique home"><span className="brand-mark">D<span>&</span>Z</span><span className="brand-name">CARTIQUE</span></NavLink>
        <nav className="site-nav" aria-label="Main navigation">
          {navigation.map((item) => <NavLink className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')} end={item.to === '/'} key={item.to} to={item.to}>{item.label}</NavLink>)}
          {!user && <NavLink className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')} to="/login">Account</NavLink>}
        </nav>
        <div className="header-actions">
          <button className="icon-button" type="button" aria-label="Search"><span aria-hidden="true">⌕</span></button>
          <NavLink className="bag-button" to="/cart" aria-label="Shopping bag"><span aria-hidden="true">Bag</span><span className="bag-count">{itemCount}</span></NavLink>
          {user && <div className="profile-control" ref={profileRef}>
            <button aria-expanded={profileOpen} aria-haspopup="menu" className="profile-trigger" onClick={() => setProfileOpen((open) => !open)} type="button">
              <span className="profile-avatar small">{displayName.charAt(0).toUpperCase()}</span>
              <span className="profile-trigger-name">{displayName}</span>
            </button>
            {profileOpen && <ProfileMenu onClose={() => setProfileOpen(false)} />}
          </div>}
        </div>
      </header>
      <main className="page-content"><Outlet /></main>
      <footer className="site-footer"><div className="footer-brand"><span className="brand-mark small">D<span>&</span>Z</span><span>© {new Date().getFullYear()} D&Z Cartique</span></div><div className="footer-links"><a href="mailto:hello@dzcartique.com">Contact</a><a href="/">Instagram</a><a href="/">Journal</a></div></footer>
    </div>
  );
}
