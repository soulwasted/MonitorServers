import { getNetworkHost } from '../config'
import { scanPorts } from './portScanner'
import { PORTS_TO_SCAN } from '../config'

/**
 * Tries to load the server list from the local API (lsof via Vite plugin).
 * If the API is unavailable (production build, different origin), falls back to client-side port scanning.
 */
export async function fetchServers() {
  const networkHost = getNetworkHost()
  const apiUrl = `/api/servers?networkHost=${encodeURIComponent(networkHost)}`

  try {
    const res = await fetch(apiUrl)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `API ${res.status}`)
    }
    const data = await res.json()
    if (Array.isArray(data)) return data
    throw new Error('Invalid API response')
  } catch (e) {
    // API unavailable (e.g. build without dev server) → fallback to browser port scan
    return scanPorts(PORTS_TO_SCAN)
  }
}
