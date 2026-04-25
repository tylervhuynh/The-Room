export const HINTS = {
  argument: { icon: '💬', text: 'Your argument enters the room as a new social force with its own influence weight and dimension score.' },
  event: { icon: '⚡', text: 'Events hit every orb at once, but each role reads the shock through a different trust profile.' },
  persuasion: { icon: '🎯', text: 'Targeted persuasion amplifies your effect on one orb and exposes more of its internal reasoning.' },
}

export const PLACEHOLDERS = {
  argument: 'What if open rules create more trust than bans?',
  event: 'A major protest occurs after leaked documents reveal hidden costs.',
  persuasion: 'A cautious policy can protect people without freezing progress.',
}

export const ORB_LAYOUT = {
  activist: { x: '9%', y: '10%', size: 'clamp(170px,18vw,214px)', duration: '10.5s', delay: '-1.4s' },
  observer: { x: '69%', y: '9%', size: 'clamp(166px,17vw,210px)', duration: '11.8s', delay: '-3.8s' },
  traditionalist: { x: '10%', y: '56%', size: 'clamp(168px,18vw,212px)', duration: '12.4s', delay: '-6.1s' },
  authority: { x: '68%', y: '55%', size: 'clamp(164px,17vw,206px)', duration: '10.9s', delay: '-2.6s' },
}

export const MOOD_COLORS = {
  polarized: '#e8503a',
  charged: '#d4a843',
  receptive: '#5fa86b',
  defensive: '#9b7fe8',
  open: '#4a8fd4',
}

export const rnd = (value) => Math.round(value)

export function alphaColor(hex, alpha) {
  const value = hex.replace('#', '')
  const full = value.length === 3 ? value.split('').map((char) => char + char).join('') : value
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
