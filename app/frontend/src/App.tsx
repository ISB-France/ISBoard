import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";
import Interviews from "./pages/Interviews";
import InterviewForm from "./pages/InterviewForm";
import Users from "./pages/Users";

function App() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/interviews" element={<Interviews />} />
      <Route path="/interviews/new" element={<InterviewForm />} />
      <Route path="/interviews/:id/edit" element={<InterviewForm />} />
      <Route path="/users" element={<Users />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
