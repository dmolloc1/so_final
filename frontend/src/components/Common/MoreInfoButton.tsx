import { useState } from "react";

interface MoreInfoButtonProps {
  onView?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
}

export default function MoreInfoButton({
  onView,
  onDelete,
  disabled = false,
}: MoreInfoButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="text-gray-500 hover:text-gray-700 text-xl px-2 py-1 rounded-full transition-colors disabled:opacity-50"
        aria-label="Más opciones"
      >
        ⋯
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-24 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <button
            onClick={onView}
            className="block w-full text-sm text-gray-700 hover:bg-gray-100 px-3 py-1 text-left"
          >
            Ver
          </button>
          <button
            onClick={onDelete}
            className="block w-full text-sm text-red-600 hover:bg-red-100 px-3 py-1 text-left"
          >
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}