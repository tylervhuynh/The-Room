import { useEffect, useState } from 'react'
import Header from './components/Header'
import LeftPanel from './components/LeftPanel'
import CenterPanel from './components/CenterPanel'
import RightPanel from './components/RightPanel'
import { api } from './api'

export default function App() {
  const [session, setSession] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleStart(topic) {
    setBusy(true)
    try {
      const nextSession = await api('/api/session', { topic: topic })
      setSession(nextSession)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleIntervene(action) {
    if (!session?.id) return
    setBusy(true)
    try {
      const nextSession = await api(`/api/session/${session.id}/intervene`, action)
      setSession(nextSession)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleStep() {
    if (!session?.id) return
    setBusy(true)
    try {
      const nextSession = await api(`/api/session/${session.id}/step`)
      setSession(nextSession)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    handleStart('')
  }, [])

  return (
    <div id="app">
      <Header onStart={handleStart} topic={session?.topic} busy={busy} />
      <div className="main">
        <LeftPanel session={session} onStep={handleStep} busy={busy} />
        <CenterPanel session={session} error={error} />
        <RightPanel session={session} onIntervene={handleIntervene} busy={busy} error={error} />
      </div>
    </div>
  )
}
