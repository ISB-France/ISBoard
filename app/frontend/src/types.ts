export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: "rh" | "manager" | "employee";
  department: string;
  hire_date: string | null;
  manager: number | null;
  manager_name: string | null;
  onboarding_status: "pending" | "in_progress" | "completed";
}

export interface Interview {
  id: number;
  employee: number;
  employee_detail: User;
  manager: number;
  manager_detail: User;
  type: "annual" | "professional";
  status: "draft" | "in_progress" | "completed" | "cancelled";
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
