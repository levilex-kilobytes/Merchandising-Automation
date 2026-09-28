import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="layout">
      <header className="header">
        <h1>Warehouse Receiving</h1>
        <nav className="nav">
          <NavLink to="/" end>GRNs</NavLink>
          <NavLink to="/receive">Receive Delivery</NavLink>
        </nav>
      </header>
      <main className="main">{children}</main>
    </div>
  );
}
