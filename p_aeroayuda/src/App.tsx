// App.tsx
import React from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./rutas/AppRoutes";
import Login from "./paginas/Login";
import Dashboard from "./paginas/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
