import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const { pathname } = useLocation();
  return (
    <header className="header">
      <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
        <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
        WanderWise
      </Link>
      <nav>
        <Link to="/" className={pathname === '/' ? 'active' : ''}>Discover</Link>
        <Link to="/explore" className={pathname === '/explore' ? 'active' : ''}>Map</Link>
        <Link to="/plan" className={pathname === '/plan' ? 'active' : ''}>Plan Trip</Link>
      </nav>
    </header>
  );
}
