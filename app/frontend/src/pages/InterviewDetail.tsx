import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Save, CheckCircle2, Download, PenSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import AppLayout from "../components/AppLayout";
import LoadingScreen from "../components/LoadingScreen";
import api from "../api";
import type { Interview, User } from "../types";

type Question = {
  id: string;
  label: string;
  type: "textarea" | "rating";
  answer: string | number | null;
};

type Section = {
  id: string;
  title: string;
  questions: Question[];
};

const statusLabel: Record<string, string> = {
  draft: "Brouillon",
  in_progress: "En cours",
  completed: "Terminé",
  signed: "Signé",
  cancelled: "Annulé",
};

export default function InterviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [saving, setSaving] = useState(false);

  const { data: currentUser } = useQuery<User>({
    queryKey: ["me"],
    queryFn: () => api.get("/auth/me/").then((r) => r.data),
  });

  useEffect(() => {
    if (!id) return;
    api.get(`/interviews/${id}/`).then((r) => {
      setInterview(r.data);
      setSections(r.data.content?.sections || []);
    });
  }, [id]);

  const updateAnswer = (sIdx: number, qIdx: number, value: string | number | null) => {
    setSections((prev) => {
      const next = [...prev];
      const qs = [...next[sIdx].questions];
      qs[qIdx] = { ...qs[qIdx], answer: value };
      next[sIdx] = { ...next[sIdx], questions: qs };
      return next;
    });
  };

  const handleSave = async (newStatus?: string) => {
    if (!interview) return;
    setSaving(true);
    const payload: Record<string, unknown> = { content: { ...interview.content, sections } };
    if (newStatus) {
      payload.status = newStatus;
    } else if (interview.status === "draft") {
      payload.status = "in_progress";
    }
    const res = await api.patch(`/interviews/${id}/`, payload);
    setInterview(res.data);
    setSections(res.data.content?.sections || []);
    setSaving(false);
    if (newStatus === "completed") {
      navigate("/interviews");
    }
  };

  const downloadPdf = useCallback(async () => {
    const res = await api.get(`/interviews/${id}/pdf/`, { responseType: "blob" });
    const disposition = res.headers["content-disposition"];
    const match = disposition && disposition.match(/filename="(.+)"/);
    const filename = match ? match[1] : `entretien_${id}.pdf`;
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [id]);

  if (!interview) return <LoadingScreen />;

  const isOwn = interview.employee === currentUser?.id;
  const hasNoManager = currentUser && !currentUser.manager;
  const canEdit = currentUser?.role === "admin" || currentUser?.role === "rh" || interview.manager === currentUser?.id || (isOwn && hasNoManager) || (currentUser?.role === "manager" && !isOwn);
  const isReadOnly = !canEdit || interview.status === "completed" || interview.status === "signed" || interview.status === "cancelled";


  return (
    <AppLayout>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">
            {{ annual: "Entretien annuel", professional: "Entretien professionnel", bilan: "Entretien de bilan", forfait: "Entretien forfait jours et charges", fin_carriere: "Entretien de fin de carrière" }[interview.type]}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {interview.employee_detail?.first_name} {interview.employee_detail?.last_name}
            {" · "}
            {interview.manager_detail?.first_name} {interview.manager_detail?.last_name}
            {" · "}
            <Badge variant={interview.status as "draft" | "in_progress" | "completed" | "signed" | "cancelled"}>
              {statusLabel[interview.status]}
            </Badge>
            {interview.template_name && (
              <>{" · "}<span className="text-muted-foreground">{interview.template_name}</span></>
            )}
            {" · "}
            Date limite : {interview.due_date}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isReadOnly && (
            <Button variant="outline" size="sm" onClick={() => handleSave()} disabled={saving}>
              <Save className="mr-1 h-4 w-4" />
              {saving ? "Sauvegarde..." : "Enregistrer"}
            </Button>
          )}
          {(interview.status === "draft" || interview.status === "in_progress") && (
            <Button size="sm" onClick={() => handleSave("completed")}>
              <CheckCircle2 className="mr-1 h-4 w-4" />
              Finaliser
            </Button>
          )}
          {interview.status === "completed" && (
            <>
              <Button size="sm" onClick={() => handleSave("signed")}>
                <PenSquare className="mr-1 h-4 w-4" />
                Signer
              </Button>
              <Button variant="outline" size="sm" onClick={downloadPdf}>
                <Download className="mr-1 h-4 w-4" />
                Télécharger PDF
              </Button>
            </>
          )}
          {interview.status === "signed" && (
            <Button variant="outline" size="sm" onClick={downloadPdf}>
              <Download className="mr-1 h-4 w-4" />
              Télécharger PDF
            </Button>
          )}
        </div>
      </div>

      {/* Informations générales */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-2 gap-3 border-b border-border pb-4">
            <div>
              <span className="text-xs font-semibold uppercase text-muted-foreground">Date d'entretien</span>
              <p className="text-sm font-medium">{new Date().toLocaleDateString("fr-FR")}</p>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-muted-foreground">Nature de l'entretien</span>
              <p className="text-sm font-medium">
                {{ annual: "Entretien annuel", professional: "Entretien professionnel", bilan: "Entretien de bilan", forfait: "Entretien forfait jours et charges", fin_carriere: "Entretien de fin de carrière" }[interview.type]}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Manager</h4>
              <table className="w-full text-sm">
                <tbody>
                  <tr><td className="py-1 text-muted-foreground">Matricule</td><td className="py-1 pl-4">{interview.manager_detail?.matricule || "-"}</td></tr>
                  <tr><td className="py-1 text-muted-foreground">Nom</td><td className="py-1 pl-4">{interview.manager_detail?.last_name || "-"}</td></tr>
                  <tr><td className="py-1 text-muted-foreground">Prénom</td><td className="py-1 pl-4">{interview.manager_detail?.first_name || "-"}</td></tr>
                </tbody>
              </table>
            </div>
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Collaborateur</h4>
              <table className="w-full text-sm">
                <tbody>
                  <tr><td className="py-1 text-muted-foreground">Matricule</td><td className="py-1 pl-4">{interview.employee_detail?.matricule || "-"}</td></tr>
                  <tr><td className="py-1 text-muted-foreground">Nom</td><td className="py-1 pl-4">{interview.employee_detail?.last_name || "-"}</td></tr>
                  <tr><td className="py-1 text-muted-foreground">Prénom</td><td className="py-1 pl-4">{interview.employee_detail?.first_name || "-"}</td></tr>
                  <tr><td className="py-1 text-muted-foreground">Sexe</td><td className="py-1 pl-4">
                    {{ homme: "Homme", femme: "Femme", non_binaire: "Non-Binaire" }[interview.employee_detail?.sexe || ""] || "-"}
                  </td></tr>
                  <tr><td className="py-1 text-muted-foreground">Date naissance</td><td className="py-1 pl-4">{interview.employee_detail?.date_naissance || "-"}</td></tr>
                  <tr><td className="py-1 text-muted-foreground">Date embauche</td><td className="py-1 pl-4">{interview.employee_detail?.hire_date || "-"}</td></tr>
                  <tr><td className="py-1 text-muted-foreground">Type contrat</td><td className="py-1 pl-4">
                    {{ cdi: "CDI", cdd: "CDD", interim: "Intérim", alternance: "Alternance", stage: "Stage" }[interview.employee_detail?.type_contrat || ""] || "-"}
                  </td></tr>
                  <tr><td className="py-1 text-muted-foreground">Statut</td><td className="py-1 pl-4">
                    {{ actif: "Actif", inactif: "Inactif", sortie: "Sortie" }[interview.employee_detail?.statut || ""] || "-"}
                  </td></tr>
                  <tr><td className="py-1 text-muted-foreground">Poste</td><td className="py-1 pl-4">{interview.employee_detail?.position_name || "-"}</td></tr>
                  <tr><td className="py-1 text-muted-foreground">Coefficient</td><td className="py-1 pl-4">{interview.employee_detail?.coefficient || "-"}</td></tr>
                  <tr><td className="py-1 text-muted-foreground">Ancienneté</td><td className="py-1 pl-4">{interview.employee_detail?.hire_date ? `${Math.floor((Date.now() - new Date(interview.employee_detail.hire_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} ans` : "-"}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {sections.map((section, sIdx) => (
        <Card key={section.id} className="mb-4">
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {section.questions.map((q, qIdx) => (
              <div key={q.id}>
                <label className="mb-1.5 block text-sm font-medium">{q.label}</label>
                {q.type === "textarea" && (
                  <Textarea
                    rows={4}
                    value={typeof q.answer === "string" ? q.answer : ""}
                    onChange={(e) => updateAnswer(sIdx, qIdx, e.target.value)}
                    disabled={isReadOnly}
                  />
                )}
                {q.type === "rating" && (
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => !isReadOnly && updateAnswer(sIdx, qIdx, n)}
                        className={`flex h-10 w-10 items-center justify-center rounded-md border text-sm font-semibold transition-colors ${
                          q.answer !== null && n <= (q.answer as number)
                            ? "border-isb-yellow bg-isb-yellow text-isb-brown"
                            : "border-border text-muted-foreground hover:border-isb-sand-mid"
                        } ${isReadOnly ? "cursor-default" : "cursor-pointer"}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

    </AppLayout>
  );
}
