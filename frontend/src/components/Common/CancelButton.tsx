interface CancelButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function CancelButton({ onClick, disabled = false }: CancelButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
    >
      Cancelar
    </button>
    // Agregar este icono dentro <Trash2 className="w-4 h-4" />
  );
}