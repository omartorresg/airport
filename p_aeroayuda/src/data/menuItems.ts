// src/data/menuItems.ts
import { MenuItem } from "../tipos/menuItems";
import aduanasIcon from "../assets/icons/aduanas.svg";
import checkinIcon from "../assets/icons/checkin.svg";
import embarqueIcon from "../assets/icons/embarque.svg";
import emergenciaIcon from "../assets/icons/emergencia.svg";
import gestionPersonalIcon from "../assets/icons/gestionPersonal.svg";
import notificacionIcon from "../assets/icons/notificacion.svg";
import quejasIcon from "../assets/icons/quejas.svg";
import securityIcon from "../assets/icons/security.svg";
import dashboardIcon from "../assets/icons/dashboard.svg";
import Quejas from "../componentes/FormQueja";


export const menuItems: MenuItem[] = [{
    label: "Tablero Operativo",
    icon: dashboardIcon,
    path: "/paginas/Tablero",
  },
  {
    label: "Migración y Aduanas",
    icon: aduanasIcon,
    path: "/aduanas",
    subItems: [
      { label: "Verificación de Documentos", path: "/aduanas/documentos" },
      { label: "Cruce con Bases de Datos", path: "/aduanas/bases-datos" },
      { label: "Registro Migratorio", path: "/aduanas/registro" },
      { label: "Control de Equipaje", path: "/aduanas/equipaje" },
      { label: "Detección de Anomalías", path: "/aduanas/anomalias" },
      { label: "Entrevista Migratoria", path: "/aduanas/entrevista" },
      { label: "Autorización o Rechazo", path: "/aduanas/autorizacion" },
    ],
  },
  {
    label: "Check-In",
    icon: checkinIcon,
    path: "/checkin",
    subItems: [
      { label: "Verificación de Reserva", path: "/paginas/Checkin" },
      { label: "Registro de Equipaje", path: "/paginas/RegistroMaleta" },
      { label: "Registro de Equipaje2", path: "/paginas/GestionEquipaje" },
      { label: "Generación del Pase de Abordaje", path: "/paginas/GeneracionPaseAbordaje" },
      { label: "Actualización del Estado del Pasajero", path: "/checkin/estado" },
      { label: "Notificación al Sistema de Embarque", path: "/checkin/notificacion" },
    ],
  },
  {
    label: "Embarque",
    icon: embarqueIcon,
    path: "/embarque",
    subItems: [
      { label: "Verificación de Puerta y Hora", path: "/embarque/puerta-hora" },
      { label: "Escaneo de Tarjeta de Embarque", path: "/embarque/tarjeta" },
      { label: "Autenticación del Pasajero", path: "/embarque/autenticacion" },
      { label: "Control de Prioridades", path: "/embarque/prioridades" },
      { label: "Registro de Embarque", path: "/embarque/registro" },
      { label: "Último Llamado", path: "/embarque/ultimo-llamado" },
      { label: "Sincronización con Aeronave", path: "/embarque/sincronizacion" },
    ],
  },
  {
    label: "Emergencia",
    icon: emergenciaIcon,
    path: "/emergencia",
    subItems: [
      { label: "Clasificación y Registro", path: "/paginas/ClasificacionRegistro" },
      { label: "Activación de Protocolo", path: "/paginas/Protocolo" },
      { label: "Asignación de Roles", path: "/paginas/AsignacionRoles" },
      { label: "Comunicación y Coordinación", path: "/paginas/Comunicacion" },
      { label: "Evacuación y Flujo", path: "/emergencia/evacuacion" },
      { label: "Notificación a Entidades", path: "/emergencia/notificacion" },
      { label: "Bitácora y Simulacros", path: "/emergencia/bitacora" },
    ],
  },
  {
    label: "Gestión Personal",
    icon: gestionPersonalIcon,
    path: "/gestion",
    subItems: [
      { label: "Registro de Personal", path: "/paginas/RegistroPersonal" },
      { label: "Horarios y Turnos", path: "/gestion/turnos" },
      { label: "Asignación de Tareas", path: "/gestion/asignacion" },
      { label: "Capacitación y Certificación", path: "/gestion/capacitacion" },
      { label: "Evaluación de Desempeño", path: "/gestion/evaluacion" },
    ],
  },
  {
    label: "Notificaciones",
    icon: notificacionIcon,
    path: "/notificaciones",
    subItems: [
      { label: "Tipos de Notificación", path: "/notificaciones/tipos" },
      { label: "Canales de Comunicación", path: "/notificaciones/canales" },
      { label: "Personalización", path: "/notificaciones/personalizacion" },
      { label: "Eventos Disparadores", path: "/notificaciones/eventos" },
    ],
  },
  {
    label: "Quejas",
    icon: quejasIcon,
    path: "/quejas",
    subItems: [
      { label: "Creación y Asignación", path: "/paginas/Quejas" },
      { label: "Niveles de Prioridad", path: "/paginas/PanelPrioridadQuejas" },
      { label: "Disponibilidad de Personal", path: "/paginas/DisponibilidadPersonal" },
      { label: "Matriz de Escalabilidad", path: "/quejas/escalabilidad" },
      { label: "Notificación de Estatus", path: "/quejas/estatus" },
      { label: "Seguimiento y Feedback", path: "/quejas/seguimiento" },
      { label: "Reportes", path: "/quejas/ReporteQuejas" },
      { label: "Evaluación de SLAs", path: "/quejas/slas" },
    ],
  },
  {
    label: "Seguridad",
    icon: securityIcon,
    path: "/seguridad",
    subItems: [
      { label: "Verificación del Pase", path: "/paginas/ControlSeguridad" },
      { label: "Control de Acceso", path: "/seguridad/acceso" },
      { label: "Inspección Equipaje Mano", path: "/seguridad/equipaje" },
      { label: "Inspección del Pasajero", path: "/seguridad/pasajero" },
      { label: "Registro de Incidencias", path: "/seguridad/incidencias" },
      { label: "Autorización Final", path: "/seguridad/autorizacion" },
    ],
  },
];
