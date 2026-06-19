import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import Layout from "../Layout";
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

  const updateAnswer = (sectionIdx: number, qIdx: number, value: string | number | null) => {
    setSections((prev) => {
      const next = [...prev];
      const qs = [...next[sectionIdx].questions];
      qs[qIdx] = { ...qs[qIdx], answer: value };
      next[sectionIdx] = { ...next[sectionIdx], questions: qs };
      return next;
    });
  };

  const handleSave = async (newStatus?: string) => {
    if (!interview) return;
    setSaving(true);
    const payload: Record<string, unknown> = {
      content: { ...interview.content, sections },
    };
    if (newStatus) payload.status = newStatus;
    const res = await api.put(`/interviews/${id}/`, payload);
    setInterview(res.data);
    setSections(res.data.content?.sections || []);
    setSaving(false);
  };

  if (!interview) {
    return <Layout><p>Chargement...</p></Layout>;
  }

  const isReadOnly = interview.status === "completed" || interview.status === "cancelled";

  return (
    <Layout>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, alignItems: "start" }}>
        <div>
          <h1>{interview.type === "annual" ? "Entretien annuel" : "Entretien professionnel"}</h1>
          <p style={{ color: "#666", marginTop: 4 }}>
            {interview.employee_detail?.first_name} {interview.employee_detail?.last_name}
            {" · "}
            {interview.manager_detail?.first_name} {interview.manager_detail?.last_name}
            {" · "}
            <span className={`badge ${interview.status}`}>{statusLabel[interview.status]}</span>
            {" · "}
            Date limite : {interview.due_date}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {!isReadOnly && (
            <>
              <button className="btn btn-primary" onClick={() => handleSave()} disabled={saving}>
                {saving ? "Sauvegarde..." : "Enregistrer"}
              </button>
              <button className="btn btn-outline" onClick={() => navigate(`/interviews/${id}/edit`)}>
                Modifier
              </button>
            </>
          )}
          <button className="btn btn-outline" onClick={() => window.open(`/api/interviews/${id}/print/`, "_blank")}>
            Imprimer / PDF
          </button>
          {interview.status === "in_progress" && (
            <button className="btn btn-primary" onClick={() => handleSave("completed")}>
              Finaliser
            </button>
          )}
          {interview.status === "draft" && (
            <button className="btn btn-primary" onClick={() => handleSave("in_progress")}>
              Démarrer
            </button>
          )}
        </div>
      </div>

      {sections.map((section, sIdx) => (
        <div key={section.id} className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, marginBottom: 16, color: "#1a1a2e" }}>{section.title}</h2>
          {section.questions.map((q, qIdx) => (
            <div key={q.id} className="form-group" style={{ marginBottom: 20 }}>
              <label>{q.label}</label>
              {q.type === "textarea" && (
                <textarea
                  rows={4}
                  value={typeof q.answer === "string" ? q.answer : ""}
                  onChange={(e) => updateAnswer(sIdx, qIdx, e.target.value)}
                  disabled={isReadOnly}
                  style={{ background: isReadOnly ? "#f9f9f9" : "#fff" }}
                />
              )}
              {q.type === "rating" && (
                <div style={{ display: "flex", gap: 8 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => !isReadOnly && updateAnswer(sIdx, qIdx, n)}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        border: q.answer === n ? "2px solid #1a1a2e" : "1px solid #d0d0d0",
                        background: q.answer !== null && n <= (q.answer as number) ? "#1a1a2e" : "#fff",
                        color: q.answer !== null && n <= (q.answer as number) ? "#fff" : "#333",
                        cursor: isReadOnly ? "default" : "pointer",
                        fontWeight: 600,
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </Layout>
  );
}
