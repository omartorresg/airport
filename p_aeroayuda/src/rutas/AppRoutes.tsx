// rutas/AppRoutes.tsx
import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import Dashboard from "../paginas/Dashboard";
import ControlSeguridad from "../paginas/ControlSeguridad";
import Quejas from "../paginas/Quejas";
import CheckIn from "../paginas/Checkin";
import Login from "../paginas/Login";
import ClasificacionRegistro from "../paginas/ClasificacionRegistro"; // 👈 importar aquí
import React from "react";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<ControlSeguridad />} />
        <Route path="quejas" element={<Quejas />} />
        <Route path="checkin" element={<CheckIn />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="login" element={<Login />} />
        {/* Aquí agregamos la ruta para ClasificacionRegistro */}
        <Route path="paginas/ClasificacionRegistro" element={<ClasificacionRegistro />} />
      </Route>
    </Routes>
  );
}
