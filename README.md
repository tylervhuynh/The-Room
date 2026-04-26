# The Room

> A 4-agent social simulation where you intervene in living belief systems and watch real-time persuasion and resistance unfold.

---

## What is The Room?

The Room places you inside a living argument. Four personas — an Activist, a Traditionalist, a Neutral Observer, and an Authority Figure — each hold their own beliefs, trust profiles, and resistance to change on any topic you choose.

You are the fifth force. Inject an argument, trigger a real-world event, or go one-on-one with the hardest person in the room to convince. Watch belief shift, resistance harden, and the conversation polarize or converge in real time.

Every word you choose gets scored. Rights language moves some people and alienates others. Data persuades the Observer but barely touches the Skeptic. Authority signals unlock the politician but frustrate the Activist. The Room teaches you — through play — that persuasion isn't about being right. It's about speaking the right language to the right person at the right moment.

---

## Features

- **4 archetypal agents** — each with unique volatility, resistance, and trust profiles across 5 rhetorical dimensions
- **3 intervention modes** — make a general argument, inject a world event, or target a specific agent with direct persuasion
- **Belief physics engine** — deterministic simulation of how rhetoric moves people based on their psychology
- **AI-generated dialogue** — K2 Think generates in-character quotes and reasoning grounded in the actual belief numbers
- **Real-time orb visualization** — floating agent orbs reflect live belief states
- **Mood system** — the room shifts between open, charged, receptive, defensive, and polarized states
- **Belief history chart** — track how global and individual beliefs evolve over time

---

## The Agents

| Agent | Starting Belief | Volatility | Trusts Most | Resists Most |
|---|---|---|---|---|
| Activist | ~76% | 1.22 (highest) | Rights (1.25) | Stability (0.35) |
| Traditionalist | ~34% | 0.74 (lowest) | Stability (1.28) | Rights (0.35) |
| Neutral Observer | ~52% | 0.90 | Evidence (1.20) | Popularity (0.45) |
| Authority Figure | ~48% | 0.82 | Authority (1.15) | Rights (0.55) |

---

## How the Belief Engine Works

When you submit any intervention, two things happen to your text:

**Dimension scoring** — your text is scanned for keywords across 5 dimensions:
- `evidence` — study, data, proof, research, expert, science
- `rights` — equal, fair, rights, justice, dignity, freedom
- `stability` — risk, cost, tradition, jobs, order, security
- `authority` — law, court, government, policy, institution
- `popularity` — viral, protest, movement, public, media, crowd

**Tilt calculation** — positive and negative valence words determine whether your force pushes belief up or down.

These combine into an influence formula applied to each agent:

```
delta = direction × weight × normalizedTrust × volatility × targetBoost × modeBoost × resistanceDrag
```

- Events carry the highest weight (16), arguments (12), persuasion (10)
- Targeted persuasion adds a 1.7× boost to the chosen agent
- Resistance increases when agents are pushed hard, making them harder to shift over time
- Identity snapback pulls agents back when deltas exceed 8 points

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, vanilla `http` module |
| Frontend | React, Vite |
| AI Dialogue | K2 Think (MBZUAI-IFM/K2-Think-v2) |
| Styling | CSS, custom design system |
| Deployment | Railway |

---

## Project Structure

```
the-room/
├── backend/
│   ├── public/          ← Vite build output (served statically)
│   ├── server.js        ← Node.js HTTP server + belief engine + K2 Think integration
│   ├── package.json
│   └── .env             ← API keys (not committed)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AgentOrb.jsx
│   │   │   ├── CenterPanel.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── LeftPanel.jsx
│   │   │   └── RightPanel.jsx
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── gameLogic.js
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── package.json         ← Root scripts for Railway
├── server.js            ← Root entry (delegates to backend)
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- A K2 Think API key (get one at [k2think.ai](https://k2think.ai)) — optional, the simulation runs without it using heuristic fallback dialogue

### Installation

```bash
# Clone the repo
git clone https://github.com/tylervhuynh/HackTech2026.git
cd HackTech2026/the-room

