import { execSync } from 'child_process'

const TITLE_FETCH_TIMEOUT_MS = 2500
const TITLE_MAX_LENGTH = 80

/**
 * Fetches the page at url and returns the <title> text, or null on failure.
 */
async function fetchPageTitle(url) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TITLE_FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: controller.signal })
    const html = await res.text()
    const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    if (!m) return null
    const title = m[1].replace(/\s+/g, ' ').trim()
    return title.length ? title.slice(0, TITLE_MAX_LENGTH) : null
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Known processes: description and icon for the overview.
 * Key = process name (lowercase, can be prefix e.g. "controlce" for ControlCenter).
 */
const PROCESS_INFO = {
  node: { name: 'Node.js', icon: '🟢', iconKey: 'server', desc: 'Node.js server' },
  vite: { name: 'Vite', icon: '⚛️', iconKey: 'zap', desc: 'Vite dev server' },
  framer: { name: 'Framer', icon: '🎨', iconKey: 'layout', desc: 'Framer local preview' },
  docker: { name: 'Docker', icon: '🐳', iconKey: 'container', desc: 'Container' },
  'com.docke': { name: 'Docker', icon: '🐳', iconKey: 'container', desc: 'Container' },
  syncthing: { name: 'Syncthing', icon: '🔄', iconKey: 'refresh-cw', desc: 'Syncthing web UI' },
  ollama: { name: 'Ollama', icon: '🦙', iconKey: 'cpu', desc: 'Ollama API' },
  controlce: { name: 'ControlCenter', icon: '📺', iconKey: 'tv', desc: 'macOS AirPlay Receiver' },
  stable: { name: 'Stable Diffusion', icon: '🎨', iconKey: 'image', desc: 'Stable Diffusion' },
  figma: { name: 'Figma', icon: '🔷', iconKey: 'pen-tool', desc: 'Figma desktop' },
  raycast: { name: 'Raycast', icon: '⌘', iconKey: 'command', desc: 'Raycast' },
  cursor: { name: 'Cursor', icon: '📝', iconKey: 'file-code', desc: 'Cursor' },
  postgres: { name: 'PostgreSQL', icon: '🐘', iconKey: 'database', desc: 'Database (non-HTTP)' },
  postgresql: { name: 'PostgreSQL', icon: '🐘', iconKey: 'database', desc: 'Database (non-HTTP)' },
}

/** Ports that are typically non-HTTP (DB, system). Skipped when onlyHttp. */
const NON_HTTP_PORTS = new Set([
  5432,   // PostgreSQL
  22000,  // Syncthing sync
])

/** Processes that are not public web servers (IDE, music, system). Skipped when onlyHttp. */
const NON_HTTP_PROCESSES = new Set([
  'cursor', 'rapportd', 'spotify', 'google', 'figma_age', 'canva', 'iproxy', 'dart',
])

/**
 * Parse output of `lsof -i -P -n | grep LISTEN`.
 * Returns array of { process, port } without duplicates (process+port).
 */
function parseLsofListen(output) {
  const lines = output.split('\n').filter(Boolean)
  const seen = new Set()
  const entries = []

  for (const line of lines) {
    const processMatch = line.match(/^(\S+)/)
    const portMatch = line.match(/:(\d+)\s*\(LISTEN\)/)
    if (!processMatch || !portMatch) continue
    const processName = processMatch[1].toLowerCase()
    const port = parseInt(portMatch[1], 10)
    const key = `${processName}:${port}`
    if (seen.has(key)) continue
    seen.add(key)
    entries.push({ process: processName, port })
  }

  return entries.sort((a, b) => a.port - b.port)
}

/**
 * Return description and icon for the given process name (checks prefixes too).
 * Longest matching key is preferred.
 */
function getProcessInfo(processName) {
  const lower = processName.toLowerCase()
  const keys = Object.keys(PROCESS_INFO).sort((a, b) => b.length - a.length)
  for (const key of keys) {
    if (lower === key || lower.startsWith(key) || key.startsWith(lower)) {
      const info = PROCESS_INFO[key]
      return { name: info.name, icon: info.icon, desc: info.desc }
    }
  }
  return { name: processName, icon: '🖥️', iconKey: 'server', desc: processName }
}

/**
 * Run lsof and return array of items for the API (same shape as frontend expects).
 * Fetches each server's page <title> and uses it when available.
 */
export async function getServersFromLsof(options = {}) {
  const { onlyHttp = true, networkHost = '192.168.1.143' } = options

  let output
  try {
    output = execSync('lsof -i -P -n 2>/dev/null | grep LISTEN', {
      encoding: 'utf-8',
      maxBuffer: 2 * 1024 * 1024,
    })
  } catch (e) {
    if (e.status === 1 && !e.stdout) {
      return []
    }
    throw new Error('lsof failed: ' + (e.message || String(e)))
  }

  const entries = parseLsofListen(output)
  const servers = []

  for (const { process: proc, port } of entries) {
    if (onlyHttp && NON_HTTP_PORTS.has(port)) continue
    const skipProcess = onlyHttp && [...NON_HTTP_PROCESSES].some((p) => proc === p || proc.startsWith(p))
    if (skipProcess) continue
    const info = getProcessInfo(proc)
    const id = `lsof-${proc}-${port}`
    const fallbackTitle = info.desc || `:${port}`
    servers.push({
      id,
      icon: info.icon,
      iconKey: info.iconKey,
      title: fallbackTitle,
      port,
      localUrl: `http://localhost:${port}`,
      networkUrl: `http://${networkHost}:${port}`,
      tech: { name: info.name, icon: info.icon, iconKey: info.iconKey },
      process: proc,
    })
  }

  const titles = await Promise.all(servers.map((s) => fetchPageTitle(s.localUrl)))
  servers.forEach((s, i) => {
    if (titles[i]) s.title = titles[i]
  })

  return servers
}
