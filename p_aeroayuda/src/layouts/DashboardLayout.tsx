import { Outlet, Link } from "react-router-dom";
import "../styles/Layout.css";

export default function DashboardLayout() {
  return (
    <div className="layout-container">
      <aside className="sidebar">
        <h2>🛫 Panel</h2>
        <nav>
          <Link to="/">🏠 Inicio</Link>
          <Link to="/quejas">📣 Quejas</Link>
          <Link to="/personal">👨‍✈️ Personal</Link>
        </nav>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
