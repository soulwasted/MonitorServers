import React from 'react'
import { ExternalLink } from 'lucide-react'
import { TechBadge } from './TechBadge'
import { ServerIcon } from './ServerIcon'

export function ServerCards({ servers, onExited }) {
  return (
    <div className="server-cards">
      {servers.map((s) => (
        <article
          key={s.id}
          className={`server-card${s._exiting ? ' server-card-exit' : s._entering ? ' server-card-enter' : ''}`}
          onAnimationEnd={s._exiting && onExited ? () => onExited(s.id) : undefined}
        >
          <div className="server-card-header">
            <span className="server-card-icon" aria-hidden>
              {s.iconKey ? (
                <ServerIcon iconKey={s.iconKey} size={28} className="server-card-icon-svg" />
              ) : (
                s.icon
              )}
            </span>
            <h3 className="server-card-title">{s.title}</h3>
            <TechBadge tech={s.tech} />
          </div>
          <div className="server-card-urls">
            <a
              href={s.localUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="server-card-link"
            >
              <span className="server-card-link-label">localhost</span>
              <span className="server-card-link-url">{s.localUrl.replace(/^https?:\/\//, '')}</span>
              <ExternalLink size={16} aria-hidden />
            </a>
            <a
              href={s.networkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="server-card-link"
            >
              <span className="server-card-link-label">network</span>
              <span className="server-card-link-url">{s.networkUrl.replace(/^https?:\/\//, '')}</span>
              <ExternalLink size={16} aria-hidden />
            </a>
          </div>
        </article>
      ))}
    </div>
  )
}
