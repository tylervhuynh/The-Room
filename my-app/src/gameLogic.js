// ─── Agent Blueprints ───────────────────────────────────────────────────────
export const AGENTS = [
  {
    id: 'activist', name: 'Activist', role: 'Moral urgency & collective action',
    base: 76, vol: 1.22, color: '#c84f6a',
    trust: { evidence: .9, rights: 1.25, stability: .35, authority: .45, popularity: .72 }
  },
  {
    id: 'traditionalist', name: 'Traditionalist', role: 'Continuity, caution & social costs',
    base: 34, vol: .74, color: '#c4794a',
    trust: { evidence: .62, rights: .35, stability: 1.28, authority: .82, popularity: .5 }
  },
  {
    id: 'observer', name: 'Neutral Observer', role: 'Evidence, uncertainty & second-order effects',
    base: 52, vol: .9, color: '#4a7fd4',
    trust: { evidence: 1.2, rights: .72, stability: .72, authority: .66, popularity: .45 }
  },
  {
    id: 'authority', name: 'Authority Figure', role: 'Legitimacy, institutions & public pressure',
    base: 48, vol: .82, color: '#4fa878',
    trust: { evidence: .95, rights: .55, stability: .92, authority: 1.15, popularity: .9 }
  }
]

export const STANCES = {
  activist: {
    high: [
      "The old consensus is already breaking. Delay is a choice with consequences.",
      "People closest to the harm should not need permission to be believed."
    ],
    mid: [
      "This could move, but pressure has to be public enough to make neutrality costly.",
      "The question is not whether change is comfortable—it's whether the current system is defensible."
    ],
    low: [
      "I'm not convinced the room understands the stakes yet. The moral case needs sharper force.",
      "If the public can't see who is harmed, the status quo keeps winning by default."
    ]
  },
  traditionalist: {
    high: [
      "I can accept reform when the guardrails are visible and the costs are named.",
      "The case is becoming harder to dismiss, but speed still matters."
    ],
    mid: [
      "I need proof that this won't damage institutions people rely on.",
      "Good intentions are not a plan. What happens after the slogan?"
    ],
    low: [
      "This feels like pressure without responsibility. I'm digging in until the risks are answered.",
      "Societies can break things faster than they can repair them."
    ]
  },
  observer: {
    high: [
      "The evidence and public mood are converging. Resistance now needs a stronger factual basis.",
      "Belief is moving because the claims are becoming testable, not just emotional."
    ],
    mid: [
      "The system is unstable. One strong event or argument could tip the average belief.",
      "Both sides are supplying partial truths. The uncertainty is still doing real work."
    ],
    low: [
      "The debate is producing more heat than information. I'd expect defensive sorting next.",
      "Without clearer evidence, people are updating from identity more than facts."
    ]
  },
  authority: {
    high: [
      "A policy window is opening. Public legitimacy is moving faster than institutions.",
      "The pressure is now broad enough that leadership has to respond."
    ],
    mid: [
      "I'm watching whether this becomes durable public demand or a temporary surge.",
      "Any action needs a coalition, not just a winning argument."
    ],
    low: [
      "The political risk still outweighs the mandate. I'd wait.",
      "If this becomes polarizing, institutions will choose containment over endorsement."
    ]
  }
}

export const DIMS = {
  evidence: ["study","data","proof","research","expert","science","scientific","measurable","record"],
  rights: ["equal","fair","rights","justice","dignity","freedom","harm","voice","workforce"],
  stability: ["risk","cost","tradition","family","jobs","order","stability","security","disruption"],
  authority: ["law","court","government","official","policy","institution","leader","regulation"],
  popularity: ["viral","protest","movement","public","media","crowd","election","majority"]
}

export const HINTS = {
  argument: { icon: '💬', text: "Your argument enters the room as a new social force with its own influence weight and dimension score." },
  event:    { icon: '⚡', text: "Events hit every orb at once, but each role reads the shock through a different trust profile." },
  persuasion:{ icon: '🎯', text: "Targeted persuasion amplifies your effect on one orb and exposes more of its internal reasoning." }
}

