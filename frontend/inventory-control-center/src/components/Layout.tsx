import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="layout">
      <header className="header">
        <h1>Inventory Control Center</h1>
        <nav className="nav">
          <NavLink to="/" end>Stock</NavLink>
          <NavLink to="/movements">Movements</NavLink>
          <NavLink to="/adjust">Adjust Stock</NavLink>
        </nav>
      </header>
      <main className="main">{children}</main>
    </div>
  );
}
