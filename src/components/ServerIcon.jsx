import React from 'react'
import {
  Server,
  Zap,
  Layout,
  Box,
  RefreshCw,
  Cpu,
  Tv,
  Image,
  PenTool,
  Command,
  FileCode,
  Database,
  Terminal,
  HelpCircle,
} from 'lucide-react'

const ICON_MAP = {
  server: Server,
  zap: Zap,
  layout: Layout,
  container: Box,
  'refresh-cw': RefreshCw,
  cpu: Cpu,
  tv: Tv,
  image: Image,
  'pen-tool': PenTool,
  command: Command,
  'file-code': FileCode,
  database: Database,
  terminal: Terminal,
}

/**
 * Renders a Lucide icon by key. Falls back to HelpCircle for unknown keys.
 * Use size and className to style (default size 20, currentColor).
 */
export function ServerIcon({ iconKey, size = 20, className = '' }) {
  const Icon = ICON_MAP[iconKey?.toLowerCase()] ?? HelpCircle
  return <Icon size={size} className={className} aria-hidden />
}