export const PLACEHOLDERS = {
  argument: "What if open rules create more trust than bans?",
  event: "A major protest occurs after leaked documents reveal hidden costs.",
  persuasion: "A cautious policy can protect people without freezing progress."
}

export const ORB_LAYOUT = {
  activist:     { x: '9%',  y: '10%', size: 'clamp(170px,18vw,214px)', duration: '11s', delay: '0s' },
  observer:     { x: '69%', y: '9%',  size: 'clamp(166px,17vw,210px)', duration: '11s', delay: '-2.75s' },
  traditionalist:{ x: '10%', y: '56%', size: 'clamp(168px,18vw,212px)', duration: '11s', delay: '-5.5s' },
  authority:    { x: '68%', y: '55%', size: 'clamp(164px,17vw,206px)', duration: '11s', delay: '-8.25s' }
}

export const MOOD_COLORS = {
  polarized: '#c84f6a', charged: '#c4933a', receptive: '#4fa878',
  defensive: '#8b6fe8', open: '#4a7fd4'
}

// ─── Pure Helpers ────────────────────────────────────────────────────────────
export const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v))
export const rnd   = v => Math.round(v)
export const pick  = (arr, i) => arr[Math.abs(i) % arr.length]

export function alphaColor(hex, alpha) {
  const v = hex.replace('#', '')
  const f = v.length === 3 ? v.split('').map(c => c + c).join('') : v
  const r = parseInt(f.slice(0,2),16), g = parseInt(f.slice(2,4),16), b = parseInt(f.slice(4,6),16)
  return `rgba(${r},${g},${b},${alpha})`
}

export function scoreText(text) {
  const low = text.toLowerCase()
  const s = Object.fromEntries(Object.keys(DIMS).map(k => [k, 0]))
  for (const [dim, words] of Object.entries(DIMS))
    for (const w of words) if (low.includes(w)) s[dim]++
  if (!Object.values(s).some(Boolean)) { s.evidence = .55; s.rights = .55 }
  return s
}

export function textTilt(text) {
  const low = text.toLowerCase()
  const neg = ["ban","danger","threat","collapse","fear","crisis","scandal","backlash","fraud","violence"]
  const pos = ["equal","benefit","safe","progress","opportunity","protect","improve","breakthrough","support"]
  return clamp(.5 + (pos.filter(w => low.includes(w)).length - neg.filter(w => low.includes(w)).length) * .13, .18, .82)
}

function applyInfluence(agent, scores, tilt, weight, mode, targetId) {
  const trust = Object.entries(scores).reduce((s, [d, sc]) => s + sc * agent.trust[d], 0)
  const total  = Object.values(scores).reduce((s, v) => s + v, 0) || 1
  const normTrust = trust / total
  const dir = (tilt - .5) * 2
  const targetBoost = targetId === agent.id ? 1.7 : 1
  const modeBoost   = mode === 'event' ? 1.25 : mode === 'persuasion' ? 1.45 : 1
  const resDrag = 1 - agent.resistance / 160
  const delta = dir * weight * normTrust * agent.vol * targetBoost * modeBoost * resDrag
  const snapV = Math.abs(delta) > 8 ? Math.sign(delta) * -agent.resistance * .025 : 0
  return delta + snapV
}

function avg(agents) { return rnd(agents.reduce((s, a) => s + a.belief, 0) / agents.length) }

function snap(agents, turn, label) {
  return { turn, label, gb: avg(agents), vals: Object.fromEntries(agents.map(a => [a.id, rnd(a.belief)])) }
}

// ─── Session Factory ─────────────────────────────────────────────────────────
export function makeSession(topic) {
  const seed = topic.split('').reduce((s, c) => s + c.charCodeAt(0), 0)
  const agents = AGENTS.map((bp, i) => {
    const drift = ((seed + i * 17) % 13) - 6
    return {
      ...bp, belief: clamp(bp.base + drift),
      resistance: bp.id === 'traditionalist' ? 64 : bp.id === 'authority' ? 52 : 38,
      lastDelta: 0,
      quote: 'Initial position formed from role incentives.',
      reasoning: 'Waiting for the first discussion.'
    }
  })
  return {
    topic,
    turn: 0,
    mood: 'open',
    globalBelief: avg(agents),
    agents,
    log: [{ type: 'system', body: `The Room opens around "${topic}".`, turn: 0 }],
    history: [snap(agents, 0, 'Start')]
  }
}

