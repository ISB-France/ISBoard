import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Copy } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import AppLayout from "../components/AppLayout";
import LoadingScreen from "../components/LoadingScreen";
import ErrorScreen from "../components/ErrorScreen";
import api from "../api";
import type { InterviewTemplate } from "../types";

const typeLabel: Record<string, string> = {
  annual: "Annuel",
  professional: "Professionnel",
  bilan: "Bilan",
  forfait: "Forfait jours",
  fin_carriere: "Fin de carrière",
};

export default function Templates() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: templates, isLoading, error, refetch } = useQuery<InterviewTemplate[]>({
    queryKey: ["interview-templates"],
    queryFn: () => api.get("/interview-templates/").then((r) => r.data),
  });

  const handleDuplicate = async (t: InterviewTemplate) => {
    await api.post("/interview-templates/", {
      name: `${t.name} (Copie)`,
      type: t.type,
      description: t.description,
      sections: t.sections,
    });
    queryClient.invalidateQueries({ queryKey: ["interview-templates"] });
  };

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message="Impossible de charger les modèles" onRetry={refetch} />;

  return (
    <AppLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Modèles d'entretien</h1>
        <Button onClick={() => navigate("/templates/new")} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau modèle
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold uppercase text-muted-foreground">
                <th className="px-6 pb-3 pt-4">Nom</th>
                <th className="px-6 pb-3 pt-4">Type</th>
                <th className="px-6 pb-3 pt-4">Sections</th>
                <th className="px-6 pb-3 pt-4">Description</th>
                <th className="px-6 pb-3 pt-4"></th>
              </tr>
            </thead>
            <tbody>
              {templates?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    Aucun modèle trouvé
                  </td>
                </tr>
              )}
              {templates?.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0">
                  <td className="px-6 py-3 text-sm font-medium">{t.name}</td>
                  <td className="px-6 py-3">
                    <Badge variant={t.type as "annual" | "professional" | "bilan" | "forfait" | "fin_carriere"}>
                      {typeLabel[t.type]}
                    </Badge>
                  </td>
                  <td className="px-6 py-3 text-sm">{t.sections?.length ?? 0}</td>
                  <td className="px-6 py-3 text-sm text-muted-foreground max-w-xs truncate">
                    {t.description || "-"}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleDuplicate(t)} title="Dupliquer">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/templates/${t.id}/edit`)}>
                        Modifier
                      </Button>
                    </div>
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
