import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import {
  ClipboardCheck,
  LayoutDashboard,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

const NAV = [
  { to: "/", label: "Sessions", icon: LayoutDashboard },
  { to: "/reconcile", label: "Reconcile", icon: ClipboardCheck },
  { to: "/discrepancies", label: "Discrepancies", icon: AlertTriangle },
  { to: "/analytics", label: "Analytics", icon: TrendingUp },
];

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="layout">
      <header className="header">
        <div className="brand">
          <ClipboardCheck className="brand-icon" size={26} />
          <div>
            <div className="brand-title">Store Manager</div>
            <div className="brand-sub">Sales Audit</div>
          </div>
        </div>
        <nav className="nav" aria-label="Primary">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
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
