import { useEffect, useState, useRef } from 'react'

export default function Header({ onStart, topic, busy }) {
  const [value, setValue] = useState("")
  const inputRef = useRef()

  // useEffect(() => {
  //   setValue(topic || "")
  // }, [topic])

  function handleSubmit(event) {
    event.preventDefault()
    onStart(value.trim())

    setValue("")
    inputRef.current.blur();
  }

  return (
    <header className="header">
      <div className="logo">
        <div className="logo-mark">The Room</div>
        {topic && <div className="logo-sub">currently debating: {topic}</div>}
      </div>
      <form className="topic-form" onSubmit={handleSubmit}>
        <input
          maxLength={80}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          ref={inputRef}
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
