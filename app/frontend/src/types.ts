export interface Site {
  id: number;
  name: string;
}

export interface Service {
  id: number;
  name: string;
}

export interface Position {
  id: number;
  name: string;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: "admin" | "rh" | "manager" | "employee" | "stagiaire" | "alternant";

  // Identité
  sexe: "" | "homme" | "femme" | "non_binaire";
  date_naissance: string | null;
  telephone: string;
  photo: string | null;

  // Contrat
  matricule: string;
  hire_date: string | null;
  date_sortie: string | null;
  type_contrat: "" | "cdi" | "cdd" | "interim" | "alternance" | "stage";
  statut: "actif" | "inactif" | "sortie";
  coefficient: string;
  salaire_brut: number | null;
  forfait_jour: boolean;
  tickets_restaurant: boolean;
  cadre: boolean;

  // Organisation
  service: number | null;
  service_name: string;
  position: number | null;
  position_name: string;
  site: number | null;
  site_name: string;
  manager: number | null;
  manager_name: string | null;
  agence_interim: string;

}

export interface Campaign {
  id: number;
  name: string;
  template: number | null;
  description: string;
  start_date: string;
  due_date: string;
  population_filter: Record<string, unknown>;
  interview_count: number;
  created_at: string;
  updated_at: string;
}

export interface InterviewTemplate {
  id: number;
  name: string;
  type: "annual" | "professional" | "bilan" | "forfait" | "fin_carriere";
  description: string;
  sections: Section[];
  created_at: string;
  updated_at: string;
}

export interface Section {
  id: string;
  title: string;
  questions: Question[];
}

export interface Question {
  id: string;
  label: string;
  type: "textarea" | "rating";
  answer?: string | number | null;
}

export interface Interview {
  id: number;
  employee: number;
  employee_detail: User;
  manager: number;
  manager_detail: User;
  campaign: number | null;
  template: number | null;
  template_name: string;
  type: "annual" | "professional" | "bilan" | "forfait" | "fin_carriere";
  status: "draft" | "in_progress" | "completed" | "signed" | "cancelled";
  due_date: string;
  content: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface InterviewStats {
  total: number;
  by_status: { status: string; count: number }[];
  by_type: { type: string; count: number }[];
  overdue: number;
  upcoming: number;
}
