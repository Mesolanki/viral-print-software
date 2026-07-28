import { useState } from 'react'

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

  const isDark = theme === 'dark'

  return (
    <div
      className={`d-flex flex-wrap align-items-center justify-content-around p-2.5 rounded-3 font-monospace fs-7 border transition-all ${
        isDark
          ? 'bg-dark bg-opacity-75 border-secondary text-info'
          : 'bg-light border-light-subtle text-primary fw-bold'
      }`}
    >
      <div className="d-flex align-items-center gap-1.5 px-2 py-1">
        <span className={isDark ? 'text-secondary' : 'text-muted'}>Electron:</span>
        <span className="fw-bold">v{versions.electron}</span>
      </div>
      <div className={`d-none d-sm-block border-start ${isDark ? 'border-secondary' : 'border-light-subtle'} opacity-50 h-75 mx-1`} />
      <div className="d-flex align-items-center gap-1.5 px-2 py-1">
        <span className={isDark ? 'text-secondary' : 'text-muted'}>Chromium:</span>
        <span className="fw-bold">v{versions.chrome}</span>
      </div>
      <div className={`d-none d-sm-block border-start ${isDark ? 'border-secondary' : 'border-light-subtle'} opacity-50 h-75 mx-1`} />
      <div className="d-flex align-items-center gap-1.5 px-2 py-1">
        <span className={isDark ? 'text-secondary' : 'text-muted'}>Node:</span>
        <span className="fw-bold">v{versions.node}</span>
      </div>
    </div>
  )
}

export default Versions
