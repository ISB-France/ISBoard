import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import AppLayout from "../components/AppLayout";
import LoadingScreen from "../components/LoadingScreen";
import ErrorScreen from "../components/ErrorScreen";
import api from "../api";
import type { Interview } from "../types";

const statusLabel: Record<string, string> = {
  draft: "Brouillon",
  in_progress: "En cours",
  completed: "Terminé",
  cancelled: "Annulé",
};

export default function Interviews() {
  const navigate = useNavigate();
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");

  const { data: interviews, isLoading, error, refetch } = useQuery<Interview[]>({
    queryKey: ["interviews", type, status],
    queryFn: () =>
      api.get("/interviews/", { params: { type, status } }).then((r) => r.data),
  });

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message="Impossible de charger les entretiens" onRetry={refetch} />;

  return (
    <AppLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Entretiens</h1>
        <Button onClick={() => navigate("/interviews/new")} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvel entretien
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="h-10 rounded-md border border-border bg-white px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Tous les types</option>
          <option value="annual">Annuel</option>
          <option value="professional">Professionnel</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 rounded-md border border-border bg-white px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Tous les statuts</option>
          <option value="draft">Brouillon</option>
          <option value="in_progress">En cours</option>
          <option value="completed">Terminé</option>
          <option value="cancelled">Annulé</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold uppercase text-muted-foreground">
                <th className="px-6 pb-3 pt-4">Employé</th>
                <th className="px-6 pb-3 pt-4">Type</th>
                <th className="px-6 pb-3 pt-4">Statut</th>
                <th className="px-6 pb-3 pt-4">Date limite</th>
                <th className="px-6 pb-3 pt-4">Manager</th>
                <th className="px-6 pb-3 pt-4"></th>
              </tr>
            </thead>
            <tbody>
              {interviews?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    Aucun entretien trouvé
                  </td>
                </tr>
              )}
              {interviews?.map((iv) => (
                <tr
                  key={iv.id}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(`/interviews/${iv.id}`)}
                >
                  <td className="px-6 py-3 text-sm font-medium">
                    {iv.employee_detail?.first_name} {iv.employee_detail?.last_name}
                  </td>
                  <td className="px-6 py-3">
                    <Badge variant={iv.type as "annual" | "professional"}>
                      {iv.type === "annual" ? "Annuel" : "Professionnel"}
                    </Badge>
                  </td>
                  <td className="px-6 py-3">
                    <Badge variant={iv.status as "draft" | "in_progress" | "completed" | "cancelled"}>
                      {statusLabel[iv.status]}
                    </Badge>
                  </td>
                  <td className="px-6 py-3 text-sm">{iv.due_date}</td>
                  <td className="px-6 py-3 text-sm text-muted-foreground">
                    {iv.manager_detail?.first_name} {iv.manager_detail?.last_name}
                  </td>
                  <td className="px-6 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/interviews/${iv.id}/edit`);
                      }}
                    >
                      Modifier
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
