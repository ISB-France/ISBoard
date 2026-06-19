import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../api";
import Layout from "../Layout";
import type { User } from "../types";

export default function InterviewForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [employee, setEmployee] = useState("");
  const [type, setType] = useState("annual");
  const [status, setStatus] = useState("draft");
  const [dueDate, setDueDate] = useState("");

  const { data: employees } = useQuery<User[]>({
    queryKey: ["employees"],
    queryFn: () => api.get("/interviews/employees/").then((r) => r.data),
  });

  useEffect(() => {
    if (!id) return;
    api.get(`/interviews/${id}/`).then((r) => {
      setEmployee(String(r.data.employee));
      setType(r.data.type);
      setStatus(r.data.status);
      setDueDate(r.data.due_date);
    });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { employee: Number(employee), type, status, due_date: dueDate, content: {} };
    if (isEdit) {
      await api.put(`/interviews/${id}/`, payload);
    } else {
      await api.post("/interviews/", payload);
    }
    navigate("/interviews");
  };

  return (
    <Layout>
      <h1 style={{ marginBottom: 24 }}>{isEdit ? "Modifier" : "Nouvel"} entretien</h1>
      <div className="card" style={{ maxWidth: 600 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Employé</label>
            <select value={employee} onChange={(e) => setEmployee(e.target.value)} required>
              <option value="">Sélectionner...</option>
              {employees?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.first_name} {u.last_name} ({u.email})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="annual">Annuel</option>
              <option value="professional">Professionnel</option>
            </select>
          </div>
          {isEdit && (
            <div className="form-group">
              <label>Statut</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="draft">Brouillon</option>
                <option value="in_progress">En cours</option>
                <option value="completed">Terminé</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>
          )}
          <div className="form-group">
            <label>Date limite</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => navigate("/interviews")}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary">
              {isEdit ? "Enregistrer" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
