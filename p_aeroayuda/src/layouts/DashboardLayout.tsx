import { Outlet } from "react-router-dom";
import "../styles/Layout.css";
import Sidebar from "../componentes/Sidebar";
import "../styles/Sidebar.css";
import userIcon from "../componentes/userIcon";
import "../styles/userIcon.css";

export default function DashboardLayout() {
  return (
    <div className="layout-container">
      {/* Sidebar dinámico */}
      <Sidebar />

      {/* Contenido principal (cambia según la ruta) */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}