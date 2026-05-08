import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider, useAuth } from "./lib/auth";

import Login from "./pages/Login";
import Register from "./pages/Register";
import AuthCallback from "./pages/AuthCallback";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import NewTeam from "./pages/NewTeam";
import Roster from "./pages/Roster";
import Lineup from "./pages/Lineup";
import Schedule from "./pages/Schedule";
import Matches from "./pages/Matches";
import MatchDetail from "./pages/MatchDetail";
import Results from "./pages/Results";
import Communications from "./pages/Communications";
import Announcements from "./pages/Announcements";
import Attendance from "./pages/Attendance";
import Gallery from "./pages/Gallery";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Summaries from "./pages/Summaries";

const Protected = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function Router() {
  const location = useLocation();
  if (location.hash?.includes("session_id=")) return <AuthCallback />;
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/teams/new" element={<NewTeam />} />
        <Route path="/roster" element={<Roster />} />
        <Route path="/lineup" element={<Lineup />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/matches/:id" element={<MatchDetail />} />
        <Route path="/results" element={<Results />} />
        <Route path="/communications" element={<Communications />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/summaries" element={<Summaries />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Router />
        <Toaster richColors position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
