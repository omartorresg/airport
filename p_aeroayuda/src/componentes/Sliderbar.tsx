import React, { useState } from 'react';
import './Sidebar.css';

interface MenuItem {
  title: string;
  icon: string;
  subItems?: string[];
}

const menuItems: MenuItem[] = [
  { title: 'Home', icon: 'ai-home-alt1' },
  { title: 'Dashboard', icon: 'ai-dashboard' },
  {
    title: 'Settings',
    icon: 'ai-gear',
    subItems: ['Display', 'Appearance', 'Preferences']
  },
  {
    title: 'Create',
    icon: 'ai-folder-add',
    subItems: ['Article', 'Document', 'Video', 'Presentation']
  },
  {
    title: 'Profile',
    icon: 'ai-person',
    subItems: ['Avatar', 'Theme']
  },
  { title: 'Notifications', icon: 'ai-bell' },
  { title: 'Products', icon: 'ai-cart' },
  { title: 'Account', icon: 'ai-lock-on' }
];

const Sidebar: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleSubMenu = (index: number) => {
    setActiveIndex(prev => (prev === index ? null : index));
  };

  return (
    <aside className="sidebar">
      <header>
        <button type="button" className="sidebar-burger">
          <i className="ai-three-line-horizontal"></i>
        </button>
        <img src="/logo.svg" alt="Logo" />
      </header>

      <ul>
        {menuItems.map((item, index) => (
          <li key={item.title}>
            <button
              className={activeIndex === index ? 'active' : ''}
              onClick={() => item.subItems ? toggleSubMenu(index) : null}
            >
              <i className={item.icon}></i>
              <p>{item.title}</p>
              {item.subItems && <i className="ai-chevron-down-small"></i>}
            </button>

            {item.subItems && (
              <div
                className="sub-menu"
                style={{
                  height: activeIndex === index ? `${item.subItems.length * 40}px` : '0px'
                }}
              >
                <ul>
                  {item.subItems.map(sub => (
                    <li key={sub}>
                      <button type="button">{sub}</button>
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
};

export default Sidebar;