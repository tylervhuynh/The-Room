import AgentOrb from './AgentOrb'

function formatMood(mood) {
  return mood ? mood.charAt(0).toUpperCase() + mood.slice(1) : 'Waiting'
}

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
          {entry.responses.map((response) => (
            <div className="log-quote" key={response.id} style={{ '--qcolor': response.color }}>
              <div className="log-quote-name">
                <span>{response.name}</span>
                <span className="log-quote-delta" style={{ color: response.delta > 0 ? '#5fa86b' : '#e8503a' }}>
                  {response.delta > 0 ? '+' : ''}{response.delta}
                </span>
              </div>
              <div className="log-quote-text">{response.line}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CenterPanel({ session, error }) {
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
          {session?.agents?.map((agent) => <AgentOrb key={agent.id} agent={agent} />)}
        </div>
      </div>

      <div className="log-panel" style={{ height: 260 }}>
        <div className="log-header">Room transcript</div>
        <div className="log-scroll">
          {session?.log?.map((entry, index) => <LogEntry key={index} entry={entry} />)}
        </div>
      </div>
    </div>
  )
}
