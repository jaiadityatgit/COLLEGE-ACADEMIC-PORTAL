import React, { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import api from "../../services/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("profile");

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: "", text: "" });
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("theme") === "dark" || document.documentElement.classList.contains("dark");
  });
  const [emailNotifications, setEmailNotifications] = useState<boolean>(() => {
    return localStorage.getItem("email_notifications") !== "false";
  });

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const toggleEmailNotifications = () => {
    const next = !emailNotifications;
    setEmailNotifications(next);
    localStorage.setItem("email_notifications", String(next));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg({ type: "", text: "" });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match." });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await api.patch("/users/password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordMsg({ type: "success", text: "Password updated successfully." });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.response?.data?.error || "Failed to update password." });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[900px] mx-auto px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your account and interface preferences</p>
        </div>

        <Card padding="none" className="flex flex-col md:flex-row min-h-[500px] overflow-hidden">
          {/* Sidebar */}
          <div className="w-full md:w-56 border-b md:border-b-0 md:border-r border-slate-100 dark:border-white/[0.04] p-3 space-y-1">
            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === "profile"
                  ? "bg-neutral-900 text-white font-semibold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab("password")}
              className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === "password"
                  ? "bg-neutral-900 text-white font-semibold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
              }`}
            >
              Security
            </button>
            <button
              onClick={() => setActiveTab("preferences")}
              className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === "preferences"
                  ? "bg-neutral-900 text-white font-semibold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
              }`}
            >
              Preferences
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 md:p-8">
            {activeTab === "profile" && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Profile Information</h2>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center text-lg font-bold text-white shadow-xs">
                    {user?.name?.substring(0, 2).toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{user?.email}</p>
                    <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 capitalize">
                      {user?.role}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-white/[0.04] space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Full Name</label>
                    <input type="text" readOnly value={user?.name || ""} className="input bg-gray-50 dark:bg-white/[0.02] cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Email Address</label>
                    <input type="email" readOnly value={user?.email || ""} className="input bg-gray-50 dark:bg-white/[0.02] cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Role</label>
                    <input type="text" readOnly value={user?.role || ""} className="input bg-gray-50 dark:bg-white/[0.02] cursor-not-allowed capitalize" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "password" && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md animate-fade-in">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Security Settings</h2>
                {passwordMsg.text && (
                  <div className={`p-3 rounded-lg text-xs font-medium ${passwordMsg.type === "error" ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600" : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600"}`}>
                    {passwordMsg.text}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="pt-2">
                  <Button type="submit" variant="primary" size="sm" isLoading={isUpdatingPassword}>
                    Update password
                  </Button>
                </div>
              </form>
            )}

            {activeTab === "preferences" && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Interface Preferences</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Dark Mode</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Toggle theme appearance</p>
                    </div>
                    <button
                      onClick={toggleDarkMode}
                      className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${darkMode ? "bg-neutral-900" : "bg-gray-200 dark:bg-white/10"}`}
                    >
                      <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform duration-200 ${darkMode ? "left-6" : "left-1"}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/[0.04]">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Email Notifications</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Receive academic digest updates</p>
                    </div>
                    <button
                      onClick={toggleEmailNotifications}
                      className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${emailNotifications ? "bg-neutral-900" : "bg-gray-200 dark:bg-white/10"}`}
                    >
                      <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform duration-200 ${emailNotifications ? "left-6" : "left-1"}`} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
