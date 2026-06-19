import { useQuery } from "@tanstack/react-query";
import api from "../api";
import Layout from "../Layout";
import type { User } from "../types";

export default function Users() {
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: () => api.get("/users/").then((r) => r.data),
  });

  const roleLabel: Record<string, string> = {
    rh: "RH",
    manager: "Manager",
    employee: "Employé",
  };

  const onboardingLabel: Record<string, string> = {
    pending: "En attente",
    in_progress: "En cours",
    completed: "Terminé",
  };

  return (
    <Layout>
      <h1 style={{ marginBottom: 24 }}>Utilisateurs</h1>
      <div className="card">
        {isLoading ? (
          <p>Chargement...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Service</th>
                <th>Manager</th>
                <th>Onboarding</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => (
                <tr key={u.id}>
                  <td>{u.first_name} {u.last_name}</td>
                  <td>{u.email}</td>
                  <td>{roleLabel[u.role]}</td>
                  <td>{u.department || "-"}</td>
                  <td>{u.manager_name || "-"}</td>
                  <td>{onboardingLabel[u.onboarding_status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
