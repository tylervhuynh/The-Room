const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "127.0.0.1";
const PUBLIC_DIR = path.join(__dirname, "public");
const sessions = new Map();

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const round = (value) => Math.round(value);
const pick = (items, index) => items[Math.abs(index) % items.length];

const agentBlueprints = [
  {
    id: "activist",
    name: "Activist",
    role: "Pushes moral urgency and collective action.",
    base: 76,
    volatility: 1.22,
    trust: { evidence: 0.9, rights: 1.25, stability: 0.35, authority: 0.45, popularity: 0.72 },
    color: "#e5484d"
  },
  {
    id: "traditionalist",
    name: "Traditionalist / skeptic",
    role: "Defends continuity, caution, and social costs.",
    base: 34,
    volatility: 0.74,
    trust: { evidence: 0.62, rights: 0.35, stability: 1.28, authority: 0.82, popularity: 0.5 },
    color: "#9b6a2f"
  },
  {
    id: "observer",
    name: "Neutral observer",
    role: "Tracks evidence, uncertainty, and second-order effects.",
    base: 52,
    volatility: 0.9,
    trust: { evidence: 1.2, rights: 0.72, stability: 0.72, authority: 0.66, popularity: 0.45 },
    color: "#2f7dbd"
  },
  {
    id: "authority",
    name: "Authority figure",
    role: "Balances legitimacy, institutions, and public pressure.",
    base: 48,
    volatility: 0.82,
    trust: { evidence: 0.95, rights: 0.55, stability: 0.92, authority: 1.15, popularity: 0.9 },
    color: "#61724b"
  }
];

const stances = {
  activist: {
    high: ["The old consensus is already breaking. Delay is a choice with consequences.", "People closest to the harm should not need permission to be believed."],
    mid: ["This could move, but pressure has to be public enough to make neutrality costly.", "The question is not whether change is comfortable. It is whether the current system is defensible."],
    low: ["I am not convinced the room understands the stakes yet. The moral case needs sharper force.", "If the public cannot see who is harmed, the status quo keeps winning by default."]
  },
  traditionalist: {
    high: ["I can accept reform when the guardrails are visible and the costs are named.", "The case is becoming harder to dismiss, but speed still matters."],
    mid: ["I need proof that this will not damage institutions people rely on.", "Good intentions are not a plan. What happens after the slogan?"],
    low: ["This feels like pressure without responsibility. I am digging in until the risks are answered.", "Societies can break things faster than they can repair them."]
  },
  observer: {
    high: ["The evidence and public mood are converging. Resistance now needs a stronger factual basis.", "Belief is moving because the claims are becoming testable, not just emotional."],
    mid: ["The system is unstable. One strong event or argument could tip the average belief.", "Both sides are supplying partial truths. The uncertainty is still doing real work."],
    low: ["The debate is producing more heat than information. I would expect defensive sorting next.", "Without clearer evidence, people are updating from identity more than facts."]
  },
  authority: {
    high: ["A policy window is opening. Public legitimacy is moving faster than institutions.", "The pressure is now broad enough that leadership has to respond."],
    mid: ["I am watching whether this becomes durable public demand or a temporary surge.", "Any action needs a coalition, not just a winning argument."],
    low: ["The political risk still outweighs the mandate. I would wait.", "If this becomes polarizing, institutions will choose containment over endorsement."]
  }
};

const dimensions = {
  evidence: ["study", "data", "proof", "research", "expert", "science", "scientific", "measurable", "record"],
  rights: ["equal", "fair", "rights", "justice", "dignity", "freedom", "harm", "voice", "workforce"],
  stability: ["risk", "cost", "tradition", "family", "jobs", "order", "stability", "security", "disruption"],
  authority: ["law", "court", "government", "official", "policy", "institution", "leader", "regulation"],
  popularity: ["viral", "protest", "movement", "public", "media", "crowd", "election", "majority"]
};

