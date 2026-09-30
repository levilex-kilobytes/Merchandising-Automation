import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { Landmark, BookText, Receipt, FileBarChart } from "lucide-react";

const NAV = [
  { to: "/", label: "Overview", icon: Landmark, end: true },
  { to: "/ledger", label: "Ledger", icon: BookText, end: false },
  { to: "/payables", label: "Payables", icon: Receipt, end: false },
  { to: "/reports", label: "Reports", icon: FileBarChart, end: false },
];

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="layout">
      <header className="header">
        <div className="brand">
          <Landmark className="brand-icon" size={26} />
          <div>
            <div className="brand-title">Finance Portal</div>
            <div className="brand-sub"> Accounting</div>
          </div>
        </div>
        <nav className="nav" aria-label="Primary">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
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
