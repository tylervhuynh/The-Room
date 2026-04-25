import { useEffect, useState } from 'react'

export default function Header({ onStart, topic, busy }) {
  const [value, setValue] = useState(topic || 'AI regulation')

  useEffect(() => {
    setValue(topic || 'AI regulation')
  }, [topic])

  function handleSubmit(event) {
    event.preventDefault()
    onStart(value.trim() || 'AI regulation')
  }

  return (
    <header className="header">
      <div className="logo">
        <div className="logo-mark">The Room</div>
        <div className="logo-sub">currently debating: {topic || 'AI regulation'}</div>
      </div>
      <form className="topic-form" onSubmit={handleSubmit}>
        <input
          maxLength={80}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="What idea should enter the room?"
          autoComplete="off"
          disabled={busy}
        />
        <button type="submit" className="btn-start" disabled={busy}>
          {busy ? 'Loading…' : 'Open the room'}
        </button>
      </form>
    </header>
  )
}
