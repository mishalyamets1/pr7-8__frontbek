import { Link, Outlet } from 'react-router-dom';

export default function Layout({ user, onLogout }) {
  return (
    <>
      <nav className="navbar">
        <div className="nav-links">
          <Link to="/products">Товары</Link>
          {user.role === 'admin' && <Link to="/users">Пользователи</Link>}
        </div>
        <div className="nav-user">
          <span>{user.username} ({user.role})</span>
          <button className="btn btn-sm btn-secondary" onClick={onLogout}>Выйти</button>
        </div>
      </nav>
      <div className="container">
        <Outlet />
      </div>
    </>
  );
}
