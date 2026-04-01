import React from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import LandingPage from "./components/LandingPage";
import ConsoleLayout from "./components/ConsoleLayout";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import AcceptInvite from './pages/AcceptInvite';
import ApproveDestroy from "./pages/ApproveDestroy";
import { getAuthToken, clearAuthToken } from "./utils/api";

// import { validateSession, clearAuthToken } from "./utils/api";
import "./App.css";

/* ---------------- AUTH CHECK ---------------- */
function isLoggedIn() {
  return !!getAuthToken();
}

/* ---------------- Public Landing Page ---------------- */

function PublicLanding() {
  const navigate = useNavigate();

  // 🔥 Smart Routing: If they are logged in, send to console. If not, send to sign in.
  const handleStart = () => {
    if (isLoggedIn()) {
      navigate("/console");
    } else {
      navigate("/signin");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <LandingPage onStart={handleStart} />
    </div>
  );
}

/* ---------------- Protected Console ---------------- */

function ConsolePage() {
  if (!isLoggedIn()) {
    return <Navigate to="/signin" replace />;
  }

  return <ConsoleLayout />;
}

/* ---------------- Logout ---------------- */

function Logout() {
  clearAuthToken();
  // 🔥 Redirect to the beautiful public landing page when they log out
  return <Navigate to="/" replace />; 
}

/* ---------------- APP ROUTES ---------------- */

export default function App() {
  return (
    <Routes>
      {/* 🔥 Default route is now the Public Landing Page! */}
      <Route path="/" element={<PublicLanding />} />

      {/* Auth Routes */}
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />

      {/* Protected Routes */}
      <Route path="/console" element={<ConsolePage />} />
      <Route path="/logout" element={<Logout />} />

      {/* Fallback - catch-all bad URLs and send them home */}
      <Route path="*" element={<Navigate to="/" replace />} />

      <Route path="/join/:token" element={<AcceptInvite />} />
      <Route path="/approve-destroy/:token" element={<ApproveDestroy />} />
    </Routes>
  );
}