import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import AppLayout from "../components/AppLayout";
import api from "../api";
import type { Site } from "../types";

export default function UserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("employee");
  const [department, setDepartment] = useState("");
  const [site, setSite] = useState("");
  const [hireDate, setHireDate] = useState("");

  const { data: sites } = useQuery<Site[]>({
    queryKey: ["sites"],
    queryFn: () => api.get("/sites/").then((r) => r.data),
  });

  useEffect(() => {
    if (!id) return;
    api.get(`/users/${id}/`).then((r) => {
      setEmail(r.data.email);
      setFirstName(r.data.first_name);
      setLastName(r.data.last_name);
      setRole(r.data.role);
      setDepartment(r.data.department);
      setSite(r.data.site ?? "");
      setHireDate(r.data.hire_date ?? "");
    });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { email, first_name: firstName, last_name: lastName, role, department, site: site || null, hire_date: hireDate || null };
    if (isEdit) {
      await api.put(`/users/${id}/`, payload);
    } else {
      await api.post("/users/", payload);
    }
    navigate("/users");
  };

  return (
    <AppLayout>
      <Button variant="ghost" className="mb-4 gap-2" onClick={() => navigate("/users")}>
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Button>

      <h1 className="mb-6 font-display text-2xl font-bold">
        {isEdit ? "Modifier" : "Nouvel"} utilisateur
      </h1>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Prénom</label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Nom</label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Rôle</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="employee">Employé</option>
                <option value="manager">Manager</option>
                <option value="rh">RH</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Service</label>
              <Input value={department} onChange={(e) => setDepartment(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Site</label>
              <select
                value={site}
                onChange={(e) => setSite(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Sélectionner...</option>
                {sites?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Date d'embauche</label>
              <Input type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate("/users")}>
                Annuler
              </Button>
              <Button type="submit">{isEdit ? "Enregistrer" : "Créer"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
