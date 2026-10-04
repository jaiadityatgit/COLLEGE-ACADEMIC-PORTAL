import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { searchService, SearchResult } from "../../services/search";
import { Badge } from "../ui/Badge";

interface GlobalSearchModalProps {
  onClose: () => void;
}

export default function GlobalSearchModal({ onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length > 2) {
        performSearch(query.trim());
      } else {
        setResults([]);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    setError("");
    try {
      const data = await searchService.globalSearch(searchQuery);
      setResults(data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to search workspace");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.id) {
      navigate(`/subjects/${result.id}`);
    } else {
      navigate(`/subjects`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 pb-8 px-4 sm:px-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Modal panel */}
      <div className="relative w-full max-w-2xl surface-card rounded-2xl shadow-overlay overflow-hidden border border-gray-200/60 dark:border-white/[0.06] flex flex-col max-h-[80vh] animate-scale-in">
        {/* Search Input Box */}
        <div className="flex items-center px-4 py-3.5 border-b border-gray-100 dark:border-white/[0.04] gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 dark:text-gray-500 shrink-0">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white text-base placeholder-gray-400 dark:placeholder-gray-500 font-medium"
            placeholder="Search course materials, subjects, announcements..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {isLoading && (
            <div className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin shrink-0" />
          )}
          <button onClick={onClose} className="text-2xs font-mono text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/[0.06] shrink-0">
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2">
          {error && <p className="text-rose-500 text-xs text-center py-6 font-medium">{error}</p>}
          {!isLoading && query.trim().length > 2 && results.length === 0 && !error && (
            <p className="text-gray-400 text-xs text-center py-8">No results found for "{query}"</p>
          )}
          {!isLoading && query.trim().length <= 2 && (
            <p className="text-gray-400 text-xs text-center py-8">Type at least 3 characters to search</p>
          )}

          <div className="space-y-1">
            {results.map((result) => (
              <button
                key={result.id}
                onClick={() => handleResultClick(result)}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors group flex flex-col"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="info" size="sm">
                    {result.notebookName}
                  </Badge>
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {result.sourceName} · Page {result.page}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 leading-relaxed">
                  {result.snippet}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-100 dark:border-white/[0.04] flex items-center justify-between text-2xs text-gray-400 dark:text-gray-500 font-mono">
          <span>Search Portal</span>
          <span>{results.length} results</span>
        </div>
      </div>
    </div>
  );
}
