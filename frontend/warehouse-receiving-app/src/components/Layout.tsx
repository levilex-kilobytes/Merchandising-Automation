import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { Warehouse, ClipboardList } from "lucide-react";
const NAV = [{ to: "/", label: "GRNs", icon: ClipboardList }];
export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="layout">
      <header className="header">
        <div className="brand">
          <Warehouse className="brand-icon" size={26} />
          <div>
            <div className="brand-title">Receiving</div>
            <div className="brand-sub">Inbound Goods</div>
          </div>
        </div>
        <nav className="nav">
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
