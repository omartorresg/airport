import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import "../styles/Sidebar.css";
import logo from "../assets/logo.svg";
import { menuItems } from "../data/menuItems";
import { MenuItem, SubMenuItem } from "../tipos/menuItems"; // Asegúrate de tener este archivo

export default function Sidebar() {
  const [active, setActive] = useState<string | null>(null);

  const toggle = (label: string, hasSubMenu: boolean) => {
    setActive(active === label ? null : hasSubMenu ? label : null);
  };

  return (
    <aside className="sidebar">
      <header>
        <img src={logo} alt="Logo" className="sidebar-logo" />
        <h2>Aeropuerto</h2>
      </header>

      <ul>
        {menuItems.map((item: MenuItem) => (
          <li key={item.label}>
            <button
              type="button"
              onClick={() => toggle(item.label, !!item.subItems)}
              className={active === item.label ? "active" : ""}
            >
              <img src={item.icon} alt={item.label} className="menu-icon" />
              <p>{item.label}</p>
              {item.subItems && <span className="arrow">▼</span>}
            </button>

            {item.subItems && (
              <div
                className="sub-menu"
                style={{
                  height: active === item.label ? `${item.subItems.length * 40}px` : "0px",
                }}
              >
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
    </aside>
  );
}