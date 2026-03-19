import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        Campus <span>Bridge</span>
      </Link>

      <div className="navbar-links">
        <Link to="/">Home</Link>

        {user ? (
          <>
            <span className="navbar-user">Hi, {user.name.split(' ')[0]}</span>
            <button className="btn btn-outline btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">
              <button className="btn btn-outline btn-sm">Login</button>
            </Link>
            <Link to="/register">
              <button className="btn btn-primary btn-sm">Register</button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
