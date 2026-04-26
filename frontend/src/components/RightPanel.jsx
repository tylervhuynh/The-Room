import { useEffect, useState } from 'react'
import { HINTS, PLACEHOLDERS } from '../gameLogic'

export default function RightPanel({ session, onIntervene, busy, error }) {
  const [kind, setKind] = useState('argument')
  const [text, setText] = useState('')
  const [targetId, setTargetId] = useState('')

  useEffect(() => {
    if (!session?.agents?.some((agent) => agent.id === targetId)) {
      setTargetId(session?.agents?.[0]?.id || '')
    }
  }, [session, targetId])

  const hint = HINTS[kind]

  function handleSend() {
    if (!text.trim() || !session || busy) return
    onIntervene({
      kind,
      text: text.trim(),
      targetId: kind === 'persuasion' ? targetId || session.agents?.[0]?.id || null : null,
    })
    setText('')
  }

  function handleKeyDown(event) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') handleSend()
  }

  return (
    <aside className="panel-right">
      <div className="intervention-panel">
        <div className="panel-label" style={{ marginBottom: 10 }}>You enter as the fifth voice</div>
        <div className="tabs">
          {['argument', 'event', 'persuasion'].map((value) => (
            <button
              key={value}
              className={`tab${kind === value ? ' active' : ''}`}
              onClick={() => setKind(value)}
              disabled={busy}
            >
              {value.charAt(0).toUpperCase() + value.slice(1)}
            </button>
          ))}
        </div>

        {kind === 'persuasion' && session && (
          <select
            className="target-select show"
            value={targetId}
            onChange={(event) => setTargetId(event.target.value)}
            disabled={busy}
          >
            {session.agents.map((agent) => (
              <option key={agent.id} value={agent.id}>{agent.name}</option>
            ))}
          </select>
        )}

        <textarea
          className="input"
          rows={5}
          placeholder={PLACEHOLDERS[kind]}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={busy}
        />

        <button
          className="btn-send"
          disabled={!session || !text.trim() || busy}
          onClick={handleSend}
        >
          {busy ? 'Sending…' : 'Send into the room'}
        </button>

        <div className="hint-box">
          <div className="hint-icon">{error ? '!' : hint.icon}</div>
          {error || hint.text}
        </div>
      </div>
      <div className="current-idea-box">
        <div className="current-idea-kicker">Current topic</div>
        <div className="current-idea-topic" id="roomTopic">{session?.topic}</div>
        <div className="current-idea-summary" id="roomSummary">Four perspectives drift around one idea and keep updating as new pressure lands.</div>
      </div>
    </aside>
  )
}
