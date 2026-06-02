'use client';

import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useSearch } from '@/hooks/useSearch';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface GlobalSearchModalProps {
  onClose: () => void;
}

const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const { data, isLoading } = useSearch(query);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSelectResult = (link: string) => {
    router.push(link);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
      <div className="w-full max-w-2xl mx-4">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg overflow-hidden">
          {/* Search Input */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <Search size={20} className="text-slate-400" />
              <input
                aria-label="Search students, teachers, and batches"
                type="text"
                placeholder="Search students, teachers, batches..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 outline-none text-lg"
              />
              <button
                type="button"
                aria-label="Close search"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                Searching...
              </div>
            ) : data?.results && data.results.length > 0 ? (
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {data.results.map((result) => (
                  <button
                    type="button"
                    key={result.id}
                    aria-label={`Open ${result.name}`}
                    onClick={() => handleSelectResult(result.link)}
                    className="w-full p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {result.name}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">
                        {result.type}
                      </p>
                    </div>
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded capitalize">
                      {result.type}
                    </span>
                  </button>
                ))}
              </div>
            ) : query.length > 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                No results found for "{query}"
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                Start typing to search...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;
