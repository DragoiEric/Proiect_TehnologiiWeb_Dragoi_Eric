import { Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ProfessorStart from "./pages/prof/ProfessorStart.jsx";
import ProfessorCourses from "./pages/prof/ProfessorCourses.jsx";
import ProfessorCourseDetails from "./pages/prof/ProfessorCourseDetails.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route path="/dashboard" element={<Dashboard />} />

      <Route path="/prof" element={<ProfessorStart />} />
      <Route path="/prof/courses" element={<ProfessorCourses />} />
      <Route path="/prof/courses/:courseId" element={<ProfessorCourseDetails />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
