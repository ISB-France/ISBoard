import { AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";

interface ErrorScreenProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorScreen({ message = "Une erreur est survenue", onRetry }: ErrorScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FDFAF5]">
      <AlertTriangle className="mb-4 h-12 w-12 text-isb-coral" />
      <h2 className="mb-2 font-display text-xl font-semibold">Erreur</h2>
      <p className="mb-6 text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Réessayer
        </Button>
      )}
    </div>
  );
}
