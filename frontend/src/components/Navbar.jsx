import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const nav = useNavigate();

  const handleLogout = () => { logout(); nav('/login'); };

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link to="/dashboard" className="nav-logo">📈 StockMonitor</Link>
        <div className="nav-right">
          <Link
            to="/dashboard"
            className="tab"
            style={{ borderBottom: pathname === '/dashboard' ? '2px solid #111' : '2px solid transparent', padding: '0 4px', marginBottom: 0, height: 52, display: 'flex', alignItems: 'center' }}>
            Dashboard
          </Link>
          <Link
            to="/profile"
            className="tab"
            style={{ borderBottom: pathname === '/profile' ? '2px solid #111' : '2px solid transparent', padding: '0 4px', marginBottom: 0, height: 52, display: 'flex', alignItems: 'center' }}>
            Profile
          </Link>
          <span className="nav-user">{user?.name}</span>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </nav>
  );
}
