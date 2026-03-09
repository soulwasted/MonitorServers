import { getNetworkHost } from '../config'

const CHECK_TIMEOUT_MS = 2000
const DETECT_TIMEOUT_MS = 3000

/**
 * Checks whether something responds on the given port (HTTP).
 * Uses no-cors fetch – we only need the request not to fail.
 */
export async function isPortOpen(port) {
  const url = `http://localhost:${port}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS)
  try {
    await fetch(url, { mode: 'no-cors', signal: controller.signal })
    return true
  } catch {
    return false
  } finally {
    clearTimeout(timeout)
  }
}

const TECH_SIGNATURES = [
  { pattern: /__NEXT_DATA__/i, name: 'Next.js', icon: '⚡' },
  { pattern: /"vite"/i, name: 'Vite', icon: '⚛️' },
  { pattern: /vite\/client/i, name: 'Vite', icon: '⚛️' },
  { pattern: /create-react-app|react-scripts/i, name: 'Create React App', icon: '⚛️' },
  { pattern: /"react"/i, name: 'React', icon: '⚛️' },
  { pattern: /nuxt|__NUXT__/i, name: 'Nuxt', icon: '💚' },
  { pattern: /vue/i, name: 'Vue', icon: '💚' },
  { pattern: /angular/i, name: 'Angular', icon: '🅰️' },
  { pattern: /svelte/i, name: 'Svelte', icon: '✨' },
  { pattern: /express|connect/i, name: 'Express', icon: '🟢' },
  { pattern: /fastify/i, name: 'Fastify', icon: '🟢' },
]

/**
 * Tries to detect technology from the server response (if CORS allows reading).
 */
export async function detectTechnology(port) {
  const url = `http://localhost:${port}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), DETECT_TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: controller.signal })
    const html = await res.text()
    for (const { pattern, name, icon } of TECH_SIGNATURES) {
      if (pattern.test(html)) return { name, icon }
    }
    const poweredBy = res.headers.get('x-powered-by')
    if (poweredBy) return { name: poweredBy, icon: '🔧' }
    return { name: 'HTTP', icon: '🌐' }
  } catch {
    return { name: '?', icon: '❓' }
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Scans the given ports and returns an array of servers that respond.
 */
export async function scanPorts(ports) {
  const networkHost = getNetworkHost()
  const openPorts = await Promise.all(
    ports.map(async (port) => ((await isPortOpen(port)) ? port : null))
  ).then((results) => results.filter(Boolean))

  const servers = await Promise.all(
    openPorts.map(async (port) => {
      const tech = await detectTechnology(port)
      return {
        id: `port-${port}`,
        icon: tech.icon === '⚡' ? '🌐' : tech.icon === '⚛️' ? '📊' : '🖥️',
        title: `Server :${port}`,
        port,
        localUrl: `http://localhost:${port}`,
        networkUrl: `http://${networkHost}:${port}`,
        tech,
      }
    })
  )

  return servers.sort((a, b) => a.port - b.port)
}
