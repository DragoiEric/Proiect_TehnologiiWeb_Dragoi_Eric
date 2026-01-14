import { Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ProfessorStart from "./pages/prof/ProfessorStart.jsx";
import ProfessorCourses from "./pages/prof/ProfessorCourses.jsx";
import ProfessorCourseDetails from "./pages/prof/ProfessorCourseDetails.jsx";
import ProfessorGroups from "./pages/prof/ProfessorGroups.jsx";
import ProfessorOfferingPage from "./pages/prof/ProfessorOfferingPage.jsx";
import StudentStart from "./pages/student/StudentStart.jsx";
import ProfessorProjectPage from "./pages/prof/ProfessorProjectPage.jsx";
import StudentOfferingPage from "./pages/student/StudentOfferingPage.jsx";
import StudentJuryPage from "./pages/student/StudentJuryPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      

      <Route path="/prof" element={<ProfessorStart />} />
      <Route path="/prof/courses" element={<ProfessorCourses />} />
      <Route path="/prof/courses/:courseId" element={<ProfessorCourseDetails />} />
      <Route path="/prof/offerings/:offeringId" element={<ProfessorOfferingPage />} />
      <Route path="/prof/projects/:projectId" element={<ProfessorProjectPage />} />
      <Route path="/prof/groups" element={<ProfessorGroups />} />

      <Route path="/dashboard" element={<StudentStart />} />
      <Route path="/dashboard/offerings/:offeringId" element={<StudentOfferingPage />} />
      <Route path="/dashboard/jury" element={<StudentJuryPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
