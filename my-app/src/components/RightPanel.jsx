import { useState } from 'react'
import { HINTS, PLACEHOLDERS } from '../gameLogic'

export default function RightPanel({ session, onIntervene }) {
  const [kind, setKind] = useState('argument')
  const [text, setText] = useState('')
  const [targetId, setTargetId] = useState('')

  function handleSend() {
    if (!text.trim() || !session) return
    onIntervene({ kind, text: text.trim(), targetId: kind === 'persuasion' ? targetId : null })
    setText('')
  }

  function handleKeyDown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSend()
  }

  const hint = HINTS[kind]

  return (
    <aside className="panel-right">
      <div className="discussion-panel">
        <div className="panel-label" style={{ marginBottom: 10 }}>You enter as the fifth voice</div>

        <div className="tabs">
          {['argument', 'event', 'persuasion'].map(k => (
            <button
              key={k}
              className={`tab${kind === k ? ' active' : ''}`}
              onClick={() => setKind(k)}
            >
              {k.charAt(0).toUpperCase() + k.slice(1)}
            </button>
          ))}
        </div>

        {kind === 'persuasion' && session && (
          <select
            className="target-select"
            value={targetId}
            onChange={e => setTargetId(e.target.value)}
          >
            <option value="">Select target…</option>
            {session.agents.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        )}

        <textarea
          className="input"
          rows={5}
          placeholder={PLACEHOLDERS[kind]}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <button
          className="btn-send"
          disabled={!session || !text.trim()}
          onClick={handleSend}
        >
          Send into the room
        </button>

        <div className="hint-box">
          <div className="hint-icon">{hint.icon}</div>
          {hint.text}
        </div>
      </div>

      <div className="current-idea-box"></div>
    </aside>
  )
}
