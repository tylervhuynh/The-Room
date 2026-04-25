import { useState } from 'react'
import Header from './components/Header'
import LeftPanel from './components/LeftPanel'
import CenterPanel from './components/CenterPanel'
import RightPanel from './components/RightPanel'
import { makeSession, runTurn, debateStep } from './gameLogic'

export default function App() {
  const [session, setSession] = useState(() => makeSession(''))

  function handleStart(topic) {
    setSession(makeSession(topic))
  }

  function handleIntervene(action) {
    setSession(prev => runTurn(prev, action))
  }

  function handleStep() {
    if (!session) return
    setSession(prev => debateStep(prev))
  }

  return (
    <div id="app">
      <Header onStart={handleStart} />
      <div className="main">
        <LeftPanel session={session} onStep={handleStep} />
        <CenterPanel session={session} />
        <RightPanel session={session} onIntervene={handleIntervene} />
      </div>
    </div>
  )
}
