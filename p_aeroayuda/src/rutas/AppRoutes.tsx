import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import Dashboard from "../paginas/Dashboard";
import React from 'react';
import ControlSeguridad from "../paginas/ControlSeguridad"
import Quejas from "../paginas/Quejas";
import CheckIn from "../paginas/Checkin";




export default function AppRoutes() {
  return (
      <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route path="quejas" element={<Quejas />} />
        <Route path="seguridad" element={<ControlSeguridad />} />
        <Route path="checkin" element={<CheckIn />} />
        </Route>
      </Routes>
  );
}

