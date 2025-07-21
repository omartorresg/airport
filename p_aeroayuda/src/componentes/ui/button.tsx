import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const Button: React.FC<ButtonProps> = ({ children, ...props }) => {
  return (
    <button
      {...props}
      className={`bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600 ${props.className || ""}`}
    >
      {children}
    </button>
  );
};
