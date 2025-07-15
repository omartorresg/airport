import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import Dashboard from "../paginas/Dashboard";
import Quejas from "../paginas/Quejas";
import React from 'react';



export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="quejas" element={<Quejas />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
