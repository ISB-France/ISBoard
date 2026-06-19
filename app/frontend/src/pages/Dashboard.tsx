import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Layout from "../Layout";
import type { InterviewStats } from "../types";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useQuery<InterviewStats>({
    queryKey: ["interview-stats"],
    queryFn: () => api.get("/interviews/stats/").then((r) => r.data),
  });

  if (isLoading) return <Layout><p>Chargement...</p></Layout>;

  const statusMap: Record<string, number> = {};
  stats?.by_status.forEach((s) => { statusMap[s.status] = s.count; });

  return (
    <Layout>
      <h1 style={{ marginBottom: 24 }}>Tableau de bord</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total entretiens</h3>
          <div className="value">{stats?.total ?? 0}</div>
        </div>
        <div className="stat-card warning">
          <h3>Brouillon</h3>
          <div className="value">{statusMap["draft"] ?? 0}</div>
        </div>
        <div className="stat-card">
          <h3>En cours</h3>
          <div className="value">{statusMap["in_progress"] ?? 0}</div>
        </div>
        <div className="stat-card danger">
          <h3>En retard</h3>
          <div className="value">{stats?.overdue ?? 0}</div>
        </div>
        <div className="stat-card success">
          <h3>Terminés</h3>
          <div className="value">{statusMap["completed"] ?? 0}</div>
        </div>
        <div className="stat-card">
          <h3>À venir</h3>
          <div className="value">{stats?.upcoming ?? 0}</div>
        </div>
      </div>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <h2>Répartition par type</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Nombre</th>
            </tr>
          </thead>
          <tbody>
            {stats?.by_type.map((t) => (
              <tr key={t.type}>
                <td><span className={`badge ${t.type}`}>{t.type === "annual" ? "Annuel" : "Professionnel"}</span></td>
                <td>{t.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