function scoreText(text) {
  const lower = text.toLowerCase();
  const scores = Object.fromEntries(Object.keys(dimensions).map((key) => [key, 0]));
  for (const [dimension, words] of Object.entries(dimensions)) {
    for (const word of words) {
      if (lower.includes(word)) scores[dimension] += 1;
    }
  }
  if (!Object.values(scores).some(Boolean)) {
    scores.evidence = 0.55;
    scores.rights = 0.55;
  }
  return scores;
}

function textTilt(text) {
  const lower = text.toLowerCase();
  const negative = ["ban", "danger", "threat", "collapse", "fear", "crisis", "scandal", "backlash", "fraud", "violence"];
  const positive = ["equal", "benefit", "safe", "progress", "opportunity", "protect", "improve", "breakthrough", "support"];
  const neg = negative.filter((word) => lower.includes(word)).length;
  const pos = positive.filter((word) => lower.includes(word)).length;
  return clamp(0.5 + (pos - neg) * 0.13, 0.18, 0.82);
}

function makeSession(topic) {
  const seed = topic.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const agents = agentBlueprints.map((blueprint, index) => {
    const drift = ((seed + index * 17) % 13) - 6;
    return {
      ...blueprint,
      belief: clamp(blueprint.base + drift),
      resistance: blueprint.id === "traditionalist" ? 64 : blueprint.id === "authority" ? 52 : 38,
      lastDelta: 0,
      reasoning: "Initial position formed from role incentives and perceived social risk."
    };
  });
  const session = {
    id: crypto.randomUUID(),
    topic,
    turn: 0,
    mood: "open",
    globalBelief: averageBelief(agents),
    agents,
    log: [],
    history: []
  };
  session.log.push({
    type: "system",
    title: "Simulation initialized",
    body: `The room begins with four forces responding to "${topic}".`,
    turn: 0
  });
  session.history.push(snapshot(session, "Start"));
  return session;
}

function averageBelief(agents) {
  return round(agents.reduce((sum, agent) => sum + agent.belief, 0) / agents.length);
}

function snapshot(session, label) {
  return {
    turn: session.turn,
    label,
    globalBelief: session.globalBelief,
    agents: Object.fromEntries(session.agents.map((agent) => [agent.id, round(agent.belief)]))
  };
}

function updateMood(session, intensity, polarization) {
  if (polarization > 26) session.mood = "polarized";
  else if (intensity > 16) session.mood = "charged";
  else if (session.globalBelief > 62) session.mood = "receptive";
  else if (session.globalBelief < 38) session.mood = "defensive";
  else session.mood = "open";
}

function applyInfluence(agent, scores, tilt, weight, mode, targetId) {
  const trust = Object.entries(scores).reduce((sum, [dimension, score]) => sum + score * agent.trust[dimension], 0);
  const scoreTotal = Object.values(scores).reduce((sum, score) => sum + score, 0) || 1;
  const normalizedTrust = trust / scoreTotal;
  const direction = (tilt - 0.5) * 2;
  const targetBoost = targetId === agent.id ? 1.7 : 1;
  const modeBoost = mode === "event" ? 1.25 : mode === "persuasion" ? 1.45 : 1;
  const resistanceDrag = 1 - agent.resistance / 160;
  const delta = direction * weight * normalizedTrust * agent.volatility * targetBoost * modeBoost * resistanceDrag;
  const identitySnapback = Math.abs(delta) > 8 ? Math.sign(delta) * -agent.resistance * 0.025 : 0;
  return delta + identitySnapback;
}

