import { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Boxes, ShoppingCart, Truck, Search, Grid3x3, WifiOff } from "lucide-react";
import { useOnline } from "../hooks/useOnline";

const NAV = [
  { to: "/", label: "Putaway", icon: Boxes },
  { to: "/pick", label: "Picking", icon: ShoppingCart },
  { to: "/transfers", label: "Transfers", icon: Truck },
  { to: "/lookup", label: "Lookup", icon: Search },
  { to: "/zones", label: "Space", icon: Grid3x3 },
];

export function Layout({ children }: { children: ReactNode }) {
  const online = useOnline();
  const { pathname } = useLocation();
  const isFlow =
    pathname.startsWith("/putaway/") ||
    pathname.startsWith("/pick/") ||
    pathname === "/transfers/new";

  return (
    <div className="layout">
      <header className="header">
        <div className="brand">
          <Boxes className="brand-icon" size={26} />
          <div>
            <div className="brand-title">Warehouse Floor</div>
            <div className="brand-sub"> Warehouse Operations</div>
          </div>
        </div>

        <nav className="nav nav-desktop" aria-label="Primary">
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

        <div className="header-status">
          {!online && (
            <span className="offline-pill" title="You are offline">
              <WifiOff size={14} /> Offline
            </span>
          )}
        </div>
      </header>

      <main className="main">{children}</main>

      {!isFlow && (
        <nav className="bottomnav bottomnav-5" aria-label="Primary mobile">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <Icon size={22} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
