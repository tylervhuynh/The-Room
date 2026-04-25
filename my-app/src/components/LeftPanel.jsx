import { useEffect, useRef } from 'react'
import { MOOD_COLORS } from '../gameLogic'

function drawChart(canvas, history, agents) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const W = canvas.width, H = canvas.height
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#0f0f1a'
  ctx.fillRect(0, 0, W, H)
  if (history.length < 2) return

  const agentIds = ['activist', 'traditionalist', 'observer', 'authority']
  const agentColors = { activist: '#c84f6a', traditionalist: '#c4794a', observer: '#4a7fd4', authority: '#4fa878' }

  for (const id of agentIds) {
    ctx.strokeStyle = agentColors[id] + '66'
    ctx.lineWidth = 1
    ctx.beginPath()
    history.forEach((pt, i) => {
      const x = 8 + (i / (history.length - 1)) * (W - 16)
      const y = H - 6 - (((pt.vals && pt.vals[id]) || 0) / 100) * (H - 12)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.stroke()
  }

  ctx.strokeStyle = MOOD_COLORS.open
  ctx.lineWidth = 2.5
  ctx.beginPath()
  history.forEach((pt, i) => {
    const x = 8 + (i / (history.length - 1)) * (W - 16)
    const y = H - 6 - (pt.gb / 100) * (H - 12)
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  })
  ctx.stroke()

  const last = history[history.length - 1]
  ctx.fillStyle = '#c05a8a'
  ctx.beginPath()
  ctx.arc(W - 8, H - 6 - (last.gb / 100) * (H - 12), 3, 0, Math.PI * 2)
  ctx.fill()
}

export default function LeftPanel({ session, onStep }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (session) drawChart(canvasRef.current, session.history, session.agents)
  }, [session])

  return (
    <aside className="panel-left">
      <div className="global-belief">
        <div className="belief-number">{session ? session.globalBelief + '%' : '—'}</div>
        <div className="belief-label">Room consensus</div>
        <div className="big-meter">
          <div className="big-meter-fill" style={{ width: (session?.globalBelief ?? 0) + '%' }} />
        </div>
      </div>

      <div className="chart-wrap">
        <div className="panel-label">Pressure trace</div>
        <canvas ref={canvasRef} id="histChart" width={248} height={100} />
      </div>

      <button className="btn-debate" onClick={onStep}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 8h10M9 4l4 4-4 4"/>
        </svg>
        Let agents debate
      </button>

      <div className="panel-section" style={{ flex: 1, overflowY: 'auto' }}>
        <div className="panel-label">What each orb is weighing (factors of change)</div>
        <div id="reasoningBox">
          {session?.agents.map(a => (
            <div className="reasoning-entry" key={a.id}>
              <div className="reasoning-name" style={{ color: a.color }}>{a.name}</div>
              <div className="reasoning-text">{a.reasoning}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
