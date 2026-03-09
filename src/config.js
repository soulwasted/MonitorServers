/** Ports to scan when API is unavailable (common dev servers). */
export const PORTS_TO_SCAN = [
  3000,  // Next.js, Create React App
  3333,
  4000,
  5173,  // Vite
  5174,
  8080,
  5000,
  4173,   // Vite preview
  24678,  // Vite inspector
]

const STORAGE_KEY_NETWORK_HOST = 'monitor-servers-network-host'

/** Default network (LAN) host. Can be overridden in localStorage. */
export const DEFAULT_NETWORK_HOST = '192.168.1.143'

export function getNetworkHost() {
  try {
    return localStorage.getItem(STORAGE_KEY_NETWORK_HOST) || DEFAULT_NETWORK_HOST
  } catch {
    return DEFAULT_NETWORK_HOST
  }
}

export function setNetworkHost(host) {
  try {
    if (host) localStorage.setItem(STORAGE_KEY_NETWORK_HOST, host)
    else localStorage.removeItem(STORAGE_KEY_NETWORK_HOST)
  } catch {}
}
