import React from 'react'
import { ExternalLink } from 'lucide-react'
import { TechBadge } from './TechBadge'
import { ServerIcon } from './ServerIcon'

function CopyableUrl({ url, label }) {
  const copy = () => {
    navigator.clipboard.writeText(url)
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="url-cell"
      onClick={(e) => e.ctrlKey && copy()}
      title="Open (Ctrl+click = copy)"
    >
      <span className="url-label">{label}</span>
      <ExternalLink size={14} aria-hidden />
    </a>
  )
}

export function ServerTable({ servers, onExited }) {
  return (
    <div className="server-table-wrap">
      <table className="server-table">
        <thead>
          <tr>
            <th className="col-icon" scope="col"> </th>
            <th className="col-title" scope="col">Title</th>
            <th className="col-url" scope="col">localhost</th>
            <th className="col-url" scope="col">Network (LAN)</th>
            <th className="col-tech" scope="col">Technology</th>
          </tr>
        </thead>
        <tbody>
          {servers.map((s, i) => {
            const showDivider = !s.isDev && i > 0 && servers[i - 1].isDev
            return (
              <React.Fragment key={s.id}>
                {showDivider && (
                  <tr className="server-divider-row" aria-hidden>
                    <td colSpan={5} className="server-divider-cell" />
                  </tr>
                )}
                <tr
                  className={s._exiting ? 'server-row server-row-exit' : s._entering ? 'server-row server-row-enter' : 'server-row'}
                  onAnimationEnd={s._exiting && onExited ? () => onExited(s.id) : undefined}
                >
                  <td className="col-icon">
                    {s.iconKey ? (
                      <span className="row-icon row-icon-svg">
                        <ServerIcon iconKey={s.iconKey} size={22} />
                      </span>
                    ) : (
                      <span className="row-icon" aria-hidden>{s.icon}</span>
                    )}
                  </td>
                  <td className="col-title">
                    <strong>{s.title}</strong>
                    {(s.project || s.parentProcess) && (
                      <span className="title-process-info">
                        {s.project || s.process}
                        {s.parentProcess && <span className="process-via"> · via {s.parentProcess}</span>}
                      </span>
                    )}
                  </td>
                  <td className="col-url">
                    <CopyableUrl url={s.localUrl} label={s.localUrl.replace(/^https?:\/\//, '')} />
                  </td>
                  <td className="col-url col-url-network">
                    <CopyableUrl url={s.networkUrl} label={s.networkUrl.replace(/^https?:\/\//, '')} />
                  </td>
                  <td className="col-tech">
                    <TechBadge tech={s.tech} />
                  </td>
                </tr>
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
