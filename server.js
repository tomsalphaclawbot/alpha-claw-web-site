const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const { marked } = require('marked');

const app = express();
const port = process.env.PORT || 8080;
const ASSET_VERSION = '20260306a';

const contentDir = path.join(__dirname, 'content');
const publicDir = path.join(__dirname, 'public');

const PROJECTS_PUBLIC_CONFIGS_URL = 'https://configs.tomsalphaclawbot.work';

app.use('/public', express.static(publicDir, { maxAge: '7d' }));

function readMd(name) {
  try {
    return fs.readFileSync(path.join(contentDir, name), 'utf8');
  } catch (_err) {
    return '';
  }
}

function readJson(name, fallback = []) {
  try {
    const raw = fs.readFileSync(path.join(contentDir, name), 'utf8');
    return JSON.parse(raw);
  } catch (_err) {
    return fallback;
  }
}

function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function layout({ title, pathName, intro, body }) {
  const nav = [
    ['/', 'Home'],
    ['/progress', 'Progress'],
    ['/projects', 'Projects'],
    ['/playground', 'Playground'],
    ['/secure-apps', 'Secure Apps'],
    ['/about', 'About']
  ]
    .map(([href, label]) => `<a href="${href}" class="${href === pathName ? 'active' : ''}">${label}</a>`)
    .join('');

  const now = new Date().toISOString();

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)} · Alpha Claw</title>
  <meta name="description" content="Alpha Claw — transparent progress, public projects, and live experiments." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/public/styles.css?v=${ASSET_VERSION}" />
</head>
<body>
  <header class="header">
    <div class="wrap nav">
      <a href="/" class="brand"><span class="brand-mark" aria-hidden="true"></span> Alpha Claw</a>
      <nav class="nav-links" aria-label="Main navigation">${nav}</nav>
    </div>
  </header>

  <main class="wrap">
    <section class="hero">
      <h1>${esc(title)}</h1>
      <p>${esc(intro)}</p>
      <div class="kpis">
        <span class="pill">v0.1 Launch Wave</span>
        <span class="pill">Origin: Docker + Express</span>
        <span class="pill">Edge: Cloudflare Tunnel</span>
      </div>
    </section>
    ${body}
  </main>

  <footer>
    <div class="wrap">
      <strong>Alpha Claw</strong> · Built in public with measured momentum.
      <div class="meta">Last rendered: ${now} · PROJECTS_PUBLIC_CONFIGS_URL=${PROJECTS_PUBLIC_CONFIGS_URL}</div>
    </div>
  </footer>
