import { useState, useEffect, useCallback } from 'react'
import { Table, LayoutGrid, RefreshCw, Loader2 } from 'lucide-react'
import { fetchServers } from './lib/fetchServers'
import { PORTS_TO_SCAN, getNetworkHost } from './config'
import { ServerTable } from './components/ServerTable'
import { ServerCards } from './components/ServerCards'
import './App.css'

const VIEW_TABLE = 'table'
const VIEW_CARDS = 'cards'
const REFRESH_INTERVAL_MS = 5000

function mergeServerLists(prev, newList) {
  if (!prev.length) return newList.map((s) => ({ ...s, _entering: true }))
  const currentIds = new Set(prev.map((s) => s.id))
  const newIds = new Set(newList.map((s) => s.id))
  const kept = newList.filter((s) => currentIds.has(s.id))
  const added = newList.filter((s) => !currentIds.has(s.id)).map((s) => ({ ...s, _entering: true }))
  const removed = prev.filter((s) => !newIds.has(s.id)).map((s) => ({ ...s, _exiting: true }))
  const keptAndAdded = [...kept, ...added].sort((a, b) => {
    if (a.isDev !== b.isDev) return a.isDev ? -1 : 1
    return (a.port ?? 0) - (b.port ?? 0)
  })
  return [...keptAndAdded, ...removed]
}

function App() {
  const [view, setView] = useState(VIEW_TABLE)
  const [servers, setServers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const runScan = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const found = await fetchServers()
      setServers(found)
    } catch (e) {
      setError(e?.message || 'Failed to load server list.')
      setServers([])
    } finally {
      setLoading(false)
    }
  }, [])

  const mergeNewServers = useCallback((newList) => {
    setServers((prev) => mergeServerLists(prev, newList))
  }, [])

  const handleExited = useCallback((id) => {
    setServers((prev) => prev.filter((s) => s.id !== id))
  }, [])

  useEffect(() => {
    runScan()
  }, [runScan])

  useEffect(() => {
    const id = setInterval(() => {
      fetchServers()
        .then(mergeNewServers)
        .catch(() => {})
    }, REFRESH_INTERVAL_MS)
    return () => clearInterval(id)
  }, [mergeNewServers])

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title-row">
          <h1 className="app-title">Localhost servers</h1>
          <a
            href={
              typeof window !== 'undefined'
                ? `${window.location.protocol}//${getNetworkHost()}${window.location.port ? `:${window.location.port}` : ''}`
                : '#'
            }
            target="_blank"
            rel="noopener noreferrer"
            className="app-self-link"
            title="This monitor"
          >
            {typeof window !== 'undefined'
              ? `${getNetworkHost()}${window.location.port ? `:${window.location.port}` : ''}`
              : '192.168.1.143:5173'}
          </a>
        </div>
        <div className="app-header-actions">
          <button
            type="button"
            className="refresh-btn"
            onClick={runScan}
            disabled={loading}
            title="Rescan ports"
            aria-label="Refresh server list"
          >
            {loading ? (
              <Loader2 size={20} className="spin" aria-hidden />
            ) : (
              <RefreshCw size={20} aria-hidden />
            )}
            <span>{loading ? 'Scanning…' : 'Refresh'}</span>
          </button>
          <div className="view-toggle" role="tablist" aria-label="View mode">
            <button
              type="button"
              role="tab"
              aria-selected={view === VIEW_TABLE}
              aria-controls="server-content"
              id="tab-table"
              className={`view-toggle-btn ${view === VIEW_TABLE ? 'active' : ''}`}
              onClick={() => setView(VIEW_TABLE)}
            >
              <Table size={20} aria-hidden />
              <span>Table</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === VIEW_CARDS}
              aria-controls="server-content"
              id="tab-cards"
              className={`view-toggle-btn ${view === VIEW_CARDS ? 'active' : ''}`}
              onClick={() => setView(VIEW_CARDS)}
            >
              <LayoutGrid size={20} aria-hidden />
              <span>Cards</span>
            </button>
          </div>
        </div>
      </header>

      <main id="server-content" className="app-main" role="tabpanel">
        {error && (
          <div className="app-message app-message-error" role="alert">
            {error}
          </div>
        )}
        {!error && loading && servers.length === 0 && (
          <div className="app-message app-message-loading">
            <Loader2 size={32} className="spin" aria-hidden />
            <p>Loading server list from system…</p>
          </div>
        )}
        {!error && !loading && servers.length === 0 && (
          <div className="app-message app-message-empty">
            <p>No servers found on scanned ports.</p>
            <p className="app-message-hint">Start a dev server and click Refresh.</p>
          </div>
        )}
        {!error && servers.length > 0 && (
          <>
            {view === VIEW_TABLE && <ServerTable servers={servers} onExited={handleExited} />}
            {view === VIEW_CARDS && <ServerCards servers={servers} onExited={handleExited} />}
          </>
        )}
      </main>
    </div>
  )
}

export default App
