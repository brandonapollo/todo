import { useState, useEffect, useCallback } from 'react';
import { getGleanConfig, saveGleanConfig, searchGlean, type GleanResult } from '../api/glean';
import { useCreateTodo } from '../hooks/useTodos';

interface Props {
  onClose: () => void;
}

type ModalState = 'settings' | 'loading' | 'results' | 'error';

export default function GleanModal({ onClose }: Props) {
  const [modalState, setModalState] = useState<ModalState>('settings');
  const [instance, setInstance] = useState('');
  const [token, setToken] = useState('');
  const [maskedToken, setMaskedToken] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [results, setResults] = useState<GleanResult[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const createTodo = useCreateTodo();

  const runSearch = useCallback(async () => {
    setModalState('loading');
    try {
      const data = await searchGlean();
      setResults(data);
      setSelected(new Set());
      setModalState('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setModalState('error');
    }
  }, []);

  useEffect(() => {
    getGleanConfig().then((config) => {
      if (config.instance) setInstance(config.instance);
      if (config.userName) setUserName(config.userName);
      if (config.maskedToken) setMaskedToken(config.maskedToken);
      if (config.instance && config.maskedToken) {
        runSearch();
      }
    }).catch(() => {});
  }, [runSearch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSaveAndSearch = useCallback(async () => {
    if (!instance.trim()) return;
    if (!token.trim() && !maskedToken) return; // no token at all
    try {
      const newToken = token.trim() && token.trim() !== maskedToken ? token.trim() : undefined;
      await saveGleanConfig(instance.trim(), newToken, userName.trim() || undefined);
      runSearch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save config');
      setModalState('error');
    }
  }, [instance, token, userName, runSearch]);

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddToToday = () => {
    const toAdd = results.filter((r) => selected.has(r.id));
    for (const item of toAdd) {
      createTodo.mutate(item.snippet || item.title);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Settings state */}
        {modalState === 'settings' && (
          <>
            <h3 className="text-sm font-medium text-gray-700 mb-4">Glean Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Glean instance name</label>
                <input
                  type="text"
                  value={instance}
                  onChange={(e) => setInstance(e.target.value)}
                  placeholder="e.g. mycompany"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 text-gray-700"
                />
                <p className="text-xs text-gray-400 mt-1">
                  The subdomain of your Glean URL — if you access Glean at <span className="font-medium">mycompany</span>.glean.com, enter <span className="font-medium">mycompany</span>.
                </p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">API token</label>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder={maskedToken ?? 'Bearer token'}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 text-gray-700"
                />
                {maskedToken && !token && (
                  <p className="text-xs text-gray-400 mt-1">Leave blank to keep existing token</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Your name in Slack <span className="text-gray-300">(optional — improves results)</span>
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. Brandon Renfrow"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 text-gray-700"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-sm rounded-lg text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAndSearch}
                disabled={!instance.trim() || (!token.trim() && !maskedToken)}
                className="px-3 py-1.5 text-sm rounded-lg bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Save & Search
              </button>
            </div>
          </>
        )}

        {/* Loading state */}
        {modalState === 'loading' && (
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2.5 h-2.5 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2.5 h-2.5 bg-sky-400 rounded-full animate-bounce" />
            </div>
            <p className="text-sm text-gray-500">Searching Slack...</p>
          </div>
        )}

        {/* Error state */}
        {modalState === 'error' && (
          <>
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalState('settings')}
                className="px-3 py-1.5 text-sm rounded-lg text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Back to settings
              </button>
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-sm rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </>
        )}

        {/* Results state */}
        {modalState === 'results' && (
          <>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">
                {results.length === 0 ? 'No results found' : `${results.length} Slack message${results.length !== 1 ? 's' : ''}`}
              </h3>
              <button
                onClick={() => setModalState('settings')}
                title="Settings"
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </button>
            </div>

            {results.length > 0 && (
              <ul className="space-y-2 max-h-72 overflow-y-auto mb-4 pr-1">
                {results.map((r) => (
                  <li key={r.id}>
                    <label className="flex items-start gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selected.has(r.id)}
                        onChange={() => toggleSelected(r.id)}
                        className="mt-0.5 shrink-0 accent-sky-500"
                      />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-800 leading-snug line-clamp-2">
                          {r.snippet || r.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {r.author && (
                            <span className="text-xs text-gray-400">{r.author}</span>
                          )}
                          {r.url && (
                            <a
                              href={r.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-sky-400 hover:text-sky-600"
                            >
                              ↗
                            </a>
                          )}
                        </div>
                      </div>
                    </label>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-sm rounded-lg text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              {results.length > 0 && (
                <button
                  onClick={handleAddToToday}
                  disabled={selected.size === 0}
                  className="px-3 py-1.5 text-sm rounded-lg bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Add {selected.size > 0 ? selected.size : ''} selected to today
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
