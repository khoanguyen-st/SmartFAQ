import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";

const navItems = [
  { path: "dashboard", label: "Dashboard" },
  { path: "logs", label: "Logs" },
  { path: "settings", label: "Settings" },
];

const ShellLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="admin-shell">
      <aside className="admin-shell__sidebar">
        <div className="admin-shell__logo">SmartFAQ Admin</div>
        <nav className="admin-shell__nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `admin-shell__nav-link${isActive ? " admin-shell__nav-link--active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="admin-shell__content">
        <header className="admin-shell__header">
          <h1>Greenwich SmartFAQ</h1>
          <span>Version {__APP_VERSION__}</span>
        </header>
        <div className="admin-shell__body">{children}</div>
      </main>
    </div>
  );
};

export default ShellLayout;
