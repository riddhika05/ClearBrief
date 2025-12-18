import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DataProvider } from "@/context/DataContext";
import { ThemeProvider } from "@/context/ThemeContext";

// Pages
import LoginPage from "./pages/LoginPage";
import ProjectsPage from "./pages/ProjectsPage";
import SettingsPage from "./pages/SettingsPage";

// Project Pages
import { ProjectLayout } from "./components/layouts/ProjectLayout";
import ProjectOverview from "./pages/project/ProjectOverview";
import IngestPage from "./pages/project/IngestPage";
import VerificationPage from "./pages/project/VerificationPage";
import KnowledgeGraphPage from "./pages/project/KnowledgeGraphPage";
import TimelineMapPage from "./pages/project/TimelineMapPage";
import SpotrepPage from "./pages/project/SpotrepPage";
import ChatPage from "./pages/project/ChatPage";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <DataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              
              {/* Project Routes */}
              <Route path="/projects/:projectId" element={<ProjectLayout />}>
                <Route index element={<Navigate to="overview" replace />} />
                <Route path="overview" element={<ProjectOverview />} />
                <Route path="ingest" element={<IngestPage />} />
                <Route path="verification" element={<VerificationPage />} />
                <Route path="knowledge-graph" element={<KnowledgeGraphPage />} />
                <Route path="timeline-map" element={<TimelineMapPage />} />
                <Route path="spotrep" element={<SpotrepPage />} />
                <Route path="chat" element={<ChatPage />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </DataProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
