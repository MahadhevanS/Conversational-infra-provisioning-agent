// import React from "react";
// import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

// import LandingPage from "./components/LandingPage";
// import ConsoleLayout from "./components/ConsoleLayout";
// import SignIn from "./pages/SignIn";
// import SignUp from "./pages/SignUp";

// import { isLoggedIn, logoutLocal } from "./authLocal"; // ✅ changed
// import "./App.css";

// /* Protected Landing Page */
// function Home() {
//   const navigate = useNavigate();

//   if (!isLoggedIn()) {
//     return <Navigate to="/signin" replace />;
//   }

//   return (
//     <div className="min-h-screen bg-[#050505] text-white">
//       <LandingPage onStart={() => navigate("/console")} />
//     </div>
//   );
// }

// /* Protected Console */
// function ConsolePage() {
//   if (!isLoggedIn()) {
//     return <Navigate to="/signin" replace />;
//   }

//   return <ConsoleLayout />;
// }

// /* Logout */
// function Logout() {
//   logoutLocal();
//   return <Navigate to="/signin" replace />;
// }

// export default function App() {
//   return (
//     <Routes>
//       {/* default → login first */}
//       <Route path="/" element={<Navigate to="/signin" replace />} />

//       <Route path="/signin" element={<SignIn />} />
//       <Route path="/signup" element={<SignUp />} />

//       <Route path="/home" element={<Home />} />
//       <Route path="/console" element={<ConsolePage />} />
//       <Route path="/logout" element={<Logout />} />

//       {/* fallback */}
//       <Route path="*" element={<Navigate to="/signin" replace />} />
//     </Routes>
//   );
// }

import React from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import LandingPage from "./components/LandingPage";
import ConsoleLayout from "./components/ConsoleLayout";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";

import { getAuthToken, clearAuthToken } from "./utils/api";
import "./App.css";

/* ---------------- AUTH CHECK ---------------- */

function isLoggedIn() {
  return !!getAuthToken();
}

/* ---------------- Protected Landing Page ---------------- */

function Home() {
  const navigate = useNavigate();

  if (!isLoggedIn()) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <LandingPage onStart={() => navigate("/console")} />
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
  return <Navigate to="/signin" replace />;
}

/* ---------------- APP ROUTES ---------------- */

export default function App() {
  return (
    <Routes>
      {/* default route */}
      <Route path="/" element={<Navigate to="/signin" replace />} />

      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />

      <Route path="/home" element={<Home />} />
      <Route path="/console" element={<ConsolePage />} />
      <Route path="/logout" element={<Logout />} />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/signin" replace />} />
    </Routes>
  );
}