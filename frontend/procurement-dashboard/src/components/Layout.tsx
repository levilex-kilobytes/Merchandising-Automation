import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { ShoppingBag, BarChart3 } from "lucide-react";

const NAV = [
  { to: "/", label: "Purchase Orders", icon: ShoppingBag },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="layout">
      <header className="header">
        <div className="brand">
          <ShoppingBag className="brand-icon" size={26} />
          <div>
            <div className="brand-title">Procurement</div>
            <div className="brand-sub"> Purchasing</div>
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