# Install root dependencies
npm install

# Install and build the frontend
npm run build
```

### Environment Setup

Create a `.env` file inside the `backend/` folder:

```
K2_API_KEY=your_key_here
HOST=127.0.0.1
PORT=3000
```

### Running Locally

```bash
# Start the backend server
npm run dev:backend

# In a separate terminal, start the frontend dev server
npm run dev:frontend
```

Or to run the production build locally:

```bash
npm run build
npm start
```

---

## Deployment

The Room is deployed on Railway. The root `package.json` handles the full build and start pipeline:

```json
{
  "scripts": {
    "build": "npm install --prefix frontend && npm run build --prefix frontend",
    "start": "node backend/server.js"
  }
}
```

The Vite build outputs to `backend/public/`, which `server.js` serves as static files alongside the API routes.

### Required Environment Variables on Railway

```
K2_API_KEY=your_key_here
HOST=0.0.0.0
PORT=3000
```

---

## Inspiration

When challenged to think about how individuals interact in a society and how we arrive at certain conclusions, we wanted to model how people discuss, argue, and maybe even agree on different polarizing subjects. We wanted to show that no matter our backgrounds, we all have the power to change each other's minds — and that the way we say something matters just as much as what we say.

---

## What We Learned

Building a system that scores rhetoric across five dimensions forced us to think rigorously about why the same fact lands differently depending on who hears it. We learned that framing matters as much as content, and that layering an LLM narrative system on top of a deterministic simulation requires keeping the AI honest — the narrative gives the numbers a voice, but never overrides the math.

---

## What's Next

- **Custom personas** — let users build agents with their own trust profiles and starting beliefs
- **Historical scenarios** — simulate opinion shifts on women's suffrage, civil rights, or climate change with era-appropriate rhetoric
- **Multiplayer mode** — multiple users as competing fifth forces in the same room
- **Training tool** — structured exercises for negotiators, educators, and communicators

---

## AI Usage & Credits

In compliance with MLH rules, here is a full accounting of every AI tool and framework used in this project:

### AI Tools Used

| Tool | How we used it |
|---|---|
| **K2 Think (MBZUAI-IFM/K2-Think-v2)** | Integrated directly into the backend via the K2 Think API. Used at runtime to generate in-character agent dialogue and reasoning after each simulation turn. The belief physics engine runs first and produces numerical outputs; K2 Think then narrates those outputs in each agent's voice. K2 Think does not control belief values — it only generates text. |
| **Claude (Anthropic)** | Used during development as a coding assistant — helping debug the belief engine, structure the React frontend, fix deployment configuration for Railway, and draft written content including this README, the elevator pitch, and the Devpost writeup sections. All core simulation logic, agent design, and system architecture were conceived and built by the team. |

### What We Built vs. What Was Generated

**Built by the team:**
- The belief physics engine (`gameLogic.js`, `server.js`) — all formulas for influence, resistance, volatility, identity snapback, and mood calculation
- The 4-agent persona system — trust profiles, starting beliefs, and rhetorical dimension design
- The 5-force intervention system — argument, event, and targeted persuasion mechanics
- The React frontend — component architecture, orb visualization, and UI design
- The K2 Think integration — prompt engineering, streaming response parsing, JSON extraction, and fallback logic
- The deployment pipeline — Railway configuration and repo structure

**Generated or assisted by AI:**
- In-runtime agent dialogue and reasoning (K2 Think, per turn)
- Portions of written documentation and Devpost copy (Claude)
- Debugging assistance and code review suggestions (Claude)

---

### Open Source Frameworks & Libraries

| Framework / Library | Purpose |
|---|---|
| **React** | Frontend UI framework |
| **Vite** | Frontend build tool and dev server |
| **Node.js** | Backend runtime |
| **@vitejs/plugin-react** | React support in Vite |

No other third-party libraries were used. The belief simulation engine, HTTP server, and all game logic are written in vanilla JavaScript with no additional dependencies.

---

## Team

Built by Raegen Ellis and Tyler Huynh at HackTech 2026.

---

## License

MIT
