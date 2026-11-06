import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export function ProfileMenu({ onClose }) {
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const name = profile?.name || user?.email?.split('@')[0] || 'Account';

  async function handleSignOut() {
    await signOut();
    onClose();
  }

  return (
    <div className="profile-menu" role="menu">
      <div className="profile-menu-heading">
        <span className="profile-avatar">{name.charAt(0).toUpperCase()}</span>
        <div><strong>{name}</strong><span>{user?.email}</span></div>
      </div>
      <div className="profile-menu-details">
        <span>{profile?.address || 'Add your delivery address'}</span>
      </div>
      <Link onClick={onClose} role="menuitem" to="/profile">Profile settings <span>↗</span></Link>
      <Link onClick={onClose} role="menuitem" to="/orders">Order history <span>↗</span></Link>
      <button onClick={toggleTheme} role="menuitem" type="button">
        {theme === 'dark' ? 'Use light theme' : 'Use dark theme'} <span>{theme === 'dark' ? '☼' : '◐'}</span>
      </button>
      <button className="profile-logout" onClick={handleSignOut} role="menuitem" type="button">Sign out <span>↗</span></button>
    </div>
  );
}
