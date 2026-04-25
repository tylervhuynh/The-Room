import AgentOrb from './AgentOrb'

function LogEntry({ entry }) {
  if (entry.type === 'system') {
    return <div className="log-system">{entry.body}</div>
  }

  return (
    <div className="log-entry">
      <div className="log-entry-head">
        <span className="log-entry-title">{entry.title}</span>
        <span className="log-entry-turn">T{entry.turn}</span>
      </div>
      <div className="log-body">{entry.body}</div>
      {entry.worldReact && <div className="log-world">{entry.worldReact}</div>}
      {entry.responses && (
        <div className="log-responses">
          {entry.responses.map(r => (
            <div className="log-quote" key={r.id} style={{ '--qcolor': r.color }}>
              <div className="log-quote-name">
                <span>{r.name}</span>
                <span className="log-quote-delta" style={{ color: r.delta > 0 ? '#4fa878' : '#c84f6a' }}>
                  {r.delta > 0 ? '+' : ''}{r.delta}
                </span>
              </div>
              <div className="log-quote-text">{r.line}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CenterPanel({ session }) {
  return (
    <div className="center-panel">
      <div className="agents-header">
        <div className="agents-heading">
          <div className="panel-label">Debate chamber</div>
          <h2>The Room</h2>
        </div>
        <span className="turn-badge">Turn {session?.turn ?? 0}</span>
      </div>

      <div className="room-stage">
        <div className="agents-grid">
          {session?.agents.map(a => <AgentOrb key={a.id} agent={a} />)}
        </div>
      </div>

      <div className="log-panel" style={{ height: 260 }}>
        <div className="log-header">Room transcript</div>
        <div className="log-scroll">
          {session?.log.map((entry, i) => <LogEntry key={i} entry={entry} />)}
        </div>
      </div>
    </div>
  )
}
