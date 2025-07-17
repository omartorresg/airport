import React, { useState } from 'react';
import '../styles/Sidebar.css';
import { MenuItem } from '../types/MenuItem';
import { FiHome, FiSettings, FiChevronDown } from 'react-icons/fi';

const menuItems: MenuItem[] = [
  { name: 'Inicio', icon: <FiHome />, path: '/' },
  {
    name: 'Configuración',
    icon: <FiSettings />,
    children: [
      { name: 'Perfil', icon: <FiChevronDown />, path: '/perfil' },
      { name: 'Seguridad', icon: <FiChevronDown />, path: '/seguridad' },
    ],
  },
];

const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleSubmenu = (index: number) => {
    setActiveIndex(index === activeIndex ? null : index);
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <button className="toggle-btn" onClick={toggleSidebar}>
        ☰
      </button>

      <ul className="menu-list">
        {menuItems.map((item, i) => (
          <li key={i}>
            <div
              className="menu-item"
              onClick={() => item.children && toggleSubmenu(i)}
            >
              <span className="icon">{item.icon}</span>
              <span className="text">{item.name}</span>
              {item.children && <span className="arrow">▼</span>}
            </div>

            {item.children && activeIndex === i && (
              <ul className="submenu">
                {item.children.map((child, j) => (
                  <li key={j} className="submenu-item">
                    <span className="icon">{child.icon}</span>
                    <span className="text">{child.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;