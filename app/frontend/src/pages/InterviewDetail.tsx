import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Printer, Save, Play, CheckCircle2, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Separator } from "../components/ui/separator";
import AppLayout from "../components/AppLayout";
import LoadingScreen from "../components/LoadingScreen";
import api from "../api";
import type { Interview } from "../types";

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
  cancelled: "Annulé",
};

export default function InterviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [saving, setSaving] = useState(false);

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
    if (newStatus) payload.status = newStatus;
    const res = await api.put(`/interviews/${id}/`, payload);
    setInterview(res.data);
    setSections(res.data.content?.sections || []);
    setSaving(false);
  };

  if (!interview) return <LoadingScreen />;

  const isReadOnly = interview.status === "completed" || interview.status === "cancelled";

  return (
    <AppLayout>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">
            {interview.type === "annual" ? "Entretien annuel" : "Entretien professionnel"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {interview.employee_detail?.first_name} {interview.employee_detail?.last_name}
            {" · "}
            {interview.manager_detail?.first_name} {interview.manager_detail?.last_name}
            {" · "}
            <Badge variant={interview.status as "draft" | "in_progress" | "completed" | "cancelled"}>
              {statusLabel[interview.status]}
            </Badge>
            {" · "}
            Date limite : {interview.due_date}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => window.open(`/api/interviews/${id}/print/`, "_blank")}>
            <Printer className="mr-1 h-4 w-4" />
            Imprimer
          </Button>
          {!isReadOnly && (
            <>
              <Button variant="outline" size="sm" onClick={() => handleSave()} disabled={saving}>
                <Save className="mr-1 h-4 w-4" />
                {saving ? "Sauvegarde..." : "Enregistrer"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate(`/interviews/${id}/edit`)}>
                <Pencil className="mr-1 h-4 w-4" />
                Modifier
              </Button>
            </>
          )}
          {interview.status === "draft" && (
            <Button size="sm" onClick={() => handleSave("in_progress")}>
              <Play className="mr-1 h-4 w-4" />
              Démarrer
            </Button>
          )}
          {interview.status === "in_progress" && (
            <Button size="sm" onClick={() => handleSave("completed")}>
              <CheckCircle2 className="mr-1 h-4 w-4" />
              Finaliser
            </Button>
          )}
        </div>
      </div>

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
