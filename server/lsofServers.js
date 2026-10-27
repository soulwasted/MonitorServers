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
  stable: { name: 'Warp', icon: '🟦', iconKey: 'terminal', desc: 'Warp terminal' },
  figma: { name: 'Figma', icon: '🔷', iconKey: 'pen-tool', desc: 'Figma desktop' },
  raycast: { name: 'Raycast', icon: '⌘', iconKey: 'command', desc: 'Raycast' },
  cursor: { name: 'Cursor', icon: '📝', iconKey: 'file-code', desc: 'Cursor' },
  postgres: { name: 'PostgreSQL', icon: '🐘', iconKey: 'database', desc: 'Database (non-HTTP)' },
  postgresql: { name: 'PostgreSQL', icon: '🐘', iconKey: 'database', desc: 'Database (non-HTTP)' },
}

/** Process names that are dev servers (node-based). */
const DEV_PROCESS_PREFIXES = ['node', 'vite', 'bun', 'next', 'deno']

/** Parent process names that indicate a dev server context. */
const DEV_PARENT_PROCESSES = new Set(['npm', 'yarn', 'pnpm', 'bun', 'next', 'vite', 'node', 'deno'])

/**
 * Returns true when the process looks like a local dev server (npm/next/vite/node…).
 */
function isDevServer(proc, parentProcess) {
  const lower = proc.toLowerCase()
  if (DEV_PROCESS_PREFIXES.some((p) => lower === p || lower.startsWith(p))) return true
  if (parentProcess && DEV_PARENT_PROCESSES.has(parentProcess.toLowerCase())) return true
  return false
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
 * Returns array of { process, port, pid } without duplicates (process+port).
 */
function parseLsofListen(output) {
  const lines = output.split('\n').filter(Boolean)
  const seen = new Set()
  const entries = []

  for (const line of lines) {
    const fields = line.trim().split(/\s+/)
    const processName = fields[0]?.toLowerCase()
    const pid = parseInt(fields[1], 10)
    const portMatch = line.match(/:(\d+)\s*\(LISTEN\)/)
    if (!processName || !portMatch || isNaN(pid)) continue
    const port = parseInt(portMatch[1], 10)
    const key = `${processName}:${port}`
    if (seen.has(key)) continue
    seen.add(key)
    entries.push({ process: processName, port, pid })
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
 * Build a PID → { ppid, command } map from `ps` (single call, efficient).
 */
function getProcessMap() {
  try {
    const output = execSync('ps -A -o pid=,ppid=,command=', {
      encoding: 'utf-8',
      maxBuffer: 4 * 1024 * 1024,
    })
    const map = new Map()
    for (const line of output.split('\n')) {
      const m = line.match(/^\s*(\d+)\s+(\d+)\s+(.*)$/)
      if (m) {
        map.set(parseInt(m[1], 10), {
          ppid: parseInt(m[2], 10),
          command: m[3].trim(),
        })
      }
    }
    return map
  } catch {
    return new Map()
  }
}

/**
 * Extract project directory name from a command path.
 * E.g. "/Users/.../DEV/ProjectVault/node_modules/.bin/next" → "ProjectVault"
 */
function extractProject(command) {
  const m1 = command.match(/\/([^/]+)\/node_modules\//)
  if (m1) return m1[1]
  const m2 = command.match(/\/(?:DEV|dev|Projects|projects|Sites|sites|Code|code|workspace|Workspace|repos|Repos)\/([^/\s]+)/)
  if (m2) return m2[1]
  return null
}

/**
 * Walk up the process tree from pid to find the project directory name.
 */
function findProject(pid, processMap) {
  let current = pid
  const visited = new Set()
  while (current && !visited.has(current)) {
    visited.add(current)
    const entry = processMap.get(current)
    if (!entry) break
    const project = extractProject(entry.command)
    if (project) return project
    current = entry.ppid
  }
  return null
}

/**
 * Identify the parent application that spawned this process.
 */
function getParentProcessName(pid, processMap) {
  const entry = processMap.get(pid)
  if (!entry) return null
  const parent = processMap.get(entry.ppid)
  if (!parent) return null
  const cmd = parent.command
  if (/\bnpm\s+run\b/.test(cmd)) return 'npm'
  if (/\byarn\b/.test(cmd)) return 'yarn'
  if (/\bpnpm\b/.test(cmd)) return 'pnpm'
  if (/\bbun\b/.test(cmd)) return 'bun'
  if (/\bvite\b/i.test(cmd)) return 'vite'
  if (/\bnext\b/i.test(cmd)) return 'next'
  if (/\bnode\b/.test(cmd)) return 'node'
  if (/\bdocker\b/.test(cmd)) return 'docker'
  const binMatch = cmd.match(/(?:^|\/)([^/\s]+?)(?:\s|$)/)
  return binMatch ? binMatch[1] : null
}

/**
 * Run lsof and return array of items for the API (same shape as frontend expects).
 * Fetches each server's page <title> and uses it when available.
 * Includes process identification: project name and parent process.
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
  const processMap = getProcessMap()
  const servers = []

  for (const { process: proc, port, pid } of entries) {
    if (onlyHttp && NON_HTTP_PORTS.has(port)) continue
    const skipProcess = onlyHttp && [...NON_HTTP_PROCESSES].some((p) => proc === p || proc.startsWith(p))
    if (skipProcess) continue
    const info = getProcessInfo(proc)
    const id = `lsof-${proc}-${port}`
    const fallbackTitle = info.desc || `:${port}`
    const project = findProject(pid, processMap)
    const parentProcess = getParentProcessName(pid, processMap)
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
      pid,
      project,
      parentProcess,
      isDev: isDevServer(proc, parentProcess),
    })
  }

  const titles = await Promise.all(servers.map((s) => fetchPageTitle(s.localUrl)))
  servers.forEach((s, i) => {
    if (titles[i]) s.title = titles[i]
  })

  return servers
}
