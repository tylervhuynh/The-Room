import { useEffect, useRef } from 'react'
import { MOOD_COLORS } from '../gameLogic'

function formatMood(mood) {
  return mood ? mood.charAt(0).toUpperCase() + mood.slice(1) : 'Waiting'
}

export default function LeftPanel({ session, onStep, busy }) {
  const canvasRef = useRef(null)

  return (
    <aside className="panel-left">
      <div className="global-belief">
        <div className="belief-number">{session ? `${session.globalBelief}%` : '—'}</div>
        <div className="belief-label">Room consensus</div>
        <div className="big-meter">
          <div className="big-meter-fill" style={{ width: `${session?.globalBelief ?? 0}%` }} />
        </div>
        <div className="mood-pill">
          <span className="mood-dot" style={{ background: MOOD_COLORS[session?.mood] || '#888' }} />
          <span>{formatMood(session?.mood)}</span>
        </div>
      </div>

      <button className="btn-debate" onClick={onStep} disabled={!session || busy}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 8h10M9 4l4 4-4 4" />
        </svg>
        {busy ? 'Listening…' : 'Let the room react'}
      </button>

      <div className="panel-section" style={{ flex: 1, overflowY: 'auto' }}>
        <div className="panel-label">What each orb is weighing</div>
        {session?.agents?.map((agent) => (
          <div className="reasoning-entry" key={agent.id}>
            <div className="reasoning-name" style={{ color: agent.color }}>{agent.name}</div>
            <div className="reasoning-text">{agent.reasoning}</div>
          </div>
        ))}
      </div>
    </aside>
  )
}
