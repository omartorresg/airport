// rutas/AppRoutes.tsx
import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import Dashboard from "../paginas/Dashboard";
import ControlSeguridad from "../paginas/ControlSeguridad";
import Quejas from "../paginas/Quejas";
import CheckIn from "../paginas/Checkin";
import Login from "../paginas/Login";
import ClasificacionRegistro from "../paginas/ClasificacionRegistro";
import React from "react";

export default function AppRoutes() {
  return (
    <Routes>
      {/* RUTA SIN LAYOUT: LOGIN */}
      <Route index element={<Login />} />

      {/* RUTAS CON LAYOUT */}
      <Route path="/" element={<DashboardLayout />}>
        <Route path="/paginas/ControlSeguridad" element={<ControlSeguridad />} />
        <Route path="/paginas/Quejas" element={<Quejas />} />
        <Route path="/paginas/Checkin" element={<CheckIn />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="paginas/ClasificacionRegistro" element={<ClasificacionRegistro />} />
      </Route>
    </Routes>
  );
}