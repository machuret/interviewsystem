"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Spinner from "./_components/Spinner";

const DashboardTab  = dynamic(() => import("./_components/DashboardTab"),  { loading: () => <Spinner /> });
const CandidatesTab = dynamic(() => import("./_components/CandidatesTab"), { loading: () => <Spinner /> });
const AnalyticsTab  = dynamic(() => import("./_components/AnalyticsTab"),  { loading: () => <Spinner /> });
const CategoriesTab = dynamic(() => import("./_components/CategoriesTab"), { loading: () => <Spinner /> });
const QuestionsTab  = dynamic(() => import("./_components/QuestionsTab"),  { loading: () => <Spinner /> });
const JobsTab       = dynamic(() => import("./_components/JobsTab"),       { loading: () => <Spinner /> });

type Tab = "dashboard" | "candidates" | "analytics" | "categories" | "questions" | "jobs";
const TABS: Tab[] = ["dashboard", "candidates", "analytics", "categories", "questions", "jobs"];

export default function AdminPage() {
  const [authed, setAuthed]         = useState<boolean | null>(null);
  const [password, setPassword]     = useState("");
  const [loginError, setLoginError] = useState("");
  const [logging, setLogging]       = useState(false);
  const [tab, setTab]               = useState<Tab>("dashboard");

  useEffect(() => {
    fetch("/api/admin/candidates?_check=1")
      .then((r) => setAuthed(r.status !== 401))
      .catch(() => setAuthed(false));
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLogging(true);
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) setAuthed(true);
    else setLoginError("Incorrect password.");
    setLogging(false);
  }

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    setAuthed(false);
  }

  if (authed === null) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="w-4 h-4 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="max-w-sm mx-auto px-4 py-24">
        <h1 className="text-fluid-title font-bold text-white mb-6 text-center">Admin Login</h1>
        {loginError && <p className="text-red-400 text-sm mb-4 text-center">{loginError}</p>}
        <form onSubmit={login} className="space-y-4">
          <div>
            <label>Password</label>
            <input
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
            />
          </div>
          <button
            type="submit"
            disabled={logging}
            className="btn-primary w-full disabled:opacity-60 font-bold py-3"
          >
            {logging ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-fluid-title font-bold text-white">RapidTal Admin</h1>
        <button
          onClick={logout}
          className="text-brand-text-muted hover:text-red-400 text-sm px-4 py-2 rounded-lg transition-colors duration-150"
        >
          Logout
        </button>
      </div>

      <div className="flex gap-1 mb-8 card p-1 w-fit flex-wrap">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 capitalize ${
              tab === t
                ? "bg-brand-orange text-white"
                : "text-[#666680] hover:text-white hover:bg-[#1e1e1e]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "dashboard"  && <DashboardTab />}
      {tab === "candidates" && <CandidatesTab />}
      {tab === "analytics"  && <AnalyticsTab />}
      {tab === "categories" && <CategoriesTab />}
      {tab === "questions"  && <QuestionsTab />}
      {tab === "jobs"       && <JobsTab />}
    </div>
  );
}
