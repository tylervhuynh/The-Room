const state = {
  session: null,
  kind: "argument"
};

const $ = (selector) => document.querySelector(selector);

const topicForm = $("#topic-form");
const topicInput = $("#topic-input");
const globalValue = $("#global-value");
const globalMeter = $("#global-meter");
const moodDot = $("#mood-dot");
const moodLabel = $("#mood-label");
const turnValue = $("#turn-value");
const agentsEl = $("#agents");
const targetSelect = $("#target-select");
const inputText = $("#input-text");
const sendButton = $("#send-button");
const stepButton = $("#step-button");
const logEl = $("#log");
const reasoningEl = $("#reasoning");
const hint = $("#hint");
const canvas = $("#history");
const ctx = canvas.getContext("2d");

const hints = {
  argument: "Your argument becomes a new social force with its own influence weight.",
  event: "Events hit every agent at once, but each role interprets the shock differently.",
  persuasion: "Targeted persuasion reveals one agent's internal reasoning and amplifies your effect."
};

async function api(path, payload = {}) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

async function start(topic) {
  state.session = await api("/api/session", { topic });
  inputText.value = "";
  render();
}

async function intervene() {
  const text = inputText.value.trim();
  if (!text) return;
  const payload = {
    kind: state.kind,
    text,
    targetId: state.kind === "persuasion" ? targetSelect.value : null
  };
  state.session = await api(`/api/session/${state.session.id}/intervene`, payload);
  inputText.value = "";
  render();
}

async function stepDebate() {
  state.session = await api(`/api/session/${state.session.id}/step`);
  render();
}

function render() {
  const session = state.session;
  if (!session) return;
  globalValue.textContent = `${session.globalBelief}%`;
  globalMeter.style.width = `${session.globalBelief}%`;
  turnValue.textContent = `Turn ${session.turn}`;
  moodLabel.textContent = session.mood;
  moodDot.style.background = moodColor(session.mood);
  renderAgents(session.agents);
  renderTargets(session.agents);
  renderLog(session.log);
  renderReasoning(session);
  drawHistory(session.history);
}

function renderAgents(agents) {
  agentsEl.innerHTML = agents.map((agent) => `
    <article class="agent" style="--agent-color:${agent.color}">
      <div class="agent-top">
        <div>
          <h2>${escapeHtml(agent.name)}</h2>
          <p>${escapeHtml(agent.role)}</p>
        </div>
        <span class="delta ${agent.lastDelta > 0 ? "up" : agent.lastDelta < 0 ? "down" : ""}">
          ${agent.lastDelta > 0 ? "+" : ""}${agent.lastDelta}
        </span>
      </div>
      <div class="meter"><span style="width:${Math.round(agent.belief)}%; background:${agent.color}"></span></div>
      <p>${Math.round(agent.belief)}% support | resistance ${Math.round(agent.resistance)}%</p>
    </article>
  `).join("");
}

function renderTargets(agents) {
  const previous = targetSelect.value;
  targetSelect.innerHTML = agents.map((agent) => `<option value="${agent.id}">${escapeHtml(agent.name)}</option>`).join("");
  if (previous) targetSelect.value = previous;
}

function renderLog(log) {
  logEl.innerHTML = log.map((entry) => `
    <article class="entry">
      <h3>${escapeHtml(entry.title)} · Turn ${entry.turn}</h3>
      <p>${escapeHtml(entry.body)}</p>
      ${entry.responses ? `<div class="responses">${entry.responses.map((response) => `
        <div class="quote">
          <strong><span>${escapeHtml(response.name)}</span><span>${response.delta > 0 ? "+" : ""}${response.delta}</span></strong>
          <p>${escapeHtml(response.line)}</p>
        </div>
      `).join("")}</div>` : ""}
    </article>
  `).join("");
}

function renderReasoning(session) {
  const latest = session.log[0];
  const agentReasons = session.agents.map((agent) => `
    <article class="entry">
      <h3>${escapeHtml(agent.name)}</h3>
      <p>${escapeHtml(agent.reasoning)}</p>
    </article>
  `).join("");

  reasoningEl.innerHTML = `
    <article class="entry">
      <h3>World reacts to you</h3>
      <p>${escapeHtml(latest?.explanation || "The system is waiting for your first force.")}</p>
    </article>
    ${agentReasons}
  `;
}

function drawHistory(history) {
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#fffaf1";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#dfd5c7";
  ctx.lineWidth = 1;
  for (let y = 20; y < height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  if (history.length < 2) {
    drawPoint(width / 2, height - (history[0].globalBelief / 100) * height);
    return;
  }
  ctx.strokeStyle = "#c84f43";
  ctx.lineWidth = 4;
  ctx.beginPath();
  history.forEach((point, index) => {
    const x = 18 + (index / Math.max(1, history.length - 1)) * (width - 36);
    const y = height - 16 - (point.globalBelief / 100) * (height - 32);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  const last = history[history.length - 1];
  drawPoint(width - 18, height - 16 - (last.globalBelief / 100) * (height - 32));
}

function drawPoint(x, y) {
  ctx.fillStyle = "#1d2328";
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
}

function moodColor(mood) {
  return {
    polarized: "#c84f43",
    charged: "#b28532",
    receptive: "#61724b",
    defensive: "#7c5968",
    open: "#2f7dbd"
  }[mood] || "#667078";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    state.kind = tab.dataset.kind;
    targetSelect.classList.toggle("hidden", state.kind !== "persuasion");
    hint.textContent = hints[state.kind];
    inputText.placeholder = state.kind === "event"
      ? "A major protest occurs after leaked documents reveal hidden costs."
      : state.kind === "persuasion"
        ? "A cautious policy can protect people without freezing progress."
        : "What if the public benefits outweigh the risks when rules are transparent?";
  });
});

topicForm.addEventListener("submit", (event) => {
  event.preventDefault();
  start(topicInput.value.trim() || "AI regulation");
});

sendButton.addEventListener("click", intervene);
stepButton.addEventListener("click", stepDebate);
inputText.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") intervene();
});

start(topicInput.value);
