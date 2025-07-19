import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import Dashboard from "../paginas/Dashboard";
import Quejas from "../paginas/Quejas";
import React from 'react';
import ControlSeguridad from "../paginas/ControlSeguridad"



export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<ControlSeguridad />} />
          <Route path="quejas" element={<Quejas />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
