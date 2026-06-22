import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import AppLayout from "../components/AppLayout";
import LoadingScreen from "../components/LoadingScreen";
import ErrorScreen from "../components/ErrorScreen";
import api from "../api";
import type { Campaign } from "../types";

export default function Campaigns() {
  const navigate = useNavigate();

  const { data: campaigns, isLoading, error, refetch } = useQuery<Campaign[]>({
    queryKey: ["campaigns"],
    queryFn: () => api.get("/campaigns/").then((r) => r.data),
  });

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message="Impossible de charger les campagnes" onRetry={refetch} />;

  return (
    <AppLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Campagnes</h1>
        <Button onClick={() => navigate("/campaigns/new")} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle campagne
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold uppercase text-muted-foreground">
                <th className="px-6 pb-3 pt-4">Nom</th>
                <th className="px-6 pb-3 pt-4">Période</th>
                <th className="px-6 pb-3 pt-4">Entretiens</th>
                <th className="px-6 pb-3 pt-4"></th>
              </tr>
            </thead>
            <tbody>
              {campaigns?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    Aucune campagne trouvée
                  </td>
                </tr>
              )}
              {campaigns?.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="px-6 py-3">
                    <button className="text-sm font-medium hover:underline" onClick={() => navigate(`/campaigns/${c.id}`)}>
                      {c.name}
                    </button>
                  </td>
                  <td className="px-6 py-3 text-sm text-muted-foreground">
                    {c.start_date} → {c.due_date}
                  </td>
                  <td className="px-6 py-3">
                    <Badge variant="secondary">{c.interview_count}</Badge>
                  </td>
                  <td className="px-6 py-3">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/campaigns/${c.id}/edit`)}>
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
