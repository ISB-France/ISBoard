import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Play, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import AppLayout from "../components/AppLayout";
import LoadingScreen from "../components/LoadingScreen";
import ErrorScreen from "../components/ErrorScreen";
import api from "../api";
import type { Campaign, Interview } from "../types";

const statusLabel: Record<string, string> = {
  draft: "Brouillon",
  in_progress: "En cours",
  completed: "Terminé",
  signed: "Signé",
  cancelled: "Annulé",
};

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);

  const { data: campaign, isLoading, error } = useQuery<Campaign>({
    queryKey: ["campaign", id],
    queryFn: () => api.get(`/campaigns/${id}/`).then((r) => r.data),
  });

  const { data: interviews } = useQuery<Interview[]>({
    queryKey: ["interviews", "campaign", id],
    queryFn: () => api.get("/interviews/").then((r) =>
      r.data.filter((iv: Interview) => iv.campaign === Number(id)),
    ),
  });

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.post(`/campaigns/${id}/generate/`);
      queryClient.invalidateQueries({ queryKey: ["campaign", id] });
      queryClient.invalidateQueries({ queryKey: ["interviews", "campaign", id] });
    } catch (err) {
      console.error(err);
    }
    setGenerating(false);
  };

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message="Campagne introuvable" />;

  return (
    <AppLayout>
      <Button variant="ghost" className="mb-4 gap-2" onClick={() => navigate("/campaigns")}>
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">{campaign?.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {campaign?.start_date} → {campaign?.due_date}
            {campaign?.description && <> · {campaign.description}</>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleGenerate} disabled={generating} className="gap-2">
            <Play className="h-4 w-4" />
            {generating ? "Génération..." : "Générer les entretiens"}
          </Button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <Badge variant="secondary">{campaign?.interview_count ?? 0} entretien{(campaign?.interview_count ?? 0) > 1 ? "s" : ""}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Entretiens générés</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold uppercase text-muted-foreground">
                <th className="px-6 pb-3 pt-4">Employé</th>
                <th className="px-6 pb-3 pt-4">Statut</th>
                <th className="px-6 pb-3 pt-4">Date limite</th>
                <th className="px-6 pb-3 pt-4"></th>
              </tr>
            </thead>
            <tbody>
              {interviews?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    Aucun entretien généré. Cliquez sur "Générer les entretiens".
                  </td>
                </tr>
              )}
              {interviews?.map((iv) => (
                <tr
                  key={iv.id}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50"
                  onClick={() => navigate(`/interviews/${iv.id}`)}
                >
                  <td className="px-6 py-3 text-sm font-medium">
                    {iv.employee_detail?.first_name} {iv.employee_detail?.last_name}
                  </td>
                  <td className="px-6 py-3">
                    <Badge variant={iv.status as "draft" | "in_progress" | "completed" | "signed" | "cancelled"}>
                      {statusLabel[iv.status]}
                    </Badge>
                  </td>
                  <td className="px-6 py-3 text-sm">{iv.due_date}</td>
                  <td className="px-6 py-3">
                    <Button variant="ghost" size="sm">Voir</Button>
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
