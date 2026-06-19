import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import AppLayout from "../components/AppLayout";
import LoadingScreen from "../components/LoadingScreen";
import api from "../api";
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
    <AppLayout>
      <Button variant="ghost" className="mb-4 gap-2" onClick={() => navigate("/interviews")}>
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Button>

      <h1 className="mb-6 font-display text-2xl font-bold">
        {isEdit ? "Modifier" : "Nouvel"} entretien
      </h1>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Employé</label>
              <select
                value={employee}
                onChange={(e) => setEmployee(e.target.value)}
                required
                className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Sélectionner...</option>
                {employees?.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name} ({u.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="annual">Annuel</option>
                <option value="professional">Professionnel</option>
              </select>
            </div>
            {isEdit && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">Statut</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="draft">Brouillon</option>
                  <option value="in_progress">En cours</option>
                  <option value="completed">Terminé</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Date limite</label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate("/interviews")}>
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
