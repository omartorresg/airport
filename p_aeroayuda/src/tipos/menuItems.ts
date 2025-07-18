export interface SubMenuItem {
  label: string;
  path: string;
}

export interface MenuItem {
  label: string;
  icon: string;
  path?: string;
  subItems?: SubMenuItem[];
}

// Esto es necesario si no estás importando nada más:
export {};