import { useState, useEffect } from "react";
import { cn } from "../lib/utils";

export type ToastType = "success" | "error" | "info";

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const show = (message: string, type: ToastType = "success") => {
    setToast({ message, type });
  };

  return { toast, show, setToast };
}

export function Toast({ message, type, onClose }: { message: string; type: ToastType; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-2">
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg",
          type === "success" && "bg-green-600 text-white",
          type === "error" && "bg-red-600 text-white",
          type === "info" && "bg-blue-600 text-white",
        )}
      >
        {type === "success" && "✓"}
        {type === "error" && "✗"}
        {type === "info" && "ℹ"}
        {message}
      </div>
    </div>
  );
}
