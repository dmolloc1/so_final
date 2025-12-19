//Aumentar 
// //import {  Plus } from 'lucide-react';

interface CommonButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}

export default function AddButton({
  children,
  onClick,
  type = "button",
  disabled = false,
}: CommonButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
    >
      {children}
    </button>
  );
}
//Pon <Plus className="w-5 h-5" /> icono