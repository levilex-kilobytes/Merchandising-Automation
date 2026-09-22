import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="layout">
      <header className="header">
        <h1>Vendor Management</h1>
        <nav className="nav">
          <NavLink to="/" end>Suppliers</NavLink>
          <NavLink to="/suppliers/new">New Supplier</NavLink>
        </nav>
      </header>
      <main className="main">{children}</main>
    </div>
  );
}
