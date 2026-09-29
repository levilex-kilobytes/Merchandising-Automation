import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { ShoppingCart, Receipt, RotateCcw, Tag } from 'lucide-react';

const NAV = [
  { to: '/', label: 'Terminal', icon: ShoppingCart },
  { to: '/sales', label: 'Sales', icon: Receipt },
  { to: '/returns', label: 'Returns', icon: RotateCcw },
  { to: '/prices', label: 'Prices', icon: Tag },
];

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="layout">
      <header className="header">
        <div className="brand">
          <ShoppingCart className="brand-icon" size={26} />
          <div>
            <div className="brand-title">POS Terminal</div>
            <div className="brand-sub"> Retail Sales</div>
          </div>
        </div>
        <nav className="nav" aria-label="Primary">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => isActive ? 'active' : ''}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="main">{children}</main>
    </div>
  );
}
