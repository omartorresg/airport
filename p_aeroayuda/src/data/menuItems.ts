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
import Quejas from "../componentes/FormQueja";


export const menuItems: MenuItem[] = [
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
      { label: "Verificación de Reserva", path: "/checkin/reserva" },
      { label: "Asignación de Asiento", path: "/checkin/asiento" },
      { label: "Registro de Equipaje", path: "/checkin/equipaje" },
      { label: "Generación del Pase de Abordaje", path: "/checkin/pase" },
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
<<<<<<< HEAD
  { label: "Emergencia", icon: emergenciaIcon, path: "/emergencia" },
  { label: "Gestión Personal", icon: gestionPersonalIcon, path: "/gestion" },
  { label: "Notificaciones", icon: notificacionIcon, path: "/notificaciones" },
  { label: "Quejas", icon: quejasIcon, path: "/quejas" },
  { label: "Seguridad", icon: securityIcon, path: "/seguridad" },
  
];
=======
  {
    label: "Emergencia",
    icon: emergenciaIcon,
    path: "/emergencia",
    subItems: [
      { label: "Clasificación y Registro", path: "/emergencia/clasificacion" },
      { label: "Activación de Protocolo", path: "/emergencia/protocolo" },
      { label: "Asignación de Roles", path: "/emergencia/roles" },
      { label: "Comunicación y Coordinación", path: "/emergencia/comunicacion" },
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
      { label: "Registro de Personal", path: "/gestion/registro" },
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
      { label: "Categorización y Asignación", path: "/quejas/categorizacion" },
      { label: "Niveles de Prioridad", path: "/quejas/prioridad" },
      { label: "Disponibilidad de Personal", path: "/quejas/disponibilidad" },
      { label: "Matriz de Escalabilidad", path: "/quejas/escalabilidad" },
      { label: "Notificación de Estatus", path: "/quejas/estatus" },
      { label: "Seguimiento y Feedback", path: "/quejas/seguimiento" },
      { label: "Digitalización de Documentos", path: "/quejas/documentos" },
      { label: "Evaluación de SLAs", path: "/quejas/slas" },
    ],
  },
  {
    label: "Seguridad",
    icon: securityIcon,
    path: "/seguridad",
    subItems: [
      { label: "Verificación del Pase", path: "/seguridad/pase" },
      { label: "Control de Acceso", path: "/seguridad/acceso" },
      { label: "Inspección Equipaje Mano", path: "/seguridad/equipaje" },
      { label: "Inspección del Pasajero", path: "/seguridad/pasajero" },
      { label: "Registro de Incidencias", path: "/seguridad/incidencias" },
      { label: "Autorización Final", path: "/seguridad/autorizacion" },
    ],
  },
];
>>>>>>> 64bf73e77df827304ed0a27639b74237cb795110
