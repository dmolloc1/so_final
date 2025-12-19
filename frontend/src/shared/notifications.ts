import { toast } from "react-hot-toast";

const baseStyle = {
  borderRadius: "14px",
  padding: "18px 22px",
  fontSize: "16px",
  fontWeight: 500,
  maxWidth: "520px",
  textAlign: "center" as const,
  boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
};

export const notifySuccess = (message: string) =>
  toast.success(message, {
    position: "top-center",
    duration: 3000,
    style: {
      ...baseStyle,
      background: "#ECFDF5",
      color: "#065F46",
    },
  });

export const notifyError = (message: string) =>
  toast.error(message, {
    position: "top-center",
    duration: 3500,
    style: {
      ...baseStyle,
      background: "#FEF2F2",
      color: "#991B1B",
    },
  });

export const notifyWarning = (message: string) =>
  toast(message, {
    position: "top-center",
    duration: 3200,
    icon: "⚠️",
    style: {
      ...baseStyle,
      background: "#FFFBEB",
      color: "#92400E",
    },
  });