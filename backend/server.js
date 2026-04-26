const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

loadEnvFile(path.join(__dirname, ".env"));

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "127.0.0.1";
const PUBLIC_DIR = path.join(__dirname, "public");
const sessions = new Map();

const K2_API_URL = process.env.K2_API_URL || "https://api.k2think.ai/v1/chat/completions";
const K2_MODEL = process.env.K2_MODEL || "MBZUAI-IFM/K2-Think-v2";
const K2_API_KEY = process.env.K2_API_KEY || process.env.K2THINK_API_KEY || process.env.K2_THINK_API_KEY || "";
const K2_TIMEOUT_MS = Number(process.env.K2_TIMEOUT_MS || 60000);

const MIME_TYPES = {
  ".css": "text/css",
  ".html": "text/html",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const round = (value) => Math.round(value);

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;

    let value = rawValue.trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value.replace(/\\n/g, "\n");
  }
}

const agentBlueprints = [
  {
    id: "activist",
    name: "Activist",
    role: "Pushes for collective action and systemic change.",
    base: 76,
    volatility: 1.22,
    trust: { evidence: 0.7, rights: 1.25, stability: 0.35, authority: 0.4, popularity: 1.1 },
    color: "#c84f6a"
  },
  {
    id: "traditionalist",
    name: "Traditionalist",
    role: "Defends existing foundations and warns of unintended consequences.",
    base: 34,
    volatility: 0.74,
    trust: { evidence: 0.6, rights: 0.35, stability: 1.28, authority: 1.1, popularity: 0.5 },
    color: "#c4794a"
  },
  {
    id: "observer",
    name: "Neutral Observer",
    role: "Converses through data, logic, and objectivity.",
    base: 52,
    volatility: 0.90,
    trust: { evidence: 1.20, rights: 0.7, stability: 0.8, authority: 0.6, popularity: 0.45 },
    color: "#4a7fd4"
  },
  {
    id: "authority",
    name: "Politician",
    role: "Navigates consensus, optics, and institutional viability.",
    base: 48,
    volatility: 0.82,
    trust: { evidence: 0.8, rights: 0.55, stability: 1.0, authority: 1.15, popularity: 1.2 },
    color: "#4fa878"
  }
];

function makeAiState({ provider, error = null }) {
  return {
    provider,
    model: provider === "k2think" ? K2_MODEL : "Local heuristics",
      configured: Boolean(K2_API_KEY),
      error
  };
}

const K2_CONFIG_HINT = "Set K2THINK_API_KEY in .env or K2_API_KEY in your environment to enable K2 Think-generated dialogue.";

function trimText(value, maxLength) {
  return String(value || "")
    .replace(/```json\s*/gi, "")
    .replace(/```/g, "")
    .trim()
    .slice(0, maxLength);
}

function stripThinkBlocks(text) {
  // K2-Think emits <think>...</think> chain-of-thought before the JSON answer.
  // Use greedy match so nested/repeated think blocks are fully consumed.
  // Also strip any leftover markdown code fences (```json ... ```) that
  // appear outside think blocks before JSON extraction.
  let result = text;

  // Greedy strip: remove everything from the first <think> to the LAST </think>
  result = result.replace(/<think>[\s\S]*<\/think>/gi, "");

  // If no closing tag, strip everything after an unclosed <think>
  result = result.replace(/<think>[\s\S]*/gi, "");

  // Strip markdown code fences that may wrap the JSON
  result = result.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "");

  return result.trim();
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

