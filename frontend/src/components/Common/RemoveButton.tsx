interface RemoveButtonProps {
  onClick: () => void;
  children?: React.ReactNode;
  disabled?: boolean;
}

export default function RemoveButton({ onClick, children = "Eliminar", disabled = false }: RemoveButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
    >
      {children}
    </button>
  );
}