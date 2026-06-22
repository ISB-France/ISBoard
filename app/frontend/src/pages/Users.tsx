import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Search } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import AppLayout from "../components/AppLayout";
import LoadingScreen from "../components/LoadingScreen";
import ErrorScreen from "../components/ErrorScreen";
import api from "../api";
import type { User, Site } from "../types";

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

export default function Users() {
  const navigate = useNavigate();
  const [managerId, setManagerId] = useState<string>("");
  const [siteId, setSiteId] = useState<string>("");
  const [search, setSearch] = useState("");

  const { data: currentUser } = useQuery<User>({
    queryKey: ["me"],
    queryFn: () => api.get("/auth/me/").then((r) => r.data),
  });

  const { data: users, isLoading, error, refetch } = useQuery<User[]>({
    queryKey: ["users", managerId, siteId, search],
    queryFn: () =>
      api
        .get("/users/", {
          params: {
            manager: managerId || undefined,
            site: siteId || undefined,
            search: search || undefined,
          },
        })
        .then((r) => r.data),
  });

  const { data: allUsers } = useQuery<User[]>({
    queryKey: ["users-all"],
    queryFn: () => api.get("/users/").then((r) => r.data),
    enabled: !!managerId,
  });

  const currentManager = allUsers?.find((u) => String(u.id) === managerId);

  const { data: sites } = useQuery<Site[]>({
    queryKey: ["sites"],
    queryFn: () => api.get("/sites/").then((r) => r.data),
  });

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message="Impossible de charger les utilisateurs" onRetry={refetch} />;

  return (
    <AppLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Utilisateurs</h1>
        {currentUser?.role === "rh" && (
          <Button onClick={() => navigate("/users/new")} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvel utilisateur
          </Button>
        )}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, prénom, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          className="h-10 rounded-md border border-border bg-white px-3 text-sm"
          value={siteId}
          onChange={(e) => setSiteId(e.target.value)}
        >
          <option value="">Tous les sites</option>
          {sites?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {managerId && (
        <div className="mb-4 flex items-center gap-2 text-sm">
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => setManagerId("")}>
            <ArrowLeft className="h-4 w-4" />
            Tous
          </Button>
          {currentManager?.manager_name && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={() => setManagerId(String(currentManager.manager!))}
            >
              <ArrowLeft className="h-4 w-4" />
              {currentManager.manager_name}
            </Button>
          )}
          <span className="text-muted-foreground">
            N-1 de {currentManager?.first_name} {currentManager?.last_name}
          </span>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold uppercase text-muted-foreground">
                <th className="px-6 pb-3 pt-4">Utilisateur</th>
                <th className="px-6 pb-3 pt-4">Rôle</th>
                <th className="px-6 pb-3 pt-4">Site</th>
                <th className="px-6 pb-3 pt-4">Service</th>
                <th className="px-6 pb-3 pt-4">Manager</th>
                <th className="px-6 pb-3 pt-4">N-1</th>
                {currentUser?.role === "rh" && <th className="px-6 pb-3 pt-4"></th>}
              </tr>
            </thead>
            <tbody>
              {users?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              )}
              {users?.map((u) => {
                const hasSubordinates = allUsers?.some((e) => e.manager === u.id) ?? users?.some((e) => e.manager === u.id);
                return (
                  <tr
                    key={u.id}
                    className={`border-b border-border last:border-0 ${hasSubordinates ? "cursor-pointer hover:bg-muted/50" : ""}`}
                    onClick={() => hasSubordinates && setManagerId(String(u.id))}
                  >
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
                      <Badge variant={u.role === "rh" ? "default" : u.role === "manager" ? "secondary" : "outline"}>
                        {roleLabel[u.role]}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-sm">{u.site_name || "-"}</td>
                    <td className="px-6 py-3 text-sm">{u.department || "-"}</td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">{u.manager_name || "-"}</td>
                    <td className="px-6 py-3 text-sm">{hasSubordinates ? `${users?.filter((e) => e.manager === u.id).length ?? 0} N-1` : "-"}</td>
                    {currentUser?.role === "rh" && (
                      <td className="px-6 py-3">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/users/${u.id}/edit`); }}>
                          Modifier
                        </Button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
