// rutas/AppRoutes.tsx
import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import ControlSeguridad from "../paginas/ControlSeguridad";
import Quejas from "../paginas/FormQuejas";
import CheckIn from "../paginas/Checkin";
import Login from "../paginas/Login";
import GestionHorarios from "../paginas/GestionHorarios";
import InspeccionEquipaje from "../paginas/InspeccionEquipaje";
import Tablero from "../paginas/Tablero";
import Protocolo from "../paginas/Protocolo";
import RegistroPersonal from "../paginas/RegistroPersonal";
import Comunicacion from "../paginas/Comunicacion";
import AsignacionRoles from "../paginas/AsignacionRoles";
import EvacuaFlujo from "../paginas/EvacuaFlujo";
import Bitacora from "../paginas/Bitacora";
import ClasificacionRegistro from "../paginas/ClasificacionRegistro";
import React from "react";
import ReporteQuejas from "../paginas/ReporteQuejas"; 
import RegistroMaleta from "../paginas/RegistroMaleta";
import AsignarAsiento from "../paginas/AsignacionAsiento";
import GeneracionPase from "../paginas/GeneracionPaseAbordaje"
import PanelQuejas from "../paginas/PanelPrioridadQuejas"
import DisponibilidadPersonal from "../paginas/DisponibilidadPersonal"
import { useLocation } from "react-router-dom";
import GestionEquipaje from "../paginas/GestionEquipaje";


// 👇 Wrapper que lee idPersona e idTicket desde location.state
function GestionEquipajeRoute() {
  const location = useLocation() as { state?: { idPersona?: number; idTicket?: number } };
  const idPersona = location.state?.idPersona;
  const idTicket  = location.state?.idTicket;

  if (!idPersona || !idTicket) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Gestión de Equipaje</h2>
        <p>Faltan parámetros: <b>idPersona</b> y/o <b>idTicket</b>.</p>
        <p>Navega desde Check-In o pasa estos parámetros al ir a esta ruta.</p>
      </div>
    );
  }
  return <GestionEquipaje idPersona={idPersona} idTicket={idTicket} />;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* RUTA SIN LAYOUT: LOGIN */}



 <Route index element={<Login />} />
      {/* RUTAS CON LAYOUT */}
      <Route path="/" element={<DashboardLayout />}>
        <Route path="/paginas/ControlSeguridad" element={<ControlSeguridad />} />
       
        <Route path="/paginas/Tablero" element={<Tablero />} />
        
        <Route path="/paginas/Quejas" element={<Quejas />} />
        <Route path="/paginas/InspeccionEquipaje" element={<InspeccionEquipaje />} />
        <Route path="/paginas/EvacuaFlujo" element={<EvacuaFlujo />} />
        <Route path="/paginas/Checkin" element={<CheckIn />} />
        <Route path="/paginas/RegistroPersonal" element={<RegistroPersonal />} />
        <Route path="/paginas/AsignacionRoles" element={<AsignacionRoles />} />
        <Route path="paginas/ClasificacionRegistro" element={<ClasificacionRegistro />} />
        <Route path="paginas/Protocolo" element={<Protocolo />} />
        <Route path="paginas/GestionHorarios" element={<GestionHorarios />} />
        <Route path="paginas/Bitacora" element={<Bitacora />} />
        <Route path="paginas/Comunicacion" element={<Comunicacion />} />
        <Route path="/quejas/ReporteQuejas" element={<ReporteQuejas />} />
        <Route path="/paginas/RegistroMaleta" element={<RegistroMaleta />} />
        <Route path="/paginas/AsignacionAsiento" element={<AsignarAsiento />} />
        <Route path="/paginas/GeneracionPaseAbordaje" element={<GeneracionPase />} />
        <Route path="/paginas/PanelPrioridadQuejas" element={<PanelQuejas />} />
        <Route path="/paginas/DisponibilidadPersonal" element={<DisponibilidadPersonal />} />
        <Route path="/paginas/GestionEquipaje" element={<GestionEquipajeRoute />} />
        
      </Route>
    </Routes>
  );
}