function makeSession(topic) {
  const seed = topic.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const agents = agentBlueprints.map((blueprint, index) => {
    const drift = ((seed + index * 17) % 13) - 6;
    const belief = clamp(blueprint.base + drift);
    return {
      ...blueprint,
      belief,
      resistance: blueprint.id === "traditionalist" ? 64 : blueprint.id === "authority" ? 52 : 38,
      lastDelta: 0,
      quote: "Considering the question…",
      reasoning: "Forming initial position."
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
    history: [],
    ai: K2_API_KEY
      ? makeAiState({ provider: "k2think" })
      : makeAiState({ provider: "fallback", error: K2_CONFIG_HINT })
  };
  session.log.push({
    type: "system",
    title: "Simulation initialized",
    body: `The Room opens around "${topic}".`,
    turn: 0
  });
  session.history.push(snapshot(session, "Start"));
  return session;
}

async function generateOpeningLines(session) {
  if (!K2_API_KEY) {
    // Fallback: minimal topic-aware placeholder
    session.agents = session.agents.map((agent) => ({
      ...agent,
      quote: `My initial read on ${session.topic}: the stakes are real and my position reflects my values.`,
      reasoning: "Initial position formed from role incentives and perceived social risk."
    }));
    return session;
  }

  const messages = [
    {
      role: "system",
      content: [
        "You are the narrator of The Room — a belief simulation where four archetypal voices react to a topic.",
        "Think through each agent's core psychology, values, and likely gut reaction to the specific topic before writing.",
        "After reasoning, return ONLY a strict JSON object — no markdown, no code fences, no extra text.",
        "Schema: {\"agents\":[{\"id\":\"string\",\"line\":\"string\",\"reasoning\":\"string\"}]}",
        "Rules: each 'line' is the agent's opening statement — one vivid, in-character sentence that reacts to THIS specific topic.",
        "Each 'reasoning' is one sentence explaining their psychological starting point.",
        "Lines must sound like real people, not archetypes. Make them specific to the topic, not generic.",
        "Never invent new agent IDs. Return exactly the agents provided."
      ].join(" ")
    },
    {
      role: "user",
      content: JSON.stringify({
        topic: session.topic,
        roomMood: session.mood,
        agents: session.agents.map((agent) => ({
          id: agent.id,
          name: agent.name,
          role: agent.role,
          belief: round(agent.belief),
          resistance: round(agent.resistance)
        }))
      })
    }
  ];

  try {
    const raw = await callK2Think(messages);
    const parsed = JSON.parse(extractJsonObject(raw));
    const generatedMap = new Map(
      Array.isArray(parsed.agents) ? parsed.agents.map((a) => [a.id, a]) : []
    );
    session.agents = session.agents.map((agent) => {
      const gen = generatedMap.get(agent.id) || {};
      return {
        ...agent,
        quote: trimText(gen.line, 200) || agent.quote,
        reasoning: trimText(gen.reasoning, 260) || agent.reasoning
      };
    });
    session.ai = makeAiState({ provider: "k2think" });
  } catch (error) {
    console.error("[K2Think] generateOpeningLines failed:", error.message);
    session.ai = makeAiState({ provider: "fallback", error: error.message });
  }

  return session;
}

function updateMood(session, intensity, polarization) {
  if (polarization > 26) session.mood = "polarized";
  else if (intensity > 16) session.mood = "charged";
  else if (session.globalBelief > 62) session.mood = "receptive";
  else if (session.globalBelief < 38) session.mood = "defensive";
  else session.mood = "open";
}

function extractJsonObject(text) {
  // K2-Think emits chain-of-thought prose (sometimes including example JSON
  // snippets with "..." placeholders) before the real answer. The real JSON
  // is always the LAST complete {...} object in the output, so scan from the
  // end rather than the start.
  let depth = 0;
  let inString = false;
  let escaped = false;
  let end = -1;

  // Find the last '}' that closes a top-level object
  for (let i = text.length - 1; i >= 0; i--) {
    if (text[i] === "}" && !inString) { end = i; break; }
  }
  if (end === -1) {
    console.error("[K2Think] extractJsonObject: no '}' found. Raw (first 400 chars):", text.slice(0, 400));
    throw new Error("K2 Think did not return JSON.");
  }

  // Walk backwards from end to find the matching '{'
  inString = false;
  escaped = false;
  depth = 0;
  for (let i = end; i >= 0; i--) {
    const char = text[i];
    if (char === "}" && !inString) depth++;
    if (char === "{" && !inString) {
      depth--;
      if (depth === 0) {
        const candidate = text.slice(i, end + 1);
        try {
          JSON.parse(candidate);
          return candidate;
        } catch {
          // This { wasn't the right one (e.g. inside a string) — keep scanning
          end = i - 1;
          i = end;
          depth = 0;
          if (end < 0) break;
        }
      }
    }
    // Track strings going backwards (simplified — handles common cases)
    if (char === "\"" && (i === 0 || text[i - 1] !== "\\")) inString = !inString;
  }

  console.error("[K2Think] extractJsonObject: no valid JSON object found. Raw (first 400 chars):", text.slice(0, 400));
  throw new Error("K2 Think did not return JSON.");
}

async function callK2Think(messages, attempt = 1) {
  if (!K2_API_KEY) throw new Error(K2_CONFIG_HINT);

  const body = JSON.stringify({
    model: K2_MODEL,
    messages,
    stream: true
  });

  return new Promise((resolve, reject) => {
    const url = new URL(K2_API_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: "POST",
      headers: {
        "Authorization": `Bearer ${K2_API_KEY}`,
        "Content-Type": "application/json",
        "accept": "application/json",
        "Content-Length": Buffer.byteLength(body)
      },
      timeout: K2_TIMEOUT_MS
    };

    const req = require("https").request(options, (res) => {
      console.log("[K2Think] response status:", res.statusCode);
      console.log("[K2Think] response content-type:", res.headers["content-type"]);

      if (res.statusCode !== 200) {
        let errBody = "";
        res.on("data", (chunk) => { errBody += chunk; });
        res.on("end", () => {
          const msg = `K2 Think ${res.statusCode}: ${errBody.slice(0, 300)}`;
          if (attempt < 2 && (res.statusCode === 429 || res.statusCode >= 500)) {
            console.warn(`[K2Think] ${res.statusCode} on attempt ${attempt}, retrying…`);
            setTimeout(() => callK2Think(messages, attempt + 1).then(resolve).catch(reject), 1500);
          } else {
            reject(new Error(msg));
          }
        });
        return;
      }

      let buffer = "";
      let output = "";

      res.on("data", (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop(); // keep incomplete last line
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          if (!data || data === "[DONE]") continue;
          try {
            const payload = JSON.parse(data);
            output += payload?.choices?.[0]?.delta?.content
                   || payload?.choices?.[0]?.message?.content
                   || payload?.choices?.[0]?.text
                   || "";
          } catch {
            // partial JSON chunk — will complete on next data event
          }
        }
      });

      res.on("end", () => {
        // drain any remaining buffer
        if (buffer.trim().startsWith("data:")) {
                const lines = buffer.split("\n");
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (!data || data === "[DONE]") continue;
            try {
              const payload = JSON.parse(data);
              output += payload?.choices?.[0]?.delta?.content
                    || payload?.choices?.[0]?.message?.content
                    || payload?.choices?.[0]?.text
                    || "";
            } catch { /* ignore */ }
          }
        }
        console.log("[K2Think] stream complete, output length:", output.length, "first 200:", output.slice(0, 200));
        resolve(stripThinkBlocks(output));
      });

      res.on("error", reject);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`K2 Think request timed out after ${K2_TIMEOUT_MS}ms`));
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function runTurn(session, action) {
  session.turn += 1;
  const before = session.globalBelief;

  const messages = [
    {
      role: "system",
      content: [
        "You are the simulation engine for The Room — a belief dynamics model.",
        "Given a topic, an action, and four agents with psychological profiles, compute belief updates using rigorous simulation logic.",
        "Consider: argument framing, each agent's trust weights across dimensions (evidence/rights/stability/authority/popularity), volatility, resistance, and identity snap-back.",
        "Dimension scoring: analyze the action text and score how strongly it invokes each dimension (0.0-2.0).",
        "Delta formula: direction × weight × normalizedTrust × volatility × targetBoost × modeBoost × resistanceDrag + identitySnapback.",
        "Clamp all belief values to 0-100. Round deltas to integers.",
        "Resistance increases by 5 if |delta| > 6, otherwise decreases by 2. Clamp resistance to 18-86.",
        "If speakerId matches agent id, belief nudges ±0.4 toward their pole (reinforcement), resistance drops by 1.",
        "After computing, write one vivid in-character quote per agent reacting to the action.",
        "Reasoning must also be plain English — one sentence explaining what psychologically drove the movement, written like a perceptive observer describing a person, not a formula readout.",
        "worldReact must read like a novelist describing the atmosphere in the room — one sentence, vivid and specific, not a summary of the numbers.",
        "Return ONLY strict JSON, no markdown, no code fences.",
        "Schema: {\"worldReact\":\"string\",\"dimensionScores\":{\"evidence\":number,\"rights\":number,\"stability\":number,\"authority\":number,\"popularity\":number},\"tilt\":number,\"agents\":[{\"id\":\"string\",\"belief\":number,\"delta\":number,\"resistance\":number,\"line\":\"string\",\"reasoning\":\"string\"}]}"
      ].join(" ")
    },
    {
      role: "user",
      content: JSON.stringify({
        topic: session.topic,
        turn: session.turn,
        mood: session.mood,
        globalBelief: round(session.globalBelief),
        action: {
          kind: action.kind,
          text: action.text,
          targetId: action.targetId || null,
          speakerId: action.speakerId || null,
          weight: action.kind === "argument" ? 12 : action.kind === "event" ? 16 : 10
        },
        agents: session.agents.map(a => ({
          id: a.id,
          name: a.name,
          role: a.role,
          belief: round(a.belief),
          resistance: round(a.resistance),
          volatility: a.volatility,
          trust: a.trust
        }))
      })
    }
  ];

  let responses = [];

  if (K2_API_KEY) {
    try {
      const raw = await callK2Think(messages);
      const parsed = JSON.parse(extractJsonObject(raw));

      session.agents = session.agents.map(agent => {
        const gen = (parsed.agents || []).find(a => a.id === agent.id) || {};
        const newBelief = clamp(gen.belief ?? agent.belief);
        const delta = gen.delta ?? 0;
        const resistance = clamp(gen.resistance ?? agent.resistance, 18, 86);

        responses.push({
          id: agent.id,
          name: agent.name,
          role: agent.role,
          color: agent.color,
          delta,
          belief: round(newBelief),
          resistance,
          reasoning: (gen.reasoning || "").slice(0, 300)
        });

        return {
          ...agent,
          belief: newBelief,
          lastDelta: delta,
          resistance,
          quote: (gen.line || agent.quote).slice(0, 200),
          reasoning: (gen.reasoning || agent.reasoning).slice(0, 300)
        };
      });

      session.globalBelief = averageBelief(session.agents);
      const spread = Math.max(...session.agents.map(a => a.belief)) - Math.min(...session.agents.map(a => a.belief));
      const globalDelta = session.globalBelief - before;
      updateMood(session, Math.abs(globalDelta), spread);

      const worldReact = (parsed.worldReact || worldReaction(session, action, spread, globalDelta)).slice(0, 300);
      session.ai = makeAiState({ provider: "k2think" });

      session.log.unshift({
        type: action.kind,
        title: action.kind === "argument" ? "User argument"
          : action.kind === "event" ? "Event injected"
          : action.kind === "persuasion" ? "Targeted persuasion"
          : "Room debate",
        body: action.text,
        targetId: action.targetId || null,
        turn: session.turn,
        globalDelta,
        explanation: worldReact,
        worldReact,
        ai: session.ai,
        responses: session.agents.map(a => ({
          id: a.id,
          name: a.name,
          color: a.color,
          line: a.quote,
          delta: a.lastDelta,
          belief: round(a.belief),
          reasoning: a.reasoning
        }))
      });
      session.history.push(snapshot(session, action.kind));
      return session;

    } catch (err) {
      console.error("[K2Think] runTurn failed, falling back:", err.message);
      session.ai = makeAiState({ provider: "fallback", error: err.message });
    }
  }

  // Fallback: original heuristic math
  const scores = scoreText(action.text);
  const tilt = action.kind === "event"
    ? clamp(textTilt(action.text) + 0.04, 0.12, 0.88)
    : textTilt(action.text);
  const weight = action.kind === "argument" ? 12 : action.kind === "event" ? 16 : 10;

  session.agents = session.agents.map(agent => {
    if (action.speakerId === agent.id) {
      const newBelief = clamp(agent.belief + (agent.belief > 50 ? 0.4 : -0.4));
      const delta = round(newBelief - agent.belief);
      const resistance = clamp(agent.resistance - 1, 18, 86);
      responses.push({ id: agent.id, name: agent.name, role: agent.role, color: agent.color, delta, belief: round(newBelief), resistance, reasoning: `${agent.name} stated their position, reinforcing their own view.` });
      return { ...agent, belief: newBelief, lastDelta: delta, resistance, reasoning: `${agent.name} stated their position.` };
    }
    const delta = applyInfluence(agent, scores, tilt, weight, action.kind, action.targetId);
    const newBelief = clamp(agent.belief + delta);
    const changed = round(newBelief - agent.belief);
    const resistance = clamp(agent.resistance + (Math.abs(changed) > 6 ? 5 : -2), 18, 86);
    const reasoning = explainReason(agent, scores, changed, action.kind, action.targetId);
    responses.push({ id: agent.id, name: agent.name, role: agent.role, color: agent.color, delta: changed, belief: round(newBelief), resistance, reasoning });
    return { ...agent, belief: newBelief, lastDelta: changed, resistance, reasoning };
  });

  session.globalBelief = averageBelief(session.agents);
  const spread = Math.max(...session.agents.map(a => a.belief)) - Math.min(...session.agents.map(a => a.belief));
  const globalDelta = session.globalBelief - before;
  updateMood(session, Math.abs(globalDelta), spread);
  const fallbackWorldReact = worldReaction(session, action, spread, globalDelta);
  const narrative = await generateNarrative(session, action, responses, fallbackWorldReact, globalDelta, spread);
  const generatedById = new Map(narrative.agents.map(a => [a.id, a]));
  session.agents = session.agents.map(agent => {
    const gen = generatedById.get(agent.id);
    return gen ? { ...agent, quote: gen.line, reasoning: gen.reasoning } : agent;
  });

  session.ai = narrative.ai;
  session.log.unshift({
    type: action.kind,
    title: action.kind === "argument" ? "User argument" : action.kind === "event" ? "Event injected" : action.kind === "persuasion" ? "Targeted persuasion" : "Room debate",
    body: action.text,
    targetId: action.targetId || null,
    turn: session.turn,
    globalDelta,
    explanation: fallbackWorldReact,
    worldReact: fallbackWorldReact,
    ai: session.ai,
    responses: session.agents.map(a => ({ id: a.id, name: a.name, color: a.color, line: a.quote, delta: a.lastDelta, belief: round(a.belief), reasoning: a.reasoning }))
  });
  session.history.push(snapshot(session, action.kind));
  return session;
}

async function debateStep(session) {
  session.agents = session.agents.map(a => ({
    ...a,
    resistance: clamp(a.resistance - 3, 18, 86)
  }));
  const average = session.globalBelief;
  const speaker = session.agents.reduce((most, agent) =>
    Math.abs(agent.belief - average) > Math.abs(most.belief - average) ? agent : most
  );
  const stance = speaker.belief > 50 ? "support" : "oppose";
  return runTurn(session, {
    kind: "debate",
    text: `${speaker.name} (${speaker.role}) speaks to ${stance} the position on ${session.topic}.`,
    targetId: null,
    speakerId: speaker.id
  });
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

    const type = MIME_TYPES[path.extname(filePath)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "POST" && req.url === "/api/session") {
      const body = await readBody(req);
      const session = makeSession(trimText(body.topic || "AI regulation", 80) || "AI regulation");
      await generateOpeningLines(session);
      sessions.set(session.id, session);
      sendJson(res, 201, session);
      return;
    }

    const actionMatch = req.url.match(/^\/api\/session\/([^/]+)\/(intervene|step)$/);
    if (req.method === "POST" && actionMatch) {
      const session = sessions.get(actionMatch[1]);
      if (!session) {
        sendJson(res, 404, { error: "Session not found" });
        return;
      }

      if (actionMatch[2] === "step") {
        sendJson(res, 200, await debateStep(session));
        return;
      }

      const body = await readBody(req);
      const text = trimText(body.text, 500);
      if (!text) {
        sendJson(res, 400, { error: "Intervention text is required." });
        return;
      }

      const updated = await runTurn(session, {
        kind: body.kind,
        text,
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
  console.log(`The Room running at http://localhost:${PORT}`);
});

// Export the handler for Vercel serverless
module.exports = server;