import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="layout">
      <header className="header">
        <h1>Procurement Dashboard</h1>
        <nav className="nav">
          <NavLink to="/" end>Purchase Orders</NavLink>
          <NavLink to="/approvals">Approval Queue</NavLink>
          <NavLink to="/purchase-orders/new">New PO</NavLink>
        </nav>
      </header>
      <main className="main">{children}</main>
    </div>
  );
}
