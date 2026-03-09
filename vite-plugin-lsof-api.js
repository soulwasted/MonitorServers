import { getServersFromLsof } from './server/lsofServers.js'

const API_PATH = '/api/servers'

export function lsofApiPlugin() {
  return {
    name: 'lsof-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url !== API_PATH && !req.url.startsWith(API_PATH + '?')) {
          next()
          return
        }
        const url = new URL(req.url, `http://${req.headers.host}`)
        const networkHost = url.searchParams.get('networkHost') || '192.168.1.143'
        const onlyHttp = url.searchParams.get('onlyHttp') !== 'false'
        getServersFromLsof({ onlyHttp, networkHost })
          .then((servers) => {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(servers))
          })
          .catch((err) => {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err.message }))
          })
      })
    },
  }
}
