import React from 'react'
import { ServerIcon } from './ServerIcon'

export function TechBadge({ tech }) {
  if (!tech) return null
  return (
    <span className="tech-badge" title={tech.name}>
      {tech.iconKey ? (
        <span className="tech-badge-icon">
          <ServerIcon iconKey={tech.iconKey} size={14} />
        </span>
      ) : (
        tech.icon && <span className="tech-badge-icon">{tech.icon}</span>
      )}
      <span className="tech-badge-name">{tech.name}</span>
    </span>
  )
}
