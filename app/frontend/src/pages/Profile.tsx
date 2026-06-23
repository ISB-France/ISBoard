import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import AppLayout from "../components/AppLayout";
import LoadingScreen from "../components/LoadingScreen";
import api from "../api";
import type { User } from "../types";

export default function Profile() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["me"],
    queryFn: () => api.get("/auth/me/").then((r) => r.data),
  });

  if (isLoading) return <LoadingScreen />;
  if (!user) return null;

  const initials = `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || user.email[0].toUpperCase();

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg">
        <Card>
          <CardHeader className="flex flex-col items-center gap-4 pb-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-xl font-semibold" style={{ backgroundColor: '#FFDD00', color: '#3B2800' }}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <CardTitle>{user.first_name} {user.last_name}</CardTitle>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <tbody>
                <tr><td className="py-2 text-muted-foreground">Rôle</td><td className="py-2 pl-4 font-medium">
                  {{ admin: "Admin", rh: "RH", manager: "Manager", employee: "Employé", stagiaire: "Stagiaire", alternant: "Alternant" }[user.role] || user.role}
                </td></tr>
                <tr><td className="py-2 text-muted-foreground">Matricule</td><td className="py-2 pl-4 font-medium">{user.matricule || "—"}</td></tr>
                <tr><td className="py-2 text-muted-foreground">Service</td><td className="py-2 pl-4 font-medium">{user.service_name || "—"}</td></tr>
                <tr><td className="py-2 text-muted-foreground">Site</td><td className="py-2 pl-4 font-medium">{user.site_name || "—"}</td></tr>
                <tr><td className="py-2 text-muted-foreground">Poste</td><td className="py-2 pl-4 font-medium">{user.position_name || "—"}</td></tr>
                <tr><td className="py-2 text-muted-foreground">N+1</td><td className="py-2 pl-4 font-medium">{user.manager_name || "—"}</td></tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
