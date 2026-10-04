import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import api from "../../services/api";
import GlobalSearchModal from "../search/GlobalSearchModal";

function Icon({ children, size = 18 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const Icons = {
  dashboard: <Icon><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" /><path d="M9 21V12h6v9" /></Icon>,
  subjects: <Icon><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></Icon>,
  timetable: <Icon><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></Icon>,
  attendance: <Icon><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></Icon>,
  assignments: <Icon><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 14l2 2 4-4" /></Icon>,
  grades: <Icon><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></Icon>,
  exams: <Icon><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></Icon>,
  announcements: <Icon><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></Icon>,
  calendar: <Icon><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><circle cx="12" cy="15" r="1" /></Icon>,
  settings: <Icon><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" /></Icon>,
  search: <Icon><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></Icon>,
  logout: <Icon size={16}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></Icon>,
  faculty: <Icon><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></Icon>,
  labs: <Icon><path d="M10 2v7.31" /><path d="M14 9.3V2" /><path d="M8.5 2h7" /><path d="M14 9.3a6.5 6.5 0 11-4 0" /></Icon>,
  reports: <Icon><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></Icon>,
  users: <Icon><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></Icon>,
  departments: <Icon><path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" /><path d="M9 9h.01" /><path d="M9 13h.01" /><path d="M9 17h.01" /></Icon>,
  analytics: <Icon><path d="M21.21 15.89A10 10 0 118 2.83" /><path d="M22 12A10 10 0 0012 2v10z" /></Icon>,
  students: <Icon><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" /></Icon>,
  marks: <Icon><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></Icon>,
  semesters: <Icon><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" /></Icon>,
  menu: <Icon><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="18" x2="20" y2="18" /></Icon>,
  chevronLeft: <Icon size={16}><polyline points="15 18 9 12 15 6" /></Icon>,
  chevronRight: <Icon size={16}><polyline points="9 18 15 12 9 6" /></Icon>,
  chevronDown: <Icon size={14}><polyline points="6 9 12 15 18 9" /></Icon>,
  sun: <Icon size={16}><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></Icon>,
  moon: <Icon size={16}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></Icon>,
  approvals: <Icon><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 14l2 2 4-4" /></Icon>,
};

interface NavConfig {
  to: string;
  label: string;
  icon: React.ReactNode;
  section?: string;
}

const sectionLabels: Record<string, string> = {
  main: "Navigation",
  academic: "Academic",
  admin: "Management",
};

function getNavItems(role: string): NavConfig[] {
  switch (role) {
    case "student":
      return [
        { to: "/dashboard", label: "Dashboard", icon: Icons.dashboard, section: "main" },
        { to: "/subjects", label: "Subjects", icon: Icons.subjects, section: "main" },
        { to: "/timetable", label: "Timetable", icon: Icons.timetable, section: "academic" },
        { to: "/attendance", label: "Attendance", icon: Icons.attendance, section: "academic" },
        { to: "/assignments", label: "Assignments", icon: Icons.assignments, section: "academic" },
        { to: "/grades", label: "Grades", icon: Icons.grades, section: "academic" },
        { to: "/exams", label: "Exams", icon: Icons.exams, section: "academic" },
        { to: "/calendar", label: "Calendar", icon: Icons.calendar, section: "other" },
        { to: "/announcements", label: "Announcements", icon: Icons.announcements, section: "other" },
        { to: "/settings", label: "Settings", icon: Icons.settings, section: "other" },
      ];
    case "faculty":
      return [
        { to: "/faculty/dashboard", label: "Dashboard", icon: Icons.dashboard, section: "main" },
        { to: "/faculty/subjects", label: "My Subjects", icon: Icons.subjects, section: "main" },
        { to: "/faculty/students", label: "Students", icon: Icons.students, section: "academic" },
        { to: "/faculty/attendance", label: "Attendance", icon: Icons.attendance, section: "academic" },
        { to: "/timetable", label: "Timetable", icon: Icons.timetable, section: "academic" },
        { to: "/announcements", label: "Announcements", icon: Icons.announcements, section: "other" },
        { to: "/settings", label: "Settings", icon: Icons.settings, section: "other" },
      ];
    case "hod":
    case "department_admin":
      return [
        { to: "/hod/dashboard", label: "Dashboard", icon: Icons.dashboard, section: "main" },
        { to: "/hod/faculty", label: "Faculty Directory", icon: Icons.faculty, section: "main" },
        { to: "/hod/students", label: "Student Analytics", icon: Icons.students, section: "academic" },
        { to: "/hod/courses", label: "Course Analytics", icon: Icons.subjects, section: "academic" },
        { to: "/hod/labs", label: "Lab Management", icon: Icons.labs, section: "academic" },
        { to: "/timetable", label: "Timetable", icon: Icons.timetable, section: "academic" },
        { to: "/announcements", label: "Announcements", icon: Icons.announcements, section: "other" },
        { to: "/hod/approvals", label: "Approval Center", icon: Icons.approvals, section: "other" },
        { to: "/hod/reports", label: "Report Center", icon: Icons.reports, section: "other" },
        { to: "/settings", label: "Settings", icon: Icons.settings, section: "other" },
      ];
    case "college_admin":
    case "super_admin":
      return [
        { to: "/admin", label: "Dashboard", icon: Icons.dashboard, section: "main" },
        { to: "/admin/users", label: "Users", icon: Icons.users, section: "main" },
        { to: "/admin/departments", label: "Departments", icon: Icons.departments, section: "main" },
        { to: "/admin/courses", label: "Courses", icon: Icons.subjects, section: "academic" },
        { to: "/admin/schedules", label: "Schedules", icon: Icons.timetable, section: "academic" },
        { to: "/admin/announcements", label: "Announcements", icon: Icons.announcements, section: "other" },
        { to: "/settings", label: "Settings", icon: Icons.settings, section: "other" },
      ];
    default:
      return [{ to: "/dashboard", label: "Dashboard", icon: Icons.dashboard }];
  }
}

function getRoleLabel(role: string): string {
  switch (role) {
    case "student": return "Student";
    case "faculty": return "Faculty";
    case "hod": return "Head of Department";
    case "department_admin": return "Department Admin";
    case "college_admin": return "Administrator";
    case "super_admin": return "Super Admin";
    default: return "User";
  }
}

function ThemeToggle() {
  const [isDark, setIsDark] = useState(() =>
    typeof window !== "undefined" && document.documentElement.classList.contains("dark")
  );

  const toggle = useCallback(() => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return (
    <button
      onClick={toggle}
      id="theme-toggle-btn"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all duration-150"
    >
      {isDark ? Icons.sun : Icons.moon}
    </button>
  );
}

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  createdAt: string;
}

function NotificationCenter() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchCount = async () => {
    try {
      const res = await api.get("/notifications");
      setUnreadCount(res.data.data?.unreadCount ?? 0);
    } catch { /* not fatal */ }
  };

  const handleOpen = async () => {
    if (open) { setOpen(false); return; }
    setOpen(true);
    setLoading(true);
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.data?.notifications ?? []);
      setUnreadCount(res.data.data?.unreadCount ?? 0);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  };

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch { /* silently fail */ }
  };

  const typeColors: Record<string, string> = {
    exam: "bg-amber-500",
    attendance: "bg-rose-500",
    grade: "bg-emerald-500",
    announcement: "bg-neutral-800 dark:bg-white",
    system: "bg-slate-400",
  };

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={handleOpen}
        id="notification-center-btn"
        title="Notifications"
        className="relative w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all duration-150"
      >
        {Icons.announcements}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white leading-none px-1 ring-2 ring-white dark:ring-[#1c202c]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl surface-card shadow-float z-50 animate-scale-in overflow-hidden border border-slate-200/70 dark:border-white/[0.06]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/[0.04]">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-slate-800 dark:text-slate-200 hover:underline font-semibold transition-colors">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <span className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 dark:border-white/20 dark:border-t-white rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center mx-auto mb-2.5 text-slate-400">
                  {Icons.announcements}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n._id} className={`px-4 py-3 border-b border-slate-100/60 dark:border-white/[0.03] last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors ${!n.isRead ? "bg-slate-50/80 dark:bg-white/[0.04]" : ""}`}>
                  <div className="flex items-start gap-2.5">
                    <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${typeColors[n.type] || typeColors.system}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{n.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                      <p className="text-2xs text-slate-400 dark:text-slate-500 mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function UserProfileMenu() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate("/login");
  };

  const initials = (user?.name || "?")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const roleLabel = getRoleLabel(user?.role || "student");

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        id="user-profile-menu-btn"
        className="flex items-center gap-2.5 px-2.5 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all duration-150"
      >
        <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0 shadow-xs">
          {initials}
        </div>
        <div className="hidden md:block text-left min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[120px]">{user?.name}</p>
          <p className="text-2xs text-slate-500 dark:text-slate-400 truncate">{roleLabel}</p>
        </div>
        <span className="hidden md:block text-slate-400 dark:text-slate-500">{Icons.chevronDown}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-60 rounded-2xl surface-card shadow-float z-50 animate-scale-in overflow-hidden border border-slate-200/70 dark:border-white/[0.06]">
          <div className="px-4 py-3.5 border-b border-slate-100 dark:border-white/[0.04]">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{user?.email}</p>
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-slate-100 dark:bg-white/[0.08] text-slate-800 dark:text-slate-200">
              {roleLabel}
            </span>
          </div>
          <div className="py-1.5">
            <button
              onClick={() => { navigate("/settings"); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
            >
              {Icons.settings}
              <span>Settings</span>
            </button>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/[0.06] transition-colors disabled:opacity-50"
            >
              {Icons.logout}
              <span>{loggingOut ? "Signing out…" : "Sign Out"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function HeaderClock() {
  const [timeStr, setTimeStr] = useState(() => {
    return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  });
  const [dateStr, setDateStr] = useState(() => {
    return new Date().toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setDateStr(now.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-100/70 dark:bg-white/[0.04] text-slate-500 dark:text-slate-400 text-2xs font-mono select-none">
      <span>📅 {dateStr}</span>
      <span className="text-slate-300 dark:text-slate-600">·</span>
      <span className="font-semibold text-slate-700 dark:text-slate-300">{timeStr}</span>
    </div>
  );
}


interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { user } = useAuthStore();
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Init theme from localStorage (default to light mode for the refined aesthetic)
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const navItems = getNavItems(user?.role || "student");

  const grouped = useMemo(() => {
    const groups: Record<string, typeof navItems> = {};
    for (const item of navItems) {
      const sec = item.section || "main";
      if (!groups[sec]) groups[sec] = [];
      groups[sec].push(item);
    }
    return groups;
  }, [navItems]);

  const sidebarContent = (
    <>
      {Object.entries(grouped || {}).map(([section, items]) => (
        <div key={section} className="mb-2">
          {sectionLabels[section] && !sidebarCollapsed && (
            <p className="px-3.5 pt-4 pb-1.5 text-2xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider select-none">
              {sectionLabels[section]}
            </p>
          )}
          {sectionLabels[section] && sidebarCollapsed && (
            <div className="mx-auto my-3 w-5 h-px bg-slate-200 dark:bg-white/[0.06]" />
          )}
          <div className="flex flex-col gap-1">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/dashboard" || item.to === "/admin" || item.to === "/faculty/dashboard" || item.to === "/hod/dashboard"}
                title={item.label}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 text-sm font-medium group select-none",
                    isActive
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-white/[0.04]",
                    sidebarCollapsed ? "justify-center px-2" : "",
                  ].join(" ")
                }
              >
                <span className="flex-shrink-0 opacity-90 group-hover:opacity-100 transition-opacity">{item.icon}</span>
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </>
  );

  const isStudent = (user?.role || "student") === "student";

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden surface-page font-sans">
      {/* ─── Top Header Bar ─── */}
      <header className="flex-shrink-0 h-14 border-b border-slate-100 dark:border-white/[0.06] surface-card flex items-center px-6 gap-3 z-30">
        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          id="mobile-menu-toggle-btn"
          aria-label="Toggle navigation menu"
          className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/[0.06] transition-all"
        >
          {Icons.menu}
        </button>

        {/* Institutional Brand */}
        <div className="flex items-center gap-3 mr-2">
          <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          <div className="hidden sm:block min-w-0">
            <h1 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
              COLLEGE ACADEMIC PORTAL
            </h1>
            <p className="text-2xs text-slate-500 dark:text-slate-400 leading-tight truncate font-medium">
              Dept. of Electronics & Communication Engineering
            </p>
          </div>
        </div>

        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          id="sidebar-collapse-btn"
          className="hidden lg:flex w-7 h-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-white/[0.06] transition-all ml-1"
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? Icons.chevronRight : Icons.chevronLeft}
        </button>

        <div className="flex-1" />

        {/* Live Clock (Reference Screenshot Header Feature) */}
        <HeaderClock />

        {/* Academic Year Context Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/90 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 text-2xs font-semibold border border-slate-200/60 dark:border-white/[0.06]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
          <span>Academic Year: 2026–2027</span>
        </div>

        {/* Search */}
        <button
          onClick={() => setIsSearchOpen(true)}
          id="global-search-btn"
          className="hidden md:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-100/80 dark:bg-white/[0.04] text-slate-400 dark:text-slate-500 text-xs hover:bg-slate-200/60 dark:hover:bg-white/[0.06] transition-all min-w-[200px] max-w-[280px] border border-transparent hover:border-slate-200/60 dark:hover:border-white/[0.06]"
        >
          <span className="flex-shrink-0 opacity-60">{Icons.search}</span>
          <span className="flex-1 text-left truncate">Search portal…</span>
          <kbd className="text-2xs bg-white dark:bg-white/[0.06] px-1.5 py-0.5 rounded-md font-mono text-slate-400 dark:text-slate-500 border border-slate-200/70 dark:border-white/[0.06]">⌘K</kbd>
        </button>

        <button
          onClick={() => setIsSearchOpen(true)}
          id="global-search-mobile-btn"
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/[0.06] transition-all"
        >
          {Icons.search}
        </button>

        <div className="w-px h-5 bg-slate-200/60 dark:bg-white/[0.06] mx-1" />

        <ThemeToggle />
        <NotificationCenter />
        <UserProfileMenu />
      </header>

      {/* ─── Main Body ─── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar */}
        <nav
          className={[
            "hidden lg:flex flex-col flex-shrink-0 border-r border-slate-100 dark:border-white/[0.04] surface-card transition-all duration-200 overflow-hidden",
            sidebarCollapsed ? "w-[60px]" : "w-[240px]",
          ].join(" ")}
        >
          <div className={`flex flex-col flex-1 overflow-y-auto py-3 ${sidebarCollapsed ? "px-1.5" : "px-3"} scrollbar-hide`}>
            {sidebarContent}
          </div>
        </nav>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <>
            <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
            <nav className="fixed left-0 top-14 bottom-0 w-[264px] surface-card border-r border-slate-200/70 dark:border-white/[0.06] z-50 lg:hidden overflow-y-auto py-3 px-3 animate-slide-left shadow-float">
              <div className="flex items-center justify-between px-3 pb-3 mb-2 border-b border-slate-100 dark:border-white/[0.04]">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Portal Menu</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  ✕
                </button>
              </div>
              {sidebarContent}
            </nav>
          </>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <main className={`flex-1 overflow-auto surface-page ${isStudent ? "pb-20 lg:pb-0" : "pb-16 lg:pb-0"}`}>
            {children}
          </main>
        </div>

        {/* ─── Mobile Bottom Navigation Bar ─── */}
        {isStudent && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 surface-card border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-around px-2 z-30 shadow-card">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                  isActive ? "text-neutral-900 dark:text-white font-semibold" : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                }`
              }
            >
              <span className="scale-90">{Icons.dashboard}</span>
              <span className="text-[10px] mt-0.5">Home</span>
            </NavLink>

            <NavLink
              to="/subjects"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                  isActive ? "text-neutral-900 dark:text-white font-semibold" : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                }`
              }
            >
              <span className="scale-90">{Icons.subjects}</span>
              <span className="text-[10px] mt-0.5">Courses</span>
            </NavLink>

            <NavLink
              to="/timetable"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                  isActive ? "text-neutral-900 dark:text-white font-semibold" : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                }`
              }
            >
              <span className="scale-90">{Icons.timetable}</span>
              <span className="text-[10px] mt-0.5">Schedule</span>
            </NavLink>

            <NavLink
              to="/attendance"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                  isActive ? "text-neutral-900 dark:text-white font-semibold" : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                }`
              }
            >
              <span className="scale-90">{Icons.attendance}</span>
              <span className="text-[10px] mt-0.5">Attendance</span>
            </NavLink>

            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 transition-colors"
            >
              <span className="scale-90">{Icons.menu}</span>
              <span className="text-[10px] mt-0.5">More</span>
            </button>
          </div>
        )}
      </div>

      {isSearchOpen && <GlobalSearchModal onClose={() => setIsSearchOpen(false)} />}
    </div>
  );
}
