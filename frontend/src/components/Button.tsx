// src/components/ui/button.tsx
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const Button: React.FC<ButtonProps> = ({ children, className, ...props }) => {
  return (
    <button
      className={`bg-black text-white rounded-md px-4 py-2 hover:bg-gray-800 transition ${className ?? ""}`}
      {...props}
    >
      {children}
    </button>
  );
};
