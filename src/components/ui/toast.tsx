import { useContext } from "react";
import { useToastContext } from "@/context/ToastContext";

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}