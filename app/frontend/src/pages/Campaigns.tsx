import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import ConfirmDialog from "../components/ConfirmDialog";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import AppLayout from "../components/AppLayout";
import LoadingScreen from "../components/LoadingScreen";
import ErrorScreen from "../components/ErrorScreen";
import api from "../api";
import type { Campaign, User } from "../types";

export default function Campaigns() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showHistory, setShowHistory] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: currentUser } = useQuery<User>({
    queryKey: ["me"],
    queryFn: () => api.get("/auth/me/").then((r) => r.data),
  });

  const { data: campaigns, isLoading, error, refetch } = useQuery<Campaign[]>({
    queryKey: ["campaigns"],
    queryFn: () => api.get("/campaigns/").then((r) => r.data),
  });

  const today = new Date().toISOString().slice(0, 10);
  const filtered = campaigns?.filter((c) =>
    showHistory ? c.due_date < today : c.due_date >= today,
  );

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message="Impossible de charger les campagnes" onRetry={refetch} />;

  return (
    <AppLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Campagnes</h1>
        {(currentUser?.role === "admin" || currentUser?.role === "rh") && (
          <Button onClick={() => navigate("/campaigns/new")} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle campagne
          </Button>
        )}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-md border border-border">
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors ${!showHistory ? "bg-isb-yellow text-isb-brown" : "bg-white text-muted-foreground hover:bg-muted/50"}`}
            onClick={() => setShowHistory(false)}
          >
            En cours
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors ${showHistory ? "bg-isb-yellow text-isb-brown" : "bg-white text-muted-foreground hover:bg-muted/50"}`}
            onClick={() => setShowHistory(true)}
          >
            Historique
          </button>
        </div>
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
              {filtered?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    {showHistory ? "Aucune campagne passée" : "Aucune campagne en cours"}
                  </td>
                </tr>
              )}
              {filtered?.map((c) => (
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
                    <div className="flex items-center gap-1">
                      {(currentUser?.role === "admin" || currentUser?.role === "rh") && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/campaigns/${c.id}/edit`)}>
                            Modifier
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteId(c.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteId !== null}
        title="Supprimer la campagne"
        message="Êtes-vous sûr de vouloir supprimer cette campagne ? Les entretiens liés seront également supprimés."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        onConfirm={async () => { if (deleteId) { await api.delete(`/campaigns/${deleteId}/`); queryClient.invalidateQueries({ queryKey: ["campaigns"] }); } setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
      />
    </AppLayout>
  );
}
