import { alphaColor, rnd, ORB_LAYOUT } from '../gameLogic'

export default function AgentOrb({ agent }) {
  const layout = ORB_LAYOUT[agent.id] || ORB_LAYOUT.activist

  const style = {
    '--orb-x': layout.x,
    '--orb-y': layout.y,
    '--orb-size': layout.size,
    '--float-duration': layout.duration,
    '--float-delay': layout.delay,
    '--agent-shell': alphaColor(agent.color, .58),
    '--agent-glow': alphaColor(agent.color, .28),
    '--agent-wash': alphaColor(agent.color, .24),
  }

  const deltaClass = agent.lastDelta > 0 ? 'pos' : agent.lastDelta < 0 ? 'neg' : ''
  const deltaText  = (agent.lastDelta > 0 ? '+' : '') + agent.lastDelta

  return (
    <div className="agent-shell" style={style}>
      <div className="agent-orb">
        <div className={`agent-delta ${deltaClass}`}>{deltaText}</div>
        <div className="agent-name">{agent.name}</div>
        <div className="agent-role">{agent.role}</div>
        <div className="agent-meter">
          <div className="agent-meter-fill" style={{ width: rnd(agent.belief) + '%', background: agent.color }} />
        </div>
        <div className="agent-stats">
          <span className="agent-belief-pct">{rnd(agent.belief)}%</span>
          <span>resistance {rnd(agent.resistance)}%</span>
        </div>
      </div>
    </div>
  )
}
