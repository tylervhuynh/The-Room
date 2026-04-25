import { useState, useRef } from 'react'

export default function Header({ onStart }) {
  const [topic, setTopic] = useState()
  const [current, setCurrent] = useState(null)
  const inputRef = useRef();

  function handleSubmit(e) {
    e.preventDefault()
    onStart(topic.trim())
    setCurrent(topic.trim())

    // reset form
    setTopic("")
    inputRef.current.blur();
  }

  return (
    <header className="header">
      <div className="logo">
        <div className="logo-mark">The Room</div>
        {current != null && <div className="logo-sub">Currently debating: {current}</div>}
      </div>
      <form className="topic-form" onSubmit={handleSubmit}>
        <input
          maxLength={80}
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder="Topic to debate?"
          autoComplete="off"
        />
        <button type="submit" className="btn-start">Enter the room</button>
      </form>
    </header>
  )
}
