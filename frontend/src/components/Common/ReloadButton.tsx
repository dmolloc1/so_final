import { RefreshCw } from "lucide-react";

interface ReloadButtonProps {
  onClick: () => void;
  loading?: boolean;
  title?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

export default function ReloadButton({
  onClick,
  loading = false,
  title = "Recargar",
  children = "Recargar",
  
}: ReloadButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      title={title}
      className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
    >
      <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
      {children}
    </button>
  );
}