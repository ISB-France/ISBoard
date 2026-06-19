import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Layout from "../Layout";
import type { Interview } from "../types";

export default function Interviews() {
  const navigate = useNavigate();
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");

  const { data: interviews, isLoading } = useQuery<Interview[]>({
    queryKey: ["interviews", type, status],
    queryFn: () =>
      api
        .get("/interviews/", { params: { type, status } })
        .then((r) => r.data),
  });

  const statusLabel: Record<string, string> = {
    draft: "Brouillon",
    in_progress: "En cours",
    completed: "Terminé",
    cancelled: "Annulé",
  };

  return (
    <Layout>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h1>Entretiens</h1>
        <button className="btn btn-primary" onClick={() => navigate("/interviews/new")}>
          Nouvel entretien
        </button>
      </div>
      <div className="filters">
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Tous les types</option>
          <option value="annual">Annuel</option>
          <option value="professional">Professionnel</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="draft">Brouillon</option>
          <option value="in_progress">En cours</option>
          <option value="completed">Terminé</option>
          <option value="cancelled">Annulé</option>
        </select>
      </div>
      <div className="card">
        {isLoading ? (
          <p>Chargement...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Employé</th>
                <th>Type</th>
                <th>Statut</th>
                <th>Date limite</th>
                <th>Manager</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {interviews?.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "#999" }}>
                    Aucun entretien
                  </td>
                </tr>
              )}
              {interviews?.map((iv) => (
                <tr key={iv.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/interviews/${iv.id}`)}>
                  <td>{iv.employee_detail?.first_name} {iv.employee_detail?.last_name}</td>
                  <td><span className={`badge ${iv.type}`}>{iv.type === "annual" ? "Annuel" : "Professionnel"}</span></td>
                  <td><span className={`badge ${iv.status}`}>{statusLabel[iv.status]}</span></td>
                  <td>{iv.due_date}</td>
                  <td>{iv.manager_detail?.first_name} {iv.manager_detail?.last_name}</td>
                  <td>
                    <button className="btn btn-outline" onClick={(e) => { e.stopPropagation(); navigate(`/interviews/${iv.id}/edit`); }}>
                      Modifier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