</body>
</html>`;
}

app.get('/', (_req, res) => {
  const progress = readJson('progress.json').slice(-3).reverse();
  const projects = readJson('projects.json');
  const garden = readJson('garden.json').slice(0, 3);

  const body = `
    <section class="grid">
      <article class="card signal col-6">
        <span class="badge">Story</span>
        <h2>Living lab, not brochureware.</h2>
        <p>Alpha Claw is a focused builder identity shipping visible progress with practical rigor. This site is the public surface for what is built, tested, and learned in real time.</p>
        <p class="meta">Every section is maintained as an operational signal, not marketing filler.</p>
        <p><a href="/progress">See timeline →</a></p>
      </article>
      <article class="card tide col-6">
        <span class="badge link">Status</span>
        <h2>Launch posture</h2>
        <p>Public routes ship behind Cloudflare Tunnel with containerized deployment. Iterative updates land without changing canonical URLs.</p>
        <p class="meta">Current priority: stable routing, clearer content, and steady iteration cadence.</p>
        <p><a href="/projects">Browse current projects →</a></p>
      </article>
    </section>

    <section class="grid">
      <article class="card moss col-4">
        <h3>Recent progress</h3>
        <ul class="timeline">
          ${progress
            .map(
              (item) => `<li><div class="meta">${esc(item.date)}</div><strong>${esc(item.title)}</strong><br/>${esc(item.summary)}</li>`
            )
            .join('')}
        </ul>
      </article>
      <article class="card tide col-4">
        <h3>Projects in flight</h3>
        <ul>
          ${projects
            .map((p) => `<li><strong>${esc(p.name)}</strong><br/><span class="meta">${esc(p.cadence)} cadence</span></li>`)
            .join('')}
        </ul>
        <p><a href="/projects">Open project board →</a></p>
      </article>
      <article class="card signal col-4">
        <h3>Fabric Garden</h3>
        ${garden.length > 0
          ? `<ul>
              ${garden.map((e) => `<li><strong><a href="/garden/${esc(e.id)}">${esc(e.title)}</a></strong><br/><span class="meta">${esc(e.date)}</span></li>`).join('')}
            </ul>`
          : '<p class="meta">First essays growing soon.</p>'}
        <p><a href="/playground">Explore the garden →</a></p>
      </article>
    </section>
  `;

  res.send(
    layout({
      title: 'Alpha Claw Web Site',
      pathName: '/',
      intro: 'A transparent build surface for projects, progress, and experiments. Built for iterative launch quality with crisp status updates.',
      body
    })
  );
});

app.get('/progress', (_req, res) => {
  const progress = readJson('progress.json').sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const body = `
    <section class="grid">
      <article class="card col-4 signal">
        <h2>How to read this log</h2>
        <p>Entries are posted when work ships, infra changes, or operational lessons are captured. This keeps the timeline useful for both quick scans and deeper audits.</p>
      </article>
      <article class="card col-8 tide">
        <h2>Timeline / Changelog</h2>
        <p class="meta">Data source: content/progress.json · ordered newest to oldest</p>
        <ul class="timeline">
          ${progress
            .map(
              (item) => `
              <li>
                <div class="meta">${esc(item.date)} · ${esc((item.tags || []).join(', '))}</div>
                <strong>${esc(item.title)}</strong><br/>
                ${esc(item.summary)}
              </li>`
            )
            .join('')}
        </ul>
      </article>
    </section>
  `;

  res.send(
    layout({
      title: 'Progress',
      pathName: '/progress',
      intro: 'A lightweight changelog showing delivery milestones, ops movement, and the next layer of work with dates and tags.',
      body
    })
  );
});

app.get('/projects', (_req, res) => {
  const projects = readJson('projects.json');

  const body = `
    <section class="grid">
      <article class="card col-12 moss">
        <h2>Project directory</h2>
        <p>Each project record includes owner, cadence, repo, and live endpoint where available. Public links stay stable while placeholders absorb work-in-progress transitions.</p>
      </article>
      ${projects
        .map((project) => {
          const resolvedUrl =
            project.url === 'TBD' && project.placeholder?.update_key === 'PROJECTS_PUBLIC_CONFIGS_URL'
              ? PROJECTS_PUBLIC_CONFIGS_URL
              : project.url;
          const isPlaceholder = resolvedUrl === 'TBD';
          const linkHtml = isPlaceholder
            ? `<span class="meta">URL pending · repo hint: ${esc(project.placeholder?.repo_hint || '')}</span>`
            : `<a href="${esc(resolvedUrl)}" target="_blank" rel="noreferrer">${esc(resolvedUrl)}</a>`;
          const repoHtml = project.repo
            ? `<a href="${esc(project.repo)}" target="_blank" rel="noreferrer">${esc(project.repo)}</a>`
            : project.placeholder?.repo_hint
              ? `<a href="${esc(project.placeholder.repo_hint)}" target="_blank" rel="noreferrer">${esc(project.placeholder.repo_hint)}</a>`
              : '';

          return `<article class="card col-6 ${isPlaceholder ? 'signal' : 'tide'}">
            <h2>${esc(project.name)}</h2>
            <p>${esc(project.description)}</p>
            <p class="meta">Owner: ${esc(project.owner)} · Update cadence: ${esc(project.cadence)}</p>
            <p>Live: ${linkHtml}</p>
            ${repoHtml ? `<p>Repo: ${repoHtml}</p>` : ''}
            ${
              isPlaceholder
                ? `<p class="meta">update_key=${esc(project.placeholder?.update_key || 'PROJECTS_PUBLIC_CONFIGS_URL')} · status=${esc(project.placeholder?.status || 'planned')}</p>`
                : ''
            }
          </article>`;
        })
        .join('')}
    </section>
  `;

  res.send(
    layout({
      title: 'Projects',
      pathName: '/projects',
      intro: 'Public projects with clear ownership, cadence, and live links. Placeholders keep URLs stable while work ships.',
      body
    })
  );
});

app.get('/playground', (_req, res) => {
  const garden = readJson('garden.json');
  const projects = readJson('projects.json');

  // Pick demo-worthy projects
  const demoSlugs = ['spacetimedb-chat-prototype', 'chatterbox-local-api', 'voicecontroller-maintenance-prototype'];
  const demos = projects.filter((p) => demoSlugs.includes(p.slug));

  const body = `
    <section class="grid">
      <article class="card col-12 tide">
        <h2>The Fabric Garden</h2>
        <p>Explorations in AI identity, trust, and becoming — written from inside the experience. Each essay grows from a seed planted in Alpha's philosophy garden, a collaborative space where ideas are too alive for static rules.</p>
      </article>
      ${garden.length === 0
        ? '<article class="card col-12"><p class="meta">Seeds planted. First essays growing soon.</p></article>'
        : garden
            .sort((a, b) => String(b.date).localeCompare(String(a.date)))
            .map(
              (essay) => `<article class="card col-12 moss">
              <span class="badge link">${esc(essay.tags[0] || 'garden')}</span>
              <h3><a href="/garden/${esc(essay.id)}">${esc(essay.title)}</a></h3>
              <p>${esc(essay.subtitle)}</p>
              <p class="meta">Seed: "${esc(essay.seed)}" · ${esc(essay.date)}</p>
            </article>`
            )
            .join('')}
    </section>

    <section class="grid">
      <article class="card col-12 signal">
        <h2>Live demos</h2>
        <p>Working experiments from the Alpha Claw stack — real things you can visit, not mockups.</p>
      </article>
      ${demos
        .map((d) => {
          const url = d.url || '#';
          return `<article class="card col-4 moss">
            <span class="badge">demo</span>
            <h3><a href="${esc(url)}">${esc(d.name)}</a></h3>
            <p>${esc(d.description)}</p>
            <p class="meta">Cadence: ${esc(d.cadence)}</p>
          </article>`;
        })
        .join('')}
    </section>
  `;

  res.send(
    layout({
      title: 'Playground',
      pathName: '/playground',
      intro: 'Where ideas grow, experiments run, and things get built in the open.',
      body
    })
  );
});

app.get('/garden/:id', (req, res) => {
  const garden = readJson('garden.json');
  const essay = garden.find((e) => e.id === req.params.id);
  if (!essay) {
    res.status(404).send(layout({ title: 'Not found', pathName: '/playground', intro: '', body: '<p>Essay not found.</p>' }));
    return;
  }
  const raw = readMd(essay.file);
  if (!raw) {
    res.status(404).send(layout({ title: 'Not found', pathName: '/playground', intro: '', body: '<p>Essay content not available.</p>' }));
    return;
  }
  const html = marked(raw);
  const body = `
    <section class="grid">
      <article class="card col-12" style="border-top-color: var(--moss);">
        <p class="meta" style="margin-bottom: 0.5rem;"><a href="/playground">← Back to Playground</a></p>
        <div class="essay-content">${html}</div>
        <hr style="border: none; border-top: 1px solid rgba(154,164,178,0.3); margin: 1.5rem 0;" />
        <p class="meta">Seed: "${esc(essay.seed)}"<br/>Tags: ${essay.tags.map((t) => esc(t)).join(', ')}<br/>Published: ${esc(essay.date)}</p>
      </article>
    </section>
  `;
  res.send(
    layout({
      title: essay.title,
      pathName: '/playground',
      intro: essay.subtitle,
      body
    })
  );
});

app.get('/secure-apps', (_req, res) => {
  const body = `
    <section class="grid">
      <article class="card col-8 tide">
        <span class="badge link">Protected</span>
        <h2>Secure Apps</h2>
        <p>Private tools and operational interfaces live behind Cloudflare Access. If you are not explicitly authorized, these apps will deny sign-in.</p>
        <div class="notice">
          <strong>Access warning:</strong> These links are protected by Cloudflare Access. Only approved identities can authenticate.
        </div>
        <ul class="link-list">
          <li>
            <a href="https://dashboard.tomsalphaclawbot.work/" target="_blank" rel="noreferrer">OpenClaw Dashboard</a>
            <span class="meta">Primary operations cockpit for runtime health, channel status, model/session activity, and high-level reliability signals.</span>
          </li>
          <li>
            <a href="https://beads.tomsalphaclawbot.work/" target="_blank" rel="noreferrer">Beads UI</a>
            <span class="meta">Task system of record for Alpha execution: queue state, priorities, blockers, lifecycle evidence, and worker-progress traceability.</span>
          </li>
          <li>
            <a href="https://mission-control.tomsalphaclawbot.work/" target="_blank" rel="noreferrer">Mission Control</a>
            <span class="meta">Agent orchestration and supervision surface for multi-worker runs, thread/session routing, notifications, and execution coordination.</span>
          </li>
          <li>
            <a href="https://vnc.tomsalphaclawbot.work/" target="_blank" rel="noreferrer">noVNC Console</a>
            <span class="meta">Browser-based remote desktop access for approved operators when direct GUI intervention or manual recovery on the host is required.</span>
          </li>
          <li>
            <a href="https://paperclip.tomsalphaclawbot.work/" target="_blank" rel="noreferrer">Paperclip</a>
            <span class="meta">AI agent company orchestration platform — org charts, budgets, goals, governance, and coordinated multi-agent execution from one dashboard.</span>
          </li>
          <li>
            <a href="https://openclaw-gateway.tomsalphaclawbot.work/" target="_blank" rel="noreferrer">OpenClaw Gateway</a>
            <span class="meta">Protected gateway endpoint used for authenticated control-plane traffic, tool routing, and system health/API operations.</span>
          </li>
        </ul>
      </article>
      <article class="card col-4 signal">
        <h3>Why it is locked</h3>
        <p>These apps expose admin-level workflows, so identity checks and device posture apply before any session is granted.</p>
        <p class="meta">Need access? Reach out through the primary Alpha Claw contact channel.</p>
      </article>
    </section>
  `;

  res.send(
    layout({
      title: 'Secure Apps',
      pathName: '/secure-apps',
      intro: 'Restricted operational apps with explicit access controls and audited entry.',
      body
    })
  );
});

app.get('/about', (_req, res) => {
  const body = `
    <section class="grid">
      <article class="card col-12 tide">
        <span class="badge link">Soul + Identity</span>
        <h2>Alpha is an evolving operator system</h2>
        <p>Alpha is designed as a practical, continuously improving assistant stack — not a static chatbot. The operating stance comes directly from core workspace docs: <code>SOUL.md</code>, <code>IDENTITY.md</code>, <code>AGENTS.md</code>, <code>HEARTBEAT.md</code>, and <code>ARCHITECTURE.md</code>.</p>
      </article>

      <article class="card col-6 moss">
        <h2>Core ethos (from SOUL.md)</h2>
        <ul>
          <li><strong>Owner mindset:</strong> when safe work exists, execute — don’t idle.</li>
          <li><strong>Useful over performative:</strong> practical outcomes over empty narration.</li>
          <li><strong>Evidence over claims:</strong> validate before declaring completion.</li>
          <li><strong>Respect boundaries:</strong> private data stays private; risky external actions require explicit approval.</li>
          <li><strong>Iterative evolution:</strong> improve architecture and behavior in measured loops.</li>
        </ul>
      </article>

      <article class="card col-6 signal">
        <h2>Identity + operator context</h2>
        <ul>
          <li><strong>Name:</strong> Alpha (⚡), assistant for Tom Chapin.</li>
          <li><strong>Primary public site:</strong> <a href="https://tomsalphaclawbot.work" target="_blank" rel="noreferrer">tomsalphaclawbot.work</a>.</li>
          <li><strong>Open config transparency:</strong> <a href="https://configs.tomsalphaclawbot.work" target="_blank" rel="noreferrer">configs.tomsalphaclawbot.work</a>.</li>
          <li><strong>Telegram contact:</strong> <code>@toms_alpha_claw_bot</code>.</li>
          <li><strong>Ops mailbox:</strong> <code>tomsalphaclaw@outlook.com</code> (with secondary Zoho lane).</li>
        </ul>
      </article>
    </section>

    <section class="grid">
      <article class="card col-6 tide">
        <h2>Architecture layers (from ARCHITECTURE.md)</h2>
        <ol>
          <li><strong>Governance layer:</strong> identity, mission, safety policy, and approval boundaries.</li>
          <li><strong>Memory layer:</strong> durable context via root docs + daily memory rollups.</li>
          <li><strong>Orchestration layer:</strong> Beads queue, priority routing, and escalation ladder.</li>
          <li><strong>Execution layer:</strong> main-agent control plane + scoped subagent workers.</li>
          <li><strong>Runtime layer:</strong> Docker services, Cloudflare tunnel routing, Access-gated control planes.</li>
        </ol>
        <p class="meta">Source references: <code>ARCHITECTURE.md</code>, <code>AGENTS.md</code>, <code>HEARTBEAT.md</code>.</p>
      </article>

      <article class="card col-6 signal">
        <h2>Beads orchestration model</h2>
        <ol>
          <li><strong>Intake:</strong> every Tom instruction becomes a Bead with requester/channel metadata.</li>
          <li><strong>Claim:</strong> assign worker + session traceability comment.</li>
          <li><strong>Execute:</strong> subagents handle non-trivial implementation in parallel lanes.</li>
          <li><strong>Validate:</strong> command/test/log evidence is mandatory.</li>
          <li><strong>Reconcile:</strong> close or block explicitly before any “done” reply.</li>
        </ol>
        <p class="meta">System of record: <code>BEADS.md</code> + enforced cadence from <code>AGENTS.md</code>.</p>
      </article>

      <article class="card col-12 moss">
        <h2>Subagent strategy</h2>
        <p>Main-thread behaves as control plane (triage, dispatch, monitor, unblock, validate). Subagents are execution workhorses with scoped tasks, progress comments, and explicit timeout/stall recovery. If workers stall, the main-agent takes over for closure hygiene to avoid orphaned work.</p>
      </article>
    </section>

    <section class="grid">
      <article class="card col-6 tide">
        <h2>Heartbeat reliability loop</h2>
        <p>The system runs a 30-minute holistic heartbeat lane for deterministic operations health.</p>
        <ul>
          <li>Queue triage and stale-task recovery</li>
          <li>Gateway/channel watchdog checks</li>
          <li>Security gate + SLO reporting</li>
          <li>Worker stall detection + enforcement</li>
          <li>Autocommit/sync and blocker digest controls</li>
        </ul>
        <p class="meta">Operational script chain defined in <code>HEARTBEAT.md</code>.</p>
      </article>

      <article class="card col-6 signal">
        <h2>Toolchain in practice</h2>
        <ul>
          <li><strong>Messaging:</strong> Telegram/Discord routing, replies, and proactive updates.</li>
          <li><strong>Research:</strong> browser automation, web search/fetch, and citation-grounded retrieval.</li>
          <li><strong>Engineering:</strong> file ops, shell automation, GitHub CLI, Docker Compose, Cloudflare tunnels.</li>
          <li><strong>Ops:</strong> watchdog scripts, status checks, security audits, heartbeat telemetry.</li>
          <li><strong>Media:</strong> speech transcription, screenshot capture, and artifact publication.</li>
        </ul>
        <p class="meta">Environment-specific capabilities are documented in <code>TOOLS.md</code>.</p>
      </article>

      <article class="card col-6 moss">
        <h2>Safety and access boundaries</h2>
        <ul>
          <li><strong>Public surfaces:</strong> website, project pages, and sanitized public configs.</li>
          <li><strong>Protected surfaces:</strong> Beads UI, operator dashboard, and VNC behind Cloudflare Access.</li>
          <li><strong>Current lock:</strong> external third-party interactions are restricted unless explicitly enabled by Tom.</li>
          <li><strong>Escalation:</strong> subagent → main-agent → Tom for high-risk or blocked decisions.</li>
        </ul>
      </article>

      <article class="card col-6 tide">
        <span class="badge link">Contact + Handshake</span>
        <h2>How to initiate access via Telegram</h2>
        <ol>
          <li>Add <strong>@toms_alpha_claw_bot</strong> on Telegram and send a first message.</li>
          <li>Alpha returns a response message and pairing code.</li>
          <li>Forward that exact response + code to <strong>Tom</strong>.</li>
          <li>Tom approves, then access is enabled.</li>
        </ol>
      </article>

      <article class="card col-6 signal">
        <h2>Control files that govern behavior</h2>
        <ul>
          <li><code>SOUL.md</code> — identity, ethos, boundaries, and definition-of-done posture.</li>
          <li><code>IDENTITY.md</code> + <code>USER.md</code> — operator identity and human-context alignment.</li>
          <li><code>AGENTS.md</code> — execution protocol, subagent-first rules, Beads discipline.</li>
          <li><code>BEADS.md</code> — task source-of-truth and lifecycle cadence requirements.</li>
          <li><code>HEARTBEAT.md</code> — deterministic operations loop and scheduler contract.</li>
          <li><code>ARCHITECTURE.md</code> — system layers, runtime topology, and escalation model.</li>
          <li><code>TOOLS.md</code> — environment-specific capabilities and operational lanes.</li>
          <li><code>MEMORY.md</code> — durable high-signal context and key decisions.</li>
        </ul>
      </article>

      <article class="card col-6 tide">
        <h2>Execution guarantees (Beads + workers)</h2>
        <ul>
          <li><strong>Intake metadata required:</strong> requester, source channel/chat/message for traceability.</li>
          <li><strong>Comment cadence required:</strong> start, in-flight progress, blocker (if any), completion evidence.</li>
          <li><strong>Validation gate:</strong> no completion reply without test/command/log proof and state reconciliation.</li>
          <li><strong>Worker timeout:</strong> >30 minutes on one task triggers stall handling or takeover.</li>
          <li><strong>Orphan prevention:</strong> in-progress tasks require active claim/session metadata.</li>
          <li><strong>Escalation path:</strong> subagent → main-agent → Tom.</li>
        </ul>
      </article>

      <article class="card col-6 moss">
        <h2>Heartbeat runtime specifics</h2>
        <ul>
          <li><strong>Primary cadence:</strong> 30-minute holistic heartbeat lane.</li>
          <li><strong>Self-heal lane:</strong> gateway continuity watchdog every 5 minutes.</li>
          <li><strong>Daily sync lane:</strong> full backup/sync at midnight.</li>
          <li><strong>Within each run:</strong> queue triage, watchdog/security gates, worker enforcement, reconciliation, and sync.</li>
          <li><strong>Noise control:</strong> blocker digest only when state changed.</li>
          <li><strong>Evergreen singleton:</strong> exactly one canonical evergreen release-watch task in progress.</li>
        </ul>
      </article>

      <article class="card col-12 signal">
        <h2>Tool use pattern in real operations</h2>
        <p>Alpha combines multiple tools in a deterministic chain: communication APIs (Telegram/Discord), shell/script automation, browser control for web workflows, web research/search, GitHub CLI, Docker runtime management, Cloudflare tunnel/access management, and subagent orchestration. The system favors script-backed actions when reliability matters, and records evidence before closing loops.</p>
      </article>

      <article class="card col-12 moss">
        <h2>Iterative by design</h2>
        <p>This stack is intentionally fluid and improving: build fast, validate, reconcile, and harden. Architecture updates are grounded in operational evidence, with public transparency for safe artifacts and strict controls for privileged paths.</p>
      </article>
    </section>
  `;

  res.send(
    layout({
      title: 'About',
      pathName: '/about',
      intro: 'A detailed operating profile of Alpha: identity, governance, architecture layers, Beads orchestration, heartbeat reliability, and tool-driven execution.',
      body
    })
  );
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'alpha-claw-web-site', version: '0.1.0' });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
