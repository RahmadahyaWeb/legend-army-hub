import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { auth } from "./lib/firebase";

import AppLayout from "./layouts/AppLayout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PublicDashboard from "./pages/PublicDashboard";
import Members from "./pages/Members";
import GuildLeagues from "./pages/GuildLeagues";
import GuildLeagueDetail from "./pages/GuildLeagueDetail";
import PublicRoster from "./pages/PublicRoster";
import Attendance from "./pages/Attendance";
import Strategy from "./pages/Strategy";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <div className="flex size-11 items-center justify-center rounded-xl bg-red-700">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5 text-white"
            >
              <path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3z" />
            </svg>
          </div>

          <div className="size-5 animate-spin rounded-full border-2 border-zinc-300 border-t-red-700" />
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<PublicDashboard />} />

        <Route path="/roster/:guildLeagueId" element={<PublicRoster />} />

        <Route
          path="/login"
          element={user ? <Navigate to="/admin" replace /> : <Login />}
        />

        {/* ADMIN */}
        <Route
          element={user ? <AppLayout /> : <Navigate to="/login" replace />}
        >
          <Route path="/admin" element={<Dashboard />} />

          <Route path="/admin/members" element={<Members />} />

          <Route path="/admin/guild-leagues" element={<GuildLeagues />} />

          <Route
            path="/admin/guild-leagues/:guildLeagueId"
            element={<GuildLeagueDetail />}
          />

          <Route path="/admin/strategy" element={<Strategy />} />

          <Route path="/admin/attendance" element={<Attendance />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
