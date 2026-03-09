# Localhost servers – overview

A simple overview of running localhost servers. The app **automatically detects** what is listening (via `lsof`) and shows each server’s **page title** from its `<title>` tag when available.

## Run

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (e.g. `http://localhost:5173`). On load, the list is fetched; you can switch between **Table** and **Cards**. Use **Refresh** to rescan.

## How it works

With **`npm run dev`**, a local API runs next to Vite. It executes **`lsof -i -P -n | grep LISTEN`** on your machine, parses the output, and for each listening HTTP server it **fetches the page and reads the `<title>`** to use as the display name. The frontend calls **`GET /api/servers`** and shows the result.

- **Data source:** `lsof` → process (node, Docker, Framer, Syncthing, …) and port. Known processes have a description and icon in **`server/lsofServers.js`**. The **title** column is the page’s `<title>` when fetch succeeds; otherwise the process description is used.
- **Filtering:** In “HTTP only” mode, e.g. PostgreSQL (5432), Syncthing sync (22000), and internal processes (Cursor, Spotify, rapportd, …) are skipped. Use `/api/servers?onlyHttp=false` to include all.
- **Network (LAN) URL:** Pass `networkHost` in the query (`/api/servers?networkHost=192.168.x.x`). The frontend default comes from **`src/config.js`** or `localStorage` (key `monitor-servers-network-host`).
- **Fallback:** If the API is not available (e.g. opening the production build without the dev server), the app falls back to client-side port scanning (fetch to localhost).

## Configuration

- **Process list and descriptions (lsof):** edit **`server/lsofServers.js`** (`PROCESS_INFO`, `NON_HTTP_PORTS`, `NON_HTTP_PROCESSES`).
- **Ports to scan (fallback):** edit `PORTS_TO_SCAN` in **`src/config.js`** – used only when the API is not running.
- **Default LAN IP:** edit `DEFAULT_NETWORK_HOST` in **`src/config.js`**, or in the console:  
  `localStorage.setItem('monitor-servers-network-host', '192.168.x.x')`

## Build

```bash
npm run build
```

Output is in `dist/`.
