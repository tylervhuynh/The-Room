import { useEffect, useRef } from 'react'
import { MOOD_COLORS } from '../gameLogic'

function formatMood(mood) {
  return mood ? mood.charAt(0).toUpperCase() + mood.slice(1) : 'Waiting'
}

function drawChart(canvas, history) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const W = canvas.width
  const H = canvas.height
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#14171d'
  ctx.fillRect(0, 0, W, H)
  if (!history?.length || history.length < 2) return

  const agentIds = ['activist', 'traditionalist', 'observer', 'authority']
  const agentColors = { activist: '#e8503a', traditionalist: '#c4894a', observer: '#4a8fd4', authority: '#5fa86b' }

  for (const id of agentIds) {
    ctx.strokeStyle = `${agentColors[id]}66`
    ctx.lineWidth = 1
    ctx.beginPath()
    history.forEach((point, index) => {
      const x = 8 + (index / (history.length - 1)) * (W - 16)
      const belief = (point.agents && point.agents[id]) ?? (point.vals && point.vals[id]) ?? 0
      const y = H - 6 - (belief / 100) * (H - 12)
      index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.stroke()
  }

  ctx.strokeStyle = '#e8503a'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  history.forEach((point, index) => {
    const x = 8 + (index / (history.length - 1)) * (W - 16)
    const belief = point.globalBelief ?? point.gb ?? 0
    const y = H - 6 - (belief / 100) * (H - 12)
    index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  })
  ctx.stroke()

  const last = history[history.length - 1]
  const lastBelief = last.globalBelief ?? last.gb ?? 0
  ctx.fillStyle = '#e8503a'
  ctx.beginPath()
  ctx.arc(W - 8, H - 6 - (lastBelief / 100) * (H - 12), 3, 0, Math.PI * 2)
  ctx.fill()
}

export default function LeftPanel({ session, onStep, busy }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    drawChart(canvasRef.current, session?.history || [])
  }, [session])

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

      <div className="chart-wrap">
        <div className="panel-label">Pressure trace</div>
        <canvas ref={canvasRef} width={248} height={100} />
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
