import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Package, Activity, MapPin, AlertTriangle, BarChart3 } from 'lucide-react';

const NAV = [
  { to: '/', label: 'Stock', icon: Package },
  { to: '/movements', label: 'Movements', icon: Activity },
  { to: '/locations', label: 'Locations', icon: MapPin },
  { to: '/low-stock', label: 'Low Stock', icon: AlertTriangle },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="layout">
      <header className="header">
        <div className="brand">
          <Package className="brand-icon" size={26} />
          <div>
            <div className="brand-title">Inventory Control</div>
            <div className="brand-sub">Stock Control</div>
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
