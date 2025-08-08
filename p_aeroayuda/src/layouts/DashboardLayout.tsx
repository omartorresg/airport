import { Outlet } from "react-router-dom";
import "../styles/Layout.css";
import Sidebar from "../componentes/Sidebar";
import "../styles/Sidebar.css";
import IconoAlerta from "../componentes/userIcon";

import "../styles/userIcon.css";
import { UserIcon } from "lucide-react";

export default function DashboardLayout() {
  return (
    <div className="layout-container">
      <Sidebar />
      <IconoAlerta /> {/* ✅ Icono en la esquina */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
