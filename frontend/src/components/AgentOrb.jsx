import { useState, useEffect } from 'react'
import { alphaColor, ORB_LAYOUT, rnd } from '../gameLogic'

export default function AgentOrb({ agent }) {
  const [width, setWidth] = useState(window.innerWidth)
  const layout = ORB_LAYOUT[agent.id] || ORB_LAYOUT.activist
  const deltaClass = agent.lastDelta > 0 ? 'pos' : agent.lastDelta < 0 ? 'neg' : ''
  const flipLeft = agent.id === 'traditionalist' || agent.id === 'authority'
  
  useEffect( () => {
    const handleResize = () => setWidth(window.innerWidth)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div
      className="agent-shell"
      style={{
        '--orb-x': layout.x,
        '--orb-y': layout.y,
        '--orb-size': layout.size,
        '--float-duration': layout.duration,
        '--float-delay': layout.delay,
        '--agent-shell': alphaColor(agent.color, 0.58),
        '--agent-glow': alphaColor(agent.color, 0.28),
        '--agent-wash': alphaColor(agent.color, 0.24),
      }}
    >
      <div className="agent-orb">
        <div className="agent-name">{agent.name}</div>
        <div className="agent-meter">
          <div className="agent-meter-fill" style={{ width: `${rnd(agent.belief)}%`, background: agent.color }} />
        </div>
        <div className="agent-stats">
          <span className="agent-belief-pct">{rnd(agent.belief)}%</span>
          <span>resistance {rnd(agent.resistance)}%</span>
        </div>
      </div>
      <div className={`agent-delta ${deltaClass}`}>
        {agent.lastDelta > 0 ? '+' : ''}{agent.lastDelta}
      </div>
      <div 
        className={width <= 900 ? "agent-whisper" : "hover-box"}
        style={width > 900 ? {
          boxShadow: `0 10px 30px ${agent.color}`,
          ...(flipLeft ? { left: 'auto', right: '105%' } : {})
        } : {}}
      >
        {width <= 900 ? (
          <span>"{agent.quote}"</span>
        ) : (
          <>
            <div className="hover-box-name" style={{ color: agent.color }}>{agent.name}</div>
            <div className="hover-box-role">{console.log(Object.keys(agent))}{agent.role  ?? 'undefined'}</div>
            <div className="hover-box-row" style={{ marginTop: 6, borderTop: '1px solid var(--border2)', paddingTop: 6 }}>
              <span className="hover-box-row-label" style={{ fontStyle: 'italic' }}>"{agent.quote}"</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