function runTurn(session, action) {
  session.turn += 1;
  const scores = scoreText(action.text);
  const tilt = action.kind === "event" ? clamp(textTilt(action.text) + 0.04, 0.12, 0.88) : textTilt(action.text);
  const weight = action.kind === "argument" ? 12 : action.kind === "event" ? 16 : 10;
  const before = session.globalBelief;
  const responses = [];

  session.agents = session.agents.map((agent, index) => {
    const delta = applyInfluence(agent, scores, tilt, weight, action.kind, action.targetId);
    const newBelief = clamp(agent.belief + delta);
    const stanceBand = newBelief > 62 ? "high" : newBelief < 38 ? "low" : "mid";
    const line = pick(stances[agent.id][stanceBand], session.turn + index);
    const changed = round(newBelief - agent.belief);
    const reasoning = explainReason(agent, scores, changed, action.kind, action.targetId);
    responses.push({
      id: agent.id,
      name: agent.name,
      line,
      delta: changed,
      belief: round(newBelief),
      reasoning
    });
    return {
      ...agent,
      belief: newBelief,
      lastDelta: changed,
      resistance: clamp(agent.resistance + (Math.abs(changed) > 6 ? 5 : -2), 18, 86),
      reasoning
    };
  });

  session.globalBelief = averageBelief(session.agents);
  const spread = Math.max(...session.agents.map((agent) => agent.belief)) - Math.min(...session.agents.map((agent) => agent.belief));
  updateMood(session, Math.abs(session.globalBelief - before), spread);

  const title = action.kind === "argument" ? "User argument" : action.kind === "event" ? "Event injected" : "Targeted persuasion";
  session.log.unshift({
    type: action.kind,
    title,
    body: action.text,
    targetId: action.targetId || null,
    turn: session.turn,
    globalDelta: session.globalBelief - before,
    explanation: worldReaction(session, action, spread),
    responses
  });
  session.history.push(snapshot(session, title));
  return session;
}

function explainReason(agent, scores, delta, kind, targetId) {
  const strongest = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
  const leaning = delta > 2 ? "moved toward support" : delta < -2 ? "resisted and moved away" : "barely moved";
  const target = targetId === agent.id ? " Direct attention amplified the update." : "";
  return `${agent.name} ${leaning} because the ${strongest} signal matched their trust profile at ${Math.round(agent.trust[strongest] * 100)}%. ${kind === "event" ? "Events hit harder than arguments." : "Arguments update through credibility and identity."}${target}`;
}

function worldReaction(session, action, spread) {
  const global = session.log[0]?.globalDelta || 0;
  const direction = global > 0 ? "raised" : global < 0 ? "lowered" : "held";
  const texture = session.mood === "polarized"
    ? "The room polarized: agents updated in different directions and resistance rose."
    : session.mood === "charged"
      ? "The room became charged: your input created visible movement and some defensiveness."
      : session.mood === "receptive"
        ? "The room became more receptive: agents are treating change as legitimate."
        : session.mood === "defensive"
          ? "The room became defensive: the intervention increased caution."
          : "The room stayed open: beliefs shifted without hardening much.";
  return `Your ${action.kind} ${direction} the global belief by ${Math.abs(global)} points. ${texture} Current belief spread is ${round(spread)} points.`;
}

function debateStep(session) {
  const average = session.globalBelief;
  const action = {
    kind: "debate",
    text: average > 55 ? "The conversation absorbs recent pressure and tests whether support can become consensus." : "The conversation probes uncertainty, risk, and whether the case for change is durable."
  };
  return runTurn(session, action);
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString() || "{}");
}

function serveStatic(req, res) {
  const urlPath = req.url === "/" ? "/index.html" : decodeURIComponent(req.url);
  const filePath = path.normalize(path.join(PUBLIC_DIR, urlPath));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath);
    const type = ext === ".css" ? "text/css" : ext === ".js" ? "text/javascript" : "text/html";
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "POST" && req.url === "/api/session") {
      const body = await readBody(req);
      const session = makeSession(String(body.topic || "AI regulation").slice(0, 80));
      sessions.set(session.id, session);
      sendJson(res, 201, session);
      return;
    }

    const actionMatch = req.url.match(/^\/api\/session\/([^/]+)\/(intervene|step)$/);
    if (req.method === "POST" && actionMatch) {
      const session = sessions.get(actionMatch[1]);
      if (!session) return sendJson(res, 404, { error: "Session not found" });
      if (actionMatch[2] === "step") return sendJson(res, 200, debateStep(session));
      const body = await readBody(req);
      const updated = runTurn(session, {
        kind: body.kind,
        text: String(body.text || "").slice(0, 500),
        targetId: body.targetId || null
      });
      sendJson(res, 200, updated);
      return;
    }

    serveStatic(req, res);
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Social Physics Sim running at http://localhost:${PORT}`);
});
