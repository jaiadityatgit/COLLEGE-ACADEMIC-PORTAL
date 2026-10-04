import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { Button } from "../components/ui/Button";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    try {
      await login({ email, password });
      navigate("/home");
    } catch {
      // Handled by store state
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center surface-page px-4 relative">
      {/* Subtle calm ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-slate-200/40 dark:bg-neutral-800/40 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-[400px] w-full animate-fade-in">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center mx-auto mb-4 shadow-xs">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Academic Portal
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Sign in to access courses, attendance, and academic records
          </p>
        </div>

        {/* Card */}
        <div className="card shadow-card p-8">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 dark:bg-rose-500/[0.08] text-rose-700 dark:text-rose-400 text-sm rounded-xl flex items-center justify-between font-medium">
              <span>{error}</span>
              <button
                onClick={clearError}
                className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 font-bold ml-2 transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input h-11 text-sm"
                placeholder="you@college.edu"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input h-11 text-sm"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-1">
              <Button
                id="login-submit"
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full h-11"
              >
                Sign in
              </Button>
            </div>
          </form>
        </div>

        <p className="text-center mt-6 text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
          Contact your department office for portal credentials
        </p>
      </div>
    </div>
  );
}
