import { AuthProvider } from "@/hooks/use-auth";
import { useAuth } from "@/hooks/use-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/use-theme";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import OAuthConsent from "./pages/OAuthConsent.tsx";
import PWAInstallPrompt from "./components/envle/PWAInstallPrompt";

const queryClient = new QueryClient();

const AuthRoute = () => {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="h-screen grid place-items-center bg-background text-envle-text-muted">Chargement...</div>;
  if (user && profile && !profile.profile_completed) return <Navigate to="/profile" replace />;
  if (user) return <Navigate to="/app" replace />;
  return <Index authOnly />;
};

const ProtectedRoute = ({ profileOnly = false }: { profileOnly?: boolean }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="h-screen grid place-items-center bg-background text-envle-text-muted">Chargement...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (!profileOnly && profile && !profile.profile_completed) return <Navigate to="/profile" replace />;
  return <Index initialNav={profileOnly ? "settings" : "chat"} forceProfile={profileOnly} />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/app" replace />} />
            <Route path="/login" element={<AuthRoute />} />
            <Route path="/signup" element={<AuthRoute />} />
            <Route path="/profile" element={<ProtectedRoute profileOnly />} />
            <Route path="/app" element={<ProtectedRoute />} />
            <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <PWAInstallPrompt />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
