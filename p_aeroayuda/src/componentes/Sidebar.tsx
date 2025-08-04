import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "../styles/Sidebar.css";
import logo from "../assets/logo1.svg";
import { menuItems } from "../data/menuItems";
import { MenuItem, SubMenuItem } from "../tipos/menuItems";

export default function Sidebar() {
  const [active, setActive] = useState<string | null>(null);
  const navigate = useNavigate(); // <-- necesario para navegar programáticamente

  const toggle = (label: string, hasSubMenu: boolean, path?: string) => {
    if (hasSubMenu) {
      setActive(active === label ? null : label);
    } else if (path) {
      navigate(path); // <-- navegación directa si no tiene subitems
    }
  };

  return (
    <aside className="sidebar">
      <header>
        <img src={logo} alt="Logo" className="sidebar-logo" />
      </header>
      <div className="opciones">
        <ul>
          {menuItems.map((item: MenuItem) => (
            <li key={item.label}>
              <button
                type="button"
                onClick={() => toggle(item.label, !!item.subItems, item.path)}
                className={active === item.label ? "active" : ""}
              >
                <img src={item.icon} alt={item.label} className="menu-icon" />
                <p>{item.label}</p>
                {item.subItems && <span className="arrow">▼</span>}
              </button>

              {item.subItems && (
                <div className={`sub-menu ${active === item.label ? "abierto" : ""}`}>
                  <ul>
                    {item.subItems.map((sub: SubMenuItem) => (
                      <li key={sub.label}>
                        <NavLink to={sub.path}>{sub.label}</NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
