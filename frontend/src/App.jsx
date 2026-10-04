import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { Loading, ErrorNotice } from "./components/common/Feedback";
import AppLayout from "./layouts/AppLayout";
const Landing = lazy(() => import("./pages/Landing"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Knowledge = lazy(() => import("./pages/Knowledge"));
const Document = lazy(() => import("./pages/Document"));
const StudyAgent = lazy(() => import("./pages/StudyAgent"));
const History = lazy(() => import("./pages/History"));
const Account = lazy(() => import("./pages/Account"));
const NotFound = lazy(() => import("./pages/NotFound"));
const StudyTools = lazy(() => import("./pages/StudyTools"));
const StudyContent = lazy(() => import("./pages/StudyContent"));
const Quiz = lazy(() => import("./pages/Quiz"));
const Flashcards = lazy(() => import("./pages/Flashcards"));
const Search = lazy(() => import("./pages/Search"));
const Plans = lazy(() => import("./pages/Plans"));
const Review = lazy(() => import("./pages/Review"));
const Exam = lazy(() => import("./pages/Exam"));
const Research = lazy(() => import("./pages/Research"));
function Protected() {
  const { user, loading, error, refresh } = useAuth();
  const location = useLocation();
  if (loading) return <Loading />;
  if (error)
    return (
      <div className="connection-error">
        <ErrorNotice message={error} retry={refresh} />
      </div>
    );
  return user ? (
    <AppLayout />
  ) : (
    <Navigate to="/login" state={{ from: location.pathname }} replace />
  );
}
export default function App() {
  const location = useLocation();
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/register" element={<Auth mode="register" />} />
        <Route path="/app" element={<Protected />}>
          <Route index element={<Dashboard />} />
          <Route path="knowledge" element={<Knowledge />} />
          <Route path="workspaces/:workspaceId" element={<Knowledge />} />
          <Route path="documents/:id" element={<Document />} />
          <Route path="agent" element={<StudyAgent />} />
          <Route path="agent/:id" element={<StudyAgent />} />
          <Route path="history" element={<History />} />
          <Route path="study" element={<StudyTools />} />
          <Route
            path="study/summaries/:id"
            element={<StudyContent key={location.pathname} />}
          />
          <Route
            path="study/notes/:id"
            element={<StudyContent key={location.pathname} notes />}
          />
          <Route
            path="study/quizzes/:id"
            element={<Quiz key={location.pathname} />}
          />
          <Route
            path="study/flashcards/:id"
            element={<Flashcards key={location.pathname} />}
          />
          <Route path="search" element={<Search />} />
          <Route path="plans" element={<Plans />} />
          <Route path="research" element={<Research />} />
          <Route path="review" element={<Review />} />
          <Route path="exams/:id" element={<Exam key={location.pathname} />} />
          <Route path="profile" element={<Account />} />
          <Route path="settings" element={<Account settings />} />
          <Route path="*" element={<NotFound embedded />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
