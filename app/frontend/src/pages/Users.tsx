import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import AppLayout from "../components/AppLayout";
import LoadingScreen from "../components/LoadingScreen";
import ErrorScreen from "../components/ErrorScreen";
import api from "../api";
import type { User } from "../types";

const roleLabel: Record<string, string> = {
  rh: "RH",
  manager: "Manager",
  employee: "Employé",
};

const roleBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
  rh: "default",
  manager: "secondary",
  employee: "outline",
};

const onboardingLabel: Record<string, string> = {
  pending: "En attente",
  in_progress: "En cours",
  completed: "Terminé",
};

export default function Users() {
  const { data: users, isLoading, error, refetch } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: () => api.get("/users/").then((r) => r.data),
  });

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message="Impossible de charger les utilisateurs" onRetry={refetch} />;

  return (
    <AppLayout>
      <h1 className="mb-6 font-display text-2xl font-bold">Utilisateurs</h1>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold uppercase text-muted-foreground">
                <th className="px-6 pb-3 pt-4">Utilisateur</th>
                <th className="px-6 pb-3 pt-4">Rôle</th>
                <th className="px-6 pb-3 pt-4">Service</th>
                <th className="px-6 pb-3 pt-4">Manager</th>
                <th className="px-6 pb-3 pt-4">Onboarding</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-isb-yellow text-isb-brown text-xs font-semibold">
                          {(u.first_name?.[0] ?? "") + (u.last_name?.[0] ?? "") || u.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {u.first_name} {u.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <Badge variant={roleBadgeVariant[u.role]}>{roleLabel[u.role]}</Badge>
                  </td>
                  <td className="px-6 py-3 text-sm">{u.department || "-"}</td>
                  <td className="px-6 py-3 text-sm text-muted-foreground">{u.manager_name || "-"}</td>
                  <td className="px-6 py-3 text-sm">{onboardingLabel[u.onboarding_status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
