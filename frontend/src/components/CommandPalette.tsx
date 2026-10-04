import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface Command {
  id: string;
  title: string;
  category: 'Navigation' | 'Creation' | 'Search' | 'Recent';
  action: () => void;
  icon?: React.ReactNode;
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentCourses, setRecentCourses] = useState<any[]>([]);

  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch recent courses when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      api.get('/courses').then((res) => {
        setRecentCourses(res.data.data.slice(0, 5));
      }).catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isOpen]);

  const executeCommand = (cmd: Command) => {
    cmd.action();
    setIsOpen(false);
  };

  const defaultCommands: Command[] = [
    {
      id: 'nav-dashboard',
      title: 'Go to Dashboard',
      category: 'Navigation',
      action: () => navigate('/dashboard'),
    },
    {
      id: 'nav-subjects',
      title: 'Go to Subjects',
      category: 'Navigation',
      action: () => navigate('/subjects'),
    },
    {
      id: 'nav-timetable',
      title: 'Go to Timetable',
      category: 'Navigation',
      action: () => navigate('/timetable'),
    },
    {
      id: 'nav-attendance',
      title: 'Go to Attendance',
      category: 'Navigation',
      action: () => navigate('/attendance'),
    },
    {
      id: 'nav-assignments',
      title: 'Go to Assignments',
      category: 'Navigation',
      action: () => navigate('/assignments'),
    },
    {
      id: 'nav-grades',
      title: 'Go to Gradebook',
      category: 'Navigation',
      action: () => navigate('/grades'),
    },
    {
      id: 'nav-settings',
      title: 'Go to Settings',
      category: 'Navigation',
      action: () => navigate('/settings'),
    },
  ];

  const courseCommands: Command[] = recentCourses.map((c) => ({
    id: `course-${c._id}`,
    title: `Open ${c.name} (${c.courseCode || ''})`,
    category: 'Recent',
    action: () => navigate(`/subjects/${c._id}`),
  }));

  const allCommands = [...defaultCommands, ...courseCommands];

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return allCommands;
    const q = query.toLowerCase();
    return allCommands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q)
    );
  }, [allCommands, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredCommands.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredCommands.length - 1
      );
    } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
      e.preventDefault();
      executeCommand(filteredCommands[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-surface-border dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        <div className="flex items-center px-4 border-b border-surface-border dark:border-slate-800">
          <span className="text-ink-faint">🔍</span>
          <input
            ref={inputRef}
            autoFocus
            type="text"
            placeholder="Type a command or search courses..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-4 text-sm bg-transparent border-0 outline-none text-ink dark:text-slate-100 placeholder-ink-faint"
          />
          <kbd className="px-2 py-0.5 text-[10px] font-mono text-ink-faint bg-surface-muted dark:bg-slate-800 rounded">
            ESC
          </kbd>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="p-4 text-center text-xs text-ink-faint">
              No matching commands found.
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => (
              <button
                key={cmd.id}
                onClick={() => executeCommand(cmd)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs text-left transition-colors ${
                  idx === selectedIndex
                    ? 'bg-neutral-900 text-white font-semibold shadow-xs'
                    : 'text-ink dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{cmd.title}</span>
                <span className="text-[10px] text-ink-faint uppercase font-medium">
                  {cmd.category}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
