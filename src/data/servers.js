/**
 * Seznam localhost serverů – upravte podle svých projektů.
 * localUrl = adresa na tomto počítači, networkUrl = adresa v síti (pro mobil/ostatní zařízení).
 */

export const defaultServers = [
  {
    id: '1',
    icon: '🌐',
    title: 'Hlavní web',
    port: 3000,
    localUrl: 'http://localhost:3000',
    networkUrl: 'http://192.168.1.143:3000',
    tech: { name: 'Next.js', icon: '⚡' },
  },
  {
    id: '2',
    icon: '📊',
    title: 'Dashboard',
    port: 3333,
    localUrl: 'http://localhost:3333',
    networkUrl: 'http://192.168.1.143:3333',
    tech: { name: 'Vite + React', icon: '⚛️' },
  },
  {
    id: '3',
    icon: '🗄️',
    title: 'API + DB',
    port: 4000,
    localUrl: 'http://localhost:4000',
    networkUrl: 'http://192.168.1.143:4000',
    tech: { name: 'Neon DB', icon: '🐘' },
  },
]
