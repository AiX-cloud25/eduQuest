import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Pages
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import SubjectPage from "./pages/SubjectPage";
import TopicPage from "./pages/TopicPage";
import ChapterPage from "./pages/ChapterPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminVideos from "./pages/admin/AdminVideos";
import AdminGifs from "./pages/admin/AdminGifs";
import AdminImages from "./pages/admin/AdminImages";
import AdminPdfs from "./pages/admin/AdminPdfs";

// Protected Route wrapper
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-pacific-500 font-heading text-xl">Loading...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Toaster 
        position="top-right" 
        richColors 
        toastOptions={{
          style: {
            fontFamily: 'Manrope, sans-serif',
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected Student Routes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/class/:classId" element={
            <ProtectedRoute>
              <SubjectPage />
            </ProtectedRoute>
          } />
          <Route path="/class/:classId/subject/:subjectId" element={
            <ProtectedRoute>
              <TopicPage />
            </ProtectedRoute>
          } />
          <Route path="/class/:classId/subject/:subjectId/topic/:topicId" element={
            <ProtectedRoute>
              <TopicPage />
            </ProtectedRoute>
          } />
          <Route path="/class/:classId/subject/:subjectId/topic/:topicId/chapter/:chapterId" element={
            <ProtectedRoute>
              <ChapterPage />
            </ProtectedRoute>
          } />
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute adminOnly>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/admin/videos" replace />} />
            <Route path="videos" element={<AdminVideos />} />
            <Route path="gifs" element={<AdminGifs />} />
            <Route path="images" element={<AdminImages />} />
            <Route path="pdfs" element={<AdminPdfs />} />
          </Route>
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
