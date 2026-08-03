import { useState } from 'react'
import './Versions.css'

interface VersionsProps {
  theme?: 'dark' | 'light'
}

function Versions({ theme = 'dark' }: VersionsProps): React.JSX.Element {
  const [versions] = useState(() => {
    if (typeof window !== 'undefined' && window.electron?.process?.versions) {
      return window.electron.process.versions
    }
    return { electron: '39.8.10', chrome: '142.0.7444.265', node: '22.22.1' }
  })

  return (
    <div className={`vpm-versions-container theme-${theme}`}>
      <div className="vpm-version-item">
        <span className="vpm-version-label">Electron:</span>
        <span className="vpm-version-value">v{versions.electron}</span>
      </div>
      <div className="vpm-version-divider" />
      <div className="vpm-version-item">
        <span className="vpm-version-label">Chromium:</span>
        <span className="vpm-version-value">v{versions.chrome}</span>
      </div>
      <div className="vpm-version-divider" />
      <div className="vpm-version-item">
        <span className="vpm-version-label">Node:</span>
        <span className="vpm-version-value">v{versions.node}</span>
      </div>
    </div>
  )
}

export default Versions