// ─── Turn Engine ─────────────────────────────────────────────────────────────
export function runTurn(session, action) {
  const s = JSON.parse(JSON.stringify(session)) // immutable-style clone
  s.turn++
  const scores = scoreText(action.text)
  const tilt   = action.kind === 'event'
    ? clamp(textTilt(action.text) + .04, .12, .88)
    : textTilt(action.text)
  const weight = action.kind === 'argument' ? 12 : action.kind === 'event' ? 16 : 10
  const before = s.globalBelief
  const responses = []

  s.agents = s.agents.map((agent, i) => {
    const delta      = applyInfluence(agent, scores, tilt, weight, action.kind, action.targetId)
    const newBelief  = clamp(agent.belief + delta)
    const band       = newBelief > 62 ? 'high' : newBelief < 38 ? 'low' : 'mid'
    const line       = pick(STANCES[agent.id][band], s.turn + i)
    const changed    = rnd(newBelief - agent.belief)
    const strongest  = Object.entries(scores).sort((a,b) => b[1]-a[1])[0][0]
    const leaning    = changed > 2 ? 'moved toward support' : changed < -2 ? 'resisted and pulled back' : 'barely moved'
    const targetNote = action.targetId === agent.id ? ' Direct attention amplified the update.' : ''
    const reasoning  = `${agent.name} ${leaning} — the "${strongest}" signal matched their trust profile at ${rnd(agent.trust[strongest]*100)}%.${action.kind==='event'?' Events hit harder than arguments.':' Arguments update through credibility.'}${targetNote}`

    responses.push({ id: agent.id, name: agent.name, color: agent.color, line, delta: changed, belief: rnd(newBelief), reasoning })

    return {
      ...agent, belief: newBelief, lastDelta: changed, quote: line, reasoning,
      resistance: clamp(agent.resistance + (Math.abs(changed) > 6 ? 5 : -2), 18, 86)
    }
  })

  s.globalBelief = avg(s.agents)
  const spread = Math.max(...s.agents.map(a => a.belief)) - Math.min(...s.agents.map(a => a.belief))
  const intensity = Math.abs(s.globalBelief - before)

  if (spread > 26)       s.mood = 'polarized'
  else if (intensity>16) s.mood = 'charged'
  else if (s.globalBelief > 62) s.mood = 'receptive'
  else if (s.globalBelief < 38) s.mood = 'defensive'
  else                   s.mood = 'open'

  const gDelta = s.globalBelief - before
  const dir    = gDelta > 0 ? 'raised' : gDelta < 0 ? 'lowered' : 'held'
  const moodText = {
    polarized:  'The room polarized: agents updated in opposite directions.',
    charged:    'The room became charged: your input created visible movement.',
    receptive:  'The room became receptive: agents are treating change as legitimate.',
    defensive:  'The room went defensive: the discussion increased caution.',
    open:       'The room stayed open: beliefs shifted without hardening.'
  }[s.mood]

  const worldReact = `Your ${action.kind} ${dir} global belief by ${Math.abs(gDelta)} pts. ${moodText} Spread: ${rnd(spread)} pts.`
  const title      = action.kind === 'argument' ? 'Your argument' : action.kind === 'event' ? 'Event injected' : 'Targeted persuasion'

  s.log.unshift({ type: action.kind, title, body: action.text, turn: s.turn, gDelta, worldReact, responses, targetId: action.targetId || null })
  s.history.push(snap(s.agents, s.turn, title))
  return s
}

export function debateStep(session) {
  return runTurn(session, {
    kind: 'debate',
    text: session.globalBelief > 55
      ? 'The conversation absorbs recent pressure and tests whether support can become consensus.'
      : 'The conversation probes uncertainty, risk, and whether the case for change is durable.',
    targetId: null
  })
}
