import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Download, Trash2 } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import AppLayout from "../components/AppLayout";
import LoadingScreen from "../components/LoadingScreen";
import ErrorScreen from "../components/ErrorScreen";
import ConfirmDialog from "../components/ConfirmDialog";
import api from "../api";
import type { Interview, User } from "../types";

const downloadPdf = async (id: number) => {
  const res = await api.get(`/interviews/${id}/pdf/`, { responseType: "blob" });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = `entretien_${id}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};

const openPrint = async (id: number) => {
  const w = window.open("", "_blank");
  if (!w) return;
  const res = await api.get(`/interviews/${id}/print/`);
  w.document.write(res.data);
  w.document.close();
  w.focus();
};

const statusLabel: Record<string, string> = {
  draft: "Brouillon",
  in_progress: "En cours",
  completed: "Terminé",
  signed: "Signé",
  cancelled: "Annulé",
};

export default function Interviews() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [type, setType] = useState("");
  const [scope, setScope] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: currentUser } = useQuery<User>({
    queryKey: ["me"],
    queryFn: () => api.get("/auth/me/").then((r) => r.data),
  });

  const statusParam = showHistory ? "completed,signed" : "draft,in_progress";

  const { data: interviews, isLoading, error, refetch } = useQuery<Interview[]>({
    queryKey: ["interviews", type, scope, showHistory],
    queryFn: () =>
      api.get("/interviews/", {
        params: { type, status: statusParam, scope: scope || undefined, ordering: showHistory ? "-updated_at" : undefined },
      }).then((r) => r.data),
  });

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message="Impossible de charger les entretiens" onRetry={refetch} />;

  return (
    <AppLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Entretiens</h1>
        {(currentUser?.role === "admin" || currentUser?.role === "rh") && (
          <Button onClick={() => navigate("/interviews/new")} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvel entretien
          </Button>
        )}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        {currentUser?.role === "manager" && (
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="h-10 rounded-md border border-border bg-white px-3 text-sm"
          >
            <option value="">N-1 (Équipe directe)</option>
            <option value="own">Mes entretiens</option>
            <option value="team">Toute l'équipe</option>
          </select>
        )}
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="h-10 rounded-md border border-border bg-white px-3 text-sm"
        >
          <option value="">Tous les types</option>
          <option value="annual">Annuel</option>
          <option value="professional">Professionnel</option>
          <option value="bilan">Bilan</option>
          <option value="forfait">Forfait jours</option>
          <option value="fin_carriere">Fin de carrière</option>
        </select>
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
                <th className="px-6 pb-3 pt-4">Employé</th>
                <th className="px-6 pb-3 pt-4">Type</th>
                <th className="px-6 pb-3 pt-4">Modèle</th>
                <th className="px-6 pb-3 pt-4">Statut</th>
                <th className="px-6 pb-3 pt-4">Date limite</th>
                <th className="px-6 pb-3 pt-4">Manager</th>
                <th className="px-6 pb-3 pt-4"></th>
              </tr>
            </thead>
            <tbody>
              {interviews?.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    {showHistory ? "Aucun entretien terminé" : "Aucun entretien en cours"}
                  </td>
                </tr>
              )}
              {interviews?.map((iv) => (
                <tr
                  key={iv.id}
                  className="border-b border-border last:border-0 transition-colors"
                >
                  <td className="px-6 py-3 text-sm font-medium">
                    {iv.employee_detail?.first_name} {iv.employee_detail?.last_name}
                  </td>
                  <td className="px-6 py-3">
                    <Badge variant={iv.type as "annual" | "professional" | "bilan" | "forfait" | "fin_carriere"}>
                      {{ annual: "Annuel", professional: "Professionnel", bilan: "Bilan", forfait: "Forfait jours", fin_carriere: "Fin de carrière" }[iv.type]}
                    </Badge>
                  </td>
                  <td className="px-6 py-3 text-sm text-muted-foreground">{iv.template_name || "-"}</td>
                  <td className="px-6 py-3">
                    <Badge variant={iv.status as "draft" | "in_progress" | "completed" | "signed" | "cancelled"}>
                      {statusLabel[iv.status]}
                    </Badge>
                  </td>
                  <td className="px-6 py-3 text-sm">{iv.due_date}</td>
                  <td className="px-6 py-3">
                    <div className="text-sm text-muted-foreground">
                      {iv.manager_detail?.first_name} {iv.manager_detail?.last_name}
                    </div>
                    {iv.employee_manager_name && (
                      <div className="text-xs text-muted-foreground/60">
                        N+1 : {iv.employee_manager_name}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-1">
                      {showHistory ? (
                        <>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openPrint(iv.id); }}>
                            Imprimer
                          </Button>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); downloadPdf(iv.id); }}>
                            <Download className="mr-1 h-4 w-4" />
                            PDF
                          </Button>
                        </>
                    ) : (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/interviews/${iv.id}`)}>
                          {iv.status === "draft" ? "Commencer" : "Voir"}
                        </Button>
                        {(currentUser?.role === "admin" || currentUser?.role === "rh") && (
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/interviews/${iv.id}/edit`); }}>
                            Modifier
                          </Button>
                        )}
                      </>
                    )}
                      {(currentUser?.role === "admin" || currentUser?.role === "rh") && (
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteId(iv.id); }}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
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
        title="Supprimer l'entretien"
        message="Êtes-vous sûr de vouloir supprimer cet entretien ? Cette action est irréversible."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        onConfirm={async () => { if (deleteId) { await api.delete(`/interviews/${deleteId}/`); queryClient.invalidateQueries({ queryKey: ["interviews"] }); } setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
      />
    </AppLayout>
  );
}
