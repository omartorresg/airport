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

export const menuItems: MenuItem[] = [
  { label: "Aduanas", icon: aduanasIcon, path: "/aduanas" },
  { label: "Check-In", icon: checkinIcon, path: "/checkin" },
  {
    label: "Embarque",
    icon: embarqueIcon,
    subItems: [
      { label: "Puertas", path: "/embarque/puertas" },
      { label: "Salidas", path: "/embarque/salidas" },
    ],
  },
  { label: "Emergencia", icon: emergenciaIcon, path: "/emergencia" },
  { label: "Gestión Personal", icon: gestionPersonalIcon, path: "/gestion" },
  { label: "Notificaciones", icon: notificacionIcon, path: "/notificaciones" },
  { label: "Quejas", icon: quejasIcon, path: "/quejas" },
  { label: "Seguridad", icon: securityIcon, path: "/seguridad" },
];