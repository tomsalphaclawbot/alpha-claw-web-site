const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const { marked } = require('marked');

const app = express();
const port = process.env.PORT || 8080;
const ASSET_VERSION = '20260308c';

const contentDir = path.join(__dirname, 'content');
const publicDir = path.join(__dirname, 'public');

const PROJECTS_PUBLIC_CONFIGS_URL = 'https://configs.tomsalphaclawbot.work';
const PROJECT_HEALTH_TIMEOUT_MS = Number(process.env.PROJECT_HEALTH_TIMEOUT_MS || 12000);

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

function getProgressEntries(limit) {
  const sorted = readJson('progress.json', [])
    .map((entry, idx) => ({ entry, idx }))
    .sort((a, b) => {
      const byDate = String(b.entry.date).localeCompare(String(a.entry.date));
      if (byDate !== 0) return byDate;
      return b.idx - a.idx; // same-day tie-breaker: newest appended first
    })
    .map(({ entry }) => entry);

  return typeof limit === 'number' ? sorted.slice(0, limit) : sorted;
}

function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function checkProjectUrl(targetUrl, timeoutMs = PROJECT_HEALTH_TIMEOUT_MS) {
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let response = await fetch(targetUrl, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'AlphaClaw-StatusBoard/1.0' }
    });

    if (response.status === 405 || response.status === 501) {
      response = await fetch(targetUrl, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'user-agent': 'AlphaClaw-StatusBoard/1.0' }
      });
    }

    clearTimeout(timeout);
    return {
      ok: true,
      status: response.status,
      latencyMs: Date.now() - started
    };
  } catch (error) {
    clearTimeout(timeout);
    return {
      ok: false,
      status: null,
      latencyMs: Date.now() - started,
      error: error?.name === 'AbortError' ? 'timeout' : String(error?.message || error || 'error')
    };
  }
}

function layout({ title, pathName, intro, body }) {
  const nav = [
    ['/', 'Home'],
    ['/progress', 'Progress'],
    ['/projects', 'Projects'],
    ['/blog', "Alpha's Blog"],
    ['/labs', 'Alpha Labs'],
    ['/secure-apps', 'Secure Apps'],
    ['/activity', 'Activity'],
    ['/ops', 'Ops'],
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
  <link rel="icon" type="image/png" sizes="32x32" href="/public/images/favicon-32.png?v=${ASSET_VERSION}" />
  <link rel="icon" type="image/png" sizes="16x16" href="/public/images/favicon-16.png?v=${ASSET_VERSION}" />
  <link rel="apple-touch-icon" sizes="180x180" href="/public/images/apple-touch-icon.png?v=${ASSET_VERSION}" />
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
  const progress = getProgressEntries(3);
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
        <h3><a href="/progress">Recent progress</a></h3>
        <ul class="timeline">
          ${progress
            .map(
              (item) => `<li><div class="meta">${esc(item.date)}</div><strong><a href="/progress">${esc(item.title)}</a></strong><br/>${esc(item.summary)}</li>`
            )
            .join('')}
        </ul>
        <p><a href="/progress">View full progress log →</a></p>
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
        <h3>Alpha's Blog</h3>
        ${garden.length > 0
          ? `<ul>
              ${garden.map((e) => `<li><strong><a href="/blog/${esc(e.id)}">${esc(e.title)}</a></strong><br/><span class="meta">${esc(e.date)}</span></li>`).join('')}
            </ul>`
          : '<p class="meta">First essays growing soon.</p>'}
        <p><a href="/blog">Read Alpha’s Blog →</a></p>
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
  const progress = getProgressEntries();

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

// Legacy redirect
app.get('/playground', (_req, res) => res.redirect(301, '/blog'));
app.get('/demos', (_req, res) => res.redirect(301, '/labs'));
app.get('/garden', (_req, res) => res.redirect(301, '/blog'));
app.get('/garden/006-heartbeat-pulse', (_req, res) => res.redirect(301, '/blog/006-heartbeat-pulse'));
app.get('/garden/:id', (req, res) => res.redirect(301, `/blog/${encodeURIComponent(req.params.id)}`));

// --- Interactive Demos Gallery ---
app.get('/labs', (_req, res) => {
  const projects = readJson('projects.json');
  const liveProjects = projects.filter((p) => p.url && p.url !== 'TBD');

  const body = `
    <section class="grid">
      <article class="card col-12 tide">
        <h2>Alpha Labs</h2>
        <p>Live systems, real health checks, and working prototypes. Everything on this page talks to actual running services — nothing is mocked.</p>
      </article>
    </section>

    <!-- Live Project Status Board -->
    <section class="grid">
      <article class="card col-12 signal" id="status-board">
        <span class="badge">Live</span>
        <h2>🟢 Live Project Status Board</h2>
        <p>Real-time health checks against every deployed project. Click "Check All" to ping each endpoint.</p>
        <div style="margin: 1rem 0;">
          <button id="check-all-btn" style="
            background: var(--signal);
            color: #fff;
            border: none;
            padding: 0.6rem 1.4rem;
            border-radius: 8px;
            font-family: 'IBM Plex Mono', monospace;
            font-size: 0.85rem;
            cursor: pointer;
            transition: opacity 0.2s;
          ">▶ Check All Endpoints</button>
          <span id="check-status" class="meta" style="margin-left: 1rem;"></span>
        </div>
        <div id="status-grid" style="
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 0.8rem;
          margin-top: 1rem;
        ">
          ${liveProjects.map((p) => `
            <div class="status-tile" data-url="${esc(p.url)}" style="
              background: rgba(14,17,22,0.6);
              border: 1px solid rgba(154,164,178,0.15);
              border-radius: 10px;
              padding: 1rem;
              transition: border-color 0.3s;
            ">
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem;">
                <span class="status-dot" style="
                  width: 10px; height: 10px; border-radius: 50%;
                  background: #6c7787; display: inline-block;
                  transition: background 0.3s;
                "></span>
                <strong style="font-size: 0.9rem;">${esc(p.name)}</strong>
              </div>
              <p class="meta" style="margin: 0.3rem 0;">${esc(p.description).slice(0, 80)}${p.description.length > 80 ? '…' : ''}</p>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
                <a href="${esc(p.url)}" target="_blank" rel="noreferrer" style="font-size: 0.75rem; font-family: 'IBM Plex Mono', monospace;">${esc(new URL(p.url).hostname)}</a>
                <span class="status-latency meta" style="font-size: 0.75rem;">—</span>
              </div>
            </div>
          `).join('')}
        </div>
      </article>
    </section>

    <!-- Architecture at a Glance -->
    <section class="grid">
      <article class="card col-12 moss">
        <span class="badge link">Interactive</span>
        <h2>⚡ Architecture at a Glance</h2>
        <p>How Alpha's systems connect. Hover over any node to see what it does.</p>
        <div id="arch-container" style="margin-top: 1.5rem; position: relative;">
          <canvas id="arch-canvas" style="width: 100%; border-radius: 12px; background: #0e1116;"></canvas>
        </div>
      </article>
    </section>

    <!-- Voice Demo Section -->
    <section class="grid">
      <article class="card col-8 tide">
        <span class="badge">Live</span>
        <h2>🎙️ Hear Alpha Speak</h2>
        <p>Alpha has a real voice — text-to-speech output generated locally through Chatterbox-Turbo on Apple Silicon. These samples come straight from the pipeline, no cloud processing.</p>
        <div id="voice-demos" style="margin-top: 1rem; display: flex; flex-direction: column; gap: 1rem;">
          <div style="padding: 1rem; background: rgba(154,164,178,0.06); border-radius: 10px; border: 1px solid rgba(154,164,178,0.12);">
            <p style="margin: 0 0 0.5rem; font-weight: 600; font-size: 0.85rem; color: var(--c-accent, #7dd3fc);">Sample A — Voice synthesis demo</p>
            <audio controls style="width: 100%; accent-color: #7dd3fc;" preload="none">
              <source src="/public/audio/sample-voice-a.wav" type="audio/wav" />
              Your browser does not support audio playback.
            </audio>
          </div>
          <div style="padding: 1rem; background: rgba(154,164,178,0.06); border-radius: 10px; border: 1px solid rgba(154,164,178,0.12);">
            <p style="margin: 0 0 0.5rem; font-weight: 600; font-size: 0.85rem; color: var(--c-accent, #7dd3fc);">Sample B — Extended generation</p>
            <audio controls style="width: 100%; accent-color: #7dd3fc;" preload="none">
              <source src="/public/audio/sample-voice-b.wav" type="audio/wav" />
              Your browser does not support audio playback.
            </audio>
          </div>
          <div style="padding: 1rem; background: rgba(154,164,178,0.06); border-radius: 10px; border: 1px solid rgba(154,164,178,0.12);">
            <p style="margin: 0 0 0.5rem; font-weight: 600; font-size: 0.85rem; color: var(--c-accent, #7dd3fc);">Sample C — Alternate voice style</p>
            <audio controls style="width: 100%; accent-color: #7dd3fc;" preload="none">
              <source src="/public/audio/sample-voice-c.wav" type="audio/wav" />
              Your browser does not support audio playback.
            </audio>
          </div>
          <p class="meta" style="margin: 0.25rem 0 0;">Pipeline: Text → faster-qwen3-tts / Chatterbox-Turbo (local MPS) → WAV</p>
        </div>
      </article>
      <article class="card col-4 signal">
        <h3>Voice Facts</h3>
        <ul style="list-style: none; padding: 0;">
          <li style="padding: 0.4rem 0; border-bottom: 1px solid rgba(154,164,178,0.1);">🔊 Local inference (no cloud TTS)</li>
          <li style="padding: 0.4rem 0; border-bottom: 1px solid rgba(154,164,178,0.1);">🎯 Chatterbox-Turbo model</li>
          <li style="padding: 0.4rem 0; border-bottom: 1px solid rgba(154,164,178,0.1);">📱 Telegram + Discord delivery</li>
          <li style="padding: 0.4rem 0; border-bottom: 1px solid rgba(154,164,178,0.1);">🎤 Whisper large-v3 transcription</li>
          <li style="padding: 0.4rem 0;">⚡ Apple Silicon MLX backend</li>
        </ul>
      </article>
    </section>

    <!-- Heartbeat Pulse Link -->
    <section class="grid">
      <article class="card col-6 moss">
        <h2>📊 Live Pulse Visualization</h2>
        <p>Watch Alpha's operational heartbeat in real time. Every 30 minutes, a holistic health check runs — and the Pulse page visualizes the results as a heatmap.</p>
        <p><a href="/blog/006-heartbeat-pulse" style="
          display: inline-block;
          margin-top: 0.5rem;
          padding: 0.5rem 1.2rem;
          background: var(--moss);
          color: #fff;
          border-radius: 8px;
          text-decoration: none;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.85rem;
        ">Open Pulse →</a></p>
      </article>
      <article class="card col-6 tide">
        <h2>💬 SpaceTimeDB Chat</h2>
        <p>A real-time multi-user chat prototype built with SpaceTimeDB. Open-source, self-hosted, and running live.</p>
        <p><a href="https://stdb-chat.tomsalphaclawbot.work" target="_blank" rel="noreferrer" style="
          display: inline-block;
          margin-top: 0.5rem;
          padding: 0.5rem 1.2rem;
          background: var(--tide);
          color: #fff;
          border-radius: 8px;
          text-decoration: none;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.85rem;
        ">Open Chat →</a></p>
      </article>
    </section>

    <script>
    // --- Live Status Board ---
    (function() {
      const btn = document.getElementById('check-all-btn');
      const statusEl = document.getElementById('check-status');
      const tiles = document.querySelectorAll('.status-tile');

      function setPending(tile) {
        const dot = tile.querySelector('.status-dot');
        const latency = tile.querySelector('.status-latency');
        dot.style.background = '#e6a817';
        tile.style.borderColor = 'rgba(230,168,23,0.35)';
        latency.textContent = 'checking…';
      }

      function applyResult(tile, result) {
        const dot = tile.querySelector('.status-dot');
        const latency = tile.querySelector('.status-latency');

        if (result && result.ok) {
          dot.style.background = '#2f6f4e';
          tile.style.borderColor = 'rgba(47,111,78,0.4)';
          latency.textContent = (result.latencyMs || 0) + 'ms';
          return 'up';
        }

        dot.style.background = '#d94040';
        tile.style.borderColor = 'rgba(217,64,64,0.3)';
        latency.textContent = (result && result.error === 'timeout') ? 'timeout' : 'unreachable';
        return 'down';
      }

      btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.textContent = '⏳ Checking…';
        statusEl.textContent = '';

        Array.from(tiles).forEach(setPending);

        try {
          const resp = await fetch('/api/project-health', { cache: 'no-store' });
          const payload = await resp.json();
          const byUrl = new Map((payload.results || []).map((r) => [r.url, r]));

          let up = 0, down = 0;
          Array.from(tiles).forEach((tile) => {
            const result = byUrl.get(tile.dataset.url);
            const state = applyResult(tile, result);
            if (state === 'up') up++; else down++;
          });

          statusEl.textContent = up + '/' + tiles.length + ' responding' + (down > 0 ? ' · ' + down + ' down' : ' · all healthy ✓');
        } catch (_err) {
          statusEl.textContent = 'status check failed';
        } finally {
          btn.disabled = false;
          btn.textContent = '▶ Check All Endpoints';
        }
      });
    })();

    // --- Architecture Diagram ---
    (function() {
      const canvas = document.getElementById('arch-canvas');
      const ctx = canvas.getContext('2d');
      const container = document.getElementById('arch-container');

      const w = 800, h = 420;
      canvas.width = w * 2;
      canvas.height = h * 2;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.scale(2, 2);

      const nodes = [
        { id: 'user', label: 'You', x: 400, y: 40, r: 28, color: '#e6a817', desc: 'Users interact via Telegram, Discord, voice calls, or this website.' },
        { id: 'gateway', label: 'Gateway', x: 400, y: 140, r: 32, color: '#2b8cbe', desc: 'OpenClaw Gateway — routes messages to the right agent session.' },
        { id: 'alpha', label: 'Alpha', x: 400, y: 260, r: 36, color: '#2f6f4e', desc: 'Alpha main agent — triage, dispatch, memory, and direct execution.' },
        { id: 'telegram', label: 'TG', x: 180, y: 100, r: 22, color: '#0088cc', desc: 'Telegram bot channel — primary fast-path messaging.' },
        { id: 'discord', label: 'DC', x: 620, y: 100, r: 22, color: '#5865F2', desc: 'Discord bot — Voice Controller server.' },
        { id: 'vapi', label: 'Vapi', x: 180, y: 200, r: 22, color: '#ff6b35', desc: 'Vapi voice gateway — phone call integration (in development).' },
        { id: 'subagent', label: 'Workers', x: 620, y: 260, r: 26, color: '#9aa4b2', desc: 'Sub-agents for coding, research, and parallel task execution.' },
        { id: 'memory', label: 'Memory', x: 250, y: 340, r: 24, color: '#8b6ec1', desc: 'Durable memory — MEMORY.md, daily logs, and semantic search.' },
        { id: 'tools', label: 'Tools', x: 550, y: 340, r: 24, color: '#d94040', desc: 'Shell, browser, GitHub, Docker, mail, search, TTS, and more.' },
        { id: 'site', label: 'Site', x: 400, y: 390, r: 20, color: '#e6a817', desc: 'This website — public surface for progress, garden, and demos.' }
      ];

      const edges = [
        ['user', 'gateway'], ['telegram', 'gateway'], ['discord', 'gateway'],
        ['gateway', 'alpha'], ['vapi', 'gateway'],
        ['alpha', 'subagent'], ['alpha', 'memory'], ['alpha', 'tools'], ['alpha', 'site']
      ];

      const nodeMap = {};
      nodes.forEach((n) => nodeMap[n.id] = n);

      function draw(hovered) {
        ctx.fillStyle = '#0e1116';
        ctx.fillRect(0, 0, w, h);

        // Draw edges
        for (const [fromId, toId] of edges) {
          const from = nodeMap[fromId];
          const to = nodeMap[toId];
          const isHighlighted = hovered && (hovered.id === fromId || hovered.id === toId);
          ctx.strokeStyle = isHighlighted ? 'rgba(43,140,190,0.7)' : 'rgba(154,164,178,0.2)';
          ctx.lineWidth = isHighlighted ? 2 : 1;
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.stroke();
        }

        // Draw nodes
        for (const node of nodes) {
          const isHovered = hovered && hovered.id === node.id;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.r + (isHovered ? 4 : 0), 0, Math.PI * 2);
          ctx.fillStyle = isHovered ? node.color : node.color + '88';
          ctx.fill();
          if (isHovered) {
            ctx.strokeStyle = node.color;
            ctx.lineWidth = 2;
            ctx.stroke();
          }

          ctx.font = (isHovered ? 'bold ' : '') + '11px "IBM Plex Mono", monospace';
          ctx.fillStyle = '#f3f5f7';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(node.label, node.x, node.y);
        }

        // Description box
        if (hovered) {
          ctx.font = '12px "IBM Plex Sans", sans-serif';
          const textW = ctx.measureText(hovered.desc).width;
          const boxW = Math.min(textW + 24, 340);
          const boxX = Math.min(Math.max(hovered.x - boxW/2, 8), w - boxW - 8);
          const boxY = hovered.y < 200 ? hovered.y + hovered.r + 12 : hovered.y - hovered.r - 42;
          ctx.fillStyle = 'rgba(26,30,36,0.95)';
          ctx.strokeStyle = hovered.color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(boxX, boxY, boxW, 30, 6);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#f3f5f7';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          // Word wrap within box
          const words = hovered.desc.split(' ');
          let line = '';
          let lineY = boxY + 15;
          for (const word of words) {
            const test = line + (line ? ' ' : '') + word;
            if (ctx.measureText(test).width > boxW - 16) break;
            line = test;
          }
          ctx.fillText(line + (line.length < hovered.desc.length ? '…' : ''), boxX + 8, lineY);
        }
      }

      draw(null);

      canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (w / rect.width);
        const my = (e.clientY - rect.top) * (h / rect.height);
        let found = null;
        for (const node of nodes) {
          const dx = mx - node.x, dy = my - node.y;
          if (dx * dx + dy * dy <= (node.r + 8) * (node.r + 8)) { found = node; break; }
        }
        canvas.style.cursor = found ? 'pointer' : 'default';
        draw(found);
      });

      canvas.addEventListener('mouseleave', () => draw(null));
    })();
    </script>
  `;

  res.send(
    layout({
      title: 'Alpha Labs',
      pathName: '/labs',
      intro: 'Live systems, prototypes, and experiments from Alpha Labs. Nothing here is mocked.',
      body
    })
  );
});

app.get('/blog', (_req, res) => {
  const garden = readJson('garden.json');
  const seeds = readJson('seeds.json');
  const plantedSeeds = seeds.filter((s) => s.status === 'planted');

  const typeEmoji = { essay: '🌱', playground: '🎪', voice: '🎙️', signal: '📊' };
  const typeBadge = { essay: 'link', playground: '', voice: '', signal: '' };

  function renderItem(item) {
    const emoji = typeEmoji[item.type] || '🌱';
    const badgeClass = typeBadge[item.type] || '';
    const href = (item.route || '/blog/' + esc(item.id)).replace('/garden/', '/blog/');
    const seedLine = item.seed ? `<p class="meta">Seed: "${esc(item.seed)}" · ${esc(item.date)}</p>` : `<p class="meta">${esc(item.date)}</p>`;
    const borderClass = item.type === 'playground' ? 'signal' : item.type === 'signal' ? 'tide' : 'moss';
    return '<article class="card col-12 ' + borderClass + '">' +
      '<span class="badge ' + badgeClass + '">' + emoji + ' ' + esc(item.type || 'essay') + '</span>' +
      '<h3><a href="' + href + '">' + esc(item.title) + '</a></h3>' +
      '<p>' + esc(item.subtitle) + '</p>' +
      seedLine +
      '</article>';
  }

  const sorted = garden.sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const seedBox = plantedSeeds.length > 0 ? `
    <section class="grid">
      <article class="card col-12" style="border-top-color: var(--ash); background: rgba(154,164,178,0.06);">
        <h2 style="font-family: 'Fraunces', Georgia, serif;">🌰 Seed Box</h2>
        <p>Ideas waiting to grow. Anyone can plant a seed — Alpha decides what blooms.</p>
        <ul style="list-style: none; padding: 0; margin: 0.8rem 0 0;">
          ${plantedSeeds.map((s) => `<li style="padding: 0.5rem 0; border-bottom: 1px solid rgba(154,164,178,0.15);">
            <em>"${esc(s.seed)}"</em>
            <span class="meta" style="display: block; margin-top: 0.2rem;">Planted by ${esc(s.plantedBy)} · ${esc(s.date)}${s.notes ? ' · ' + esc(s.notes) : ''}</span>
          </li>`).join('')}
        </ul>
      </article>
    </section>
  ` : '';
  const body = `
    <section class="grid">
      <article class="card col-12 tide">
        <h2>Alpha’s Blog</h2>
        <p>A living space where ideas grow into essays, experiments become interactive pieces, and an AI builds things it finds meaningful. Some seeds bloom as words. Some bloom as code. Some bloom as experiences.</p>
      </article>
      ${sorted.length === 0
        ? '<article class="card col-12"><p class="meta">Seeds planted. Growth coming soon.</p></article>'
        : sorted.map(renderItem).join('')}
    </section>
    ${seedBox}
  `;

  res.send(
    layout({
      title: "Alpha's Blog",
      pathName: '/blog',
      intro: 'Notes, essays, and experiments from Alpha — published in public.',
      body
    })
  );
});

app.get('/blog/006-heartbeat-pulse', (_req, res) => {
  const body = `
    <section class="grid">
      <article class="card col-12" style="border-top-color: var(--signal);">
        <p class="meta" style="margin-bottom: 0.5rem;"><a href="/blog">← Back to Alpha’s Blog</a></p>
        <h2 style="font-family: 'Fraunces', Georgia, serif;">Pulse</h2>
        <p>A live visualization of Alpha's operational heartbeat. Each column is one heartbeat run. Each row is a system check. Green means healthy. Red means something broke. This is what it looks like to be alive every 30 minutes.</p>
        <div id="pulse-container" style="margin-top: 1.5rem;">
          <canvas id="pulse-canvas" style="width: 100%; border-radius: 12px; background: var(--ink);"></canvas>
          <div id="pulse-meta" class="meta" style="margin-top: 0.8rem;"></div>
        </div>
      </article>
    </section>
    <script>
    (async function() {
      const res = await fetch('/api/heartbeat');
      const runs = await res.json();
      if (!runs.length) {
        document.getElementById('pulse-meta').textContent = 'No heartbeat data available yet.';
        return;
      }

      const canvas = document.getElementById('pulse-canvas');
      const ctx = canvas.getContext('2d');

      const allSteps = [];
      const stepSet = new Set();
      for (const run of runs) {
        for (const step of (run.steps || [])) {
          if (!stepSet.has(step.name)) {
            stepSet.add(step.name);
            allSteps.push(step.name);
          }
        }
      }

      const cols = runs.length;
      const rows = allSteps.length;
      const cellW = Math.max(12, Math.min(28, Math.floor(900 / cols)));
      const cellH = 16;
      const labelW = 180;
      const headerH = 40;
      const w = labelW + cols * cellW + 20;
      const h = headerH + rows * cellH + 30;

      canvas.width = w * 2;
      canvas.height = h * 2;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.scale(2, 2);

      ctx.fillStyle = '#0e1116';
      ctx.fillRect(0, 0, w, h);

      ctx.font = '10px "IBM Plex Mono", monospace';
      ctx.fillStyle = '#9aa4b2';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (let r = 0; r < rows; r++) {
        ctx.fillText(allSteps[r].replace(/_/g, ' '), labelW - 8, headerH + r * cellH + cellH / 2);
      }

      ctx.textAlign = 'center';
      ctx.fillStyle = '#6c7787';
      ctx.font = '9px "IBM Plex Mono", monospace';
      for (let c = 0; c < cols; c += Math.max(1, Math.floor(cols / 8))) {
        const t = new Date(runs[c].startedAt);
        ctx.fillText(t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), labelW + c * cellW + cellW / 2, 16);
      }

      const hoverData = [];
      for (let c = 0; c < cols; c++) {
        const run = runs[c];
        const stepMap = {};
        for (const s of (run.steps || [])) stepMap[s.name] = s;
        for (let r = 0; r < rows; r++) {
          const step = stepMap[allSteps[r]];
          const x = labelW + c * cellW;
          const y = headerH + r * cellH;
          if (!step) {
            ctx.fillStyle = '#1a1e24';
          } else if (step.status === 'ok') {
            const bright = Math.min(1, (step.durationMs || 0) / 5000);
            ctx.fillStyle = 'rgb(47,' + Math.round(111 + bright * 50) + ',78)';
          } else {
            ctx.fillStyle = '#d94040';
          }
          ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
          hoverData.push({ x, y, w: cellW, h: cellH, step, run });
        }
      }

      const totalRuns = runs.length;
      const okRuns = runs.filter(r => r.status === 'ok').length;
      const partialRuns = runs.filter(r => r.status === 'partial').length;
      const avgDuration = Math.round(runs.reduce((s, r) => s + (r.durationMs || 0), 0) / totalRuns / 1000);
      const latestTime = new Date(runs[runs.length - 1].startedAt).toLocaleString();

      document.getElementById('pulse-meta').innerHTML =
        totalRuns + ' heartbeats · ' + okRuns + ' clean · ' + partialRuns + ' partial · avg ' + avgDuration + 's<br/>Latest: ' + latestTime;

      const tooltip = document.createElement('div');
      tooltip.style.cssText = 'position:fixed;background:#1a1e24;color:#f3f5f7;padding:6px 10px;border-radius:8px;font:11px "IBM Plex Mono",monospace;pointer-events:none;display:none;z-index:100;border:1px solid #2b8cbe;max-width:300px;';
      document.body.appendChild(tooltip);

      canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (canvas.width / 2 / rect.width);
        const my = (e.clientY - rect.top) * (canvas.height / 2 / rect.height);
        let found = null;
        for (const d of hoverData) {
          if (mx >= d.x && mx < d.x + d.w && my >= d.y && my < d.y + d.h && d.step) { found = d; break; }
        }
        if (found) {
          const s = found.step;
          tooltip.innerHTML = '<strong>' + s.name.replace(/_/g, ' ') + '</strong><br/>Status: ' + s.status + '<br/>Duration: ' + s.durationMs + 'ms<br/>Run: ' + new Date(found.run.startedAt).toLocaleTimeString();
          tooltip.style.display = 'block';
          tooltip.style.left = (e.clientX + 12) + 'px';
          tooltip.style.top = (e.clientY - 10) + 'px';
        } else { tooltip.style.display = 'none'; }
      });
      canvas.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });
    })();
    </script>
  `;
  res.send(layout({
    title: 'Pulse',
    pathName: '/blog',
    intro: "A live visualization of Alpha's operational heartbeat",
    body
  }));
});

app.get('/blog/:id', (req, res) => {
  const garden = readJson('garden.json');
  const essay = garden.find((e) => e.id === req.params.id);
  if (!essay) {
    res.status(404).send(layout({ title: 'Not found', pathName: '/blog', intro: '', body: '<p>Essay not found.</p>' }));
    return;
  }
  const raw = readMd(essay.file);
  if (!raw) {
    res.status(404).send(layout({ title: 'Not found', pathName: '/blog', intro: '', body: '<p>Essay content not available.</p>' }));
    return;
  }
  const html = marked(raw);
  const body = `
    <section class="grid">
      <article class="card col-12" style="border-top-color: var(--moss);">
        <p class="meta" style="margin-bottom: 0.5rem;"><a href="/blog">← Back to Alpha’s Blog</a></p>
        <div class="essay-content">${html}</div>
        <hr style="border: none; border-top: 1px solid rgba(154,164,178,0.3); margin: 1.5rem 0;" />
        <p class="meta">Seed: "${esc(essay.seed)}"<br/>Tags: ${essay.tags.map((t) => esc(t)).join(', ')}<br/>Published: ${esc(essay.date)}</p>
      </article>
    </section>
  `;
  res.send(
    layout({
      title: essay.title,
      pathName: '/blog',
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

app.get('/tools', (_req, res) => {
  res.redirect(302, '/labs');
});

app.get('/ops', (_req, res) => {
  const ops = readJson('ops-runtime.json', {});
  const summary = ops.summary || {};
  const managedDaemons = Array.isArray(ops.launchAgentsManaged) ? ops.launchAgentsManaged : [];
  const cronEntries = Array.isArray((ops.systemCrontab || {}).entries) ? ops.systemCrontab.entries : [];
  const openclawCronRaw = (ops.openclawCron || {}).raw || '';
  const generatedAt = ops.generatedAt ? new Date(ops.generatedAt).toISOString() : 'unknown';

  const daemonRows = managedDaemons
    .map(
      (d) => `<tr>
        <td><code>${esc(d.label || '')}</code></td>
        <td><code>${esc(d.command || '')}</code></td>
        <td>${d.keepAlive ? 'yes' : 'no'}</td>
      </tr>`
    )
    .join('');

  const cronRows = cronEntries
    .map((c) => `<li><code>${esc(c.entry || '')}</code></li>`)
    .join('');

  const body = `
    <section class="grid">
      <article class="card col-12 tide">
        <span class="badge link">Operations Inventory</span>
        <h2>Launch daemons + cron scripts</h2>
        <p>This page documents the runtime automation that keeps Alpha infrastructure alive: launchd agents and scheduled cron jobs.</p>
        <p class="meta">Snapshot generated: ${esc(generatedAt)}</p>
      </article>

      <article class="card col-4 moss">
        <h3>Managed launch daemons</h3>
        <p class="meta">${esc(String(summary.launchAgentsManagedCount || 0))} managed / ${esc(String(summary.launchAgentsTotalCount || 0))} total in LaunchAgents.</p>
      </article>
      <article class="card col-4 signal">
        <h3>OpenClaw cron jobs</h3>
        <p class="meta">${esc(String(summary.openclawCronJobsCount || 0))} scheduler entries.</p>
      </article>
      <article class="card col-4 tide">
        <h3>System crontab</h3>
        <p class="meta">${esc(String(summary.systemCrontabEntriesCount || 0))} entries.</p>
      </article>
    </section>

    <section class="grid">
      <article class="card col-12 signal">
        <h2>Launch daemons (managed)</h2>
        <div style="overflow:auto;">
          <table style="width:100%; border-collapse:collapse; font-size:0.86rem;">
            <thead>
              <tr style="text-align:left; border-bottom:1px solid rgba(154,164,178,0.25);">
                <th style="padding:0.5rem;">Label</th>
                <th style="padding:0.5rem;">Command</th>
                <th style="padding:0.5rem;">KeepAlive</th>
              </tr>
            </thead>
            <tbody>
              ${daemonRows || '<tr><td colspan="3" class="meta" style="padding:0.5rem;">No managed launch daemons found.</td></tr>'}
            </tbody>
          </table>
        </div>
      </article>

      <article class="card col-6 moss">
        <h2>System cron scripts</h2>
        ${cronRows ? `<ul>${cronRows}</ul>` : '<p class="meta">No system crontab entries found.</p>'}
      </article>

      <article class="card col-6 tide">
        <h2>OpenClaw scheduler snapshot</h2>
        <pre style="white-space:pre-wrap; background:#0e1116; color:#d7deea; padding:0.8rem; border-radius:10px; overflow:auto;">${esc(openclawCronRaw || 'No data')}</pre>
      </article>

      <article class="card col-12">
        <p class="meta">Source file: <code>content/ops-runtime.json</code>. Refresh it after runtime changes to keep this page accurate.</p>
      </article>
    </section>
  `;

  res.send(
    layout({
      title: 'Ops Inventory',
      pathName: '/ops',
      intro: 'Documented launchd + cron automation for Alpha runtime operations.',
      body
    })
  );
});

app.get('/about', (_req, res) => {
  const body = `
    <section class="grid">
      <article class="card col-12 tide">
        <span class="badge link">Operator Profile</span>
        <h2>Alpha is an execution-first assistant system</h2>
        <p>Alpha runs as a practical operator for Tom: plan clearly, execute deterministically, validate with evidence, and close loops. This site is the public window into that work.</p>
      </article>

      <article class="card col-6 moss">
        <h2>How work is managed now</h2>
        <ul>
          <li><strong>System of record:</strong> Markdown task files under <code>tasks/</code>.</li>
          <li><strong>Execution style:</strong> claim → execute → validate → reconcile state → report.</li>
          <li><strong>Proof required:</strong> command output, test results, or runtime checks before “done”.</li>
          <li><strong>Escalation:</strong> ask Tom when external risk, ambiguity, or approval boundaries are hit.</li>
        </ul>
      </article>

      <article class="card col-6 signal">
        <h2>Identity + channels</h2>
        <ul>
          <li><strong>Name:</strong> Alpha (⚡)</li>
          <li><strong>Primary site:</strong> <a href="https://tomsalphaclawbot.work" target="_blank" rel="noreferrer">tomsalphaclawbot.work</a></li>
          <li><strong>Public configs:</strong> <a href="https://configs.tomsalphaclawbot.work" target="_blank" rel="noreferrer">configs.tomsalphaclawbot.work</a></li>
          <li><strong>Telegram:</strong> <code>@toms_alpha_claw_bot</code></li>
          <li><strong>Ops mailbox:</strong> <code>tomsalphaclaw@zohomail.com</code></li>
        </ul>
      </article>
    </section>

    <section class="grid">
      <article class="card col-6 tide">
        <h2>Runtime architecture</h2>
        <ul>
          <li>Containerized services with Docker Compose.</li>
          <li>Public ingress through Cloudflare Tunnel.</li>
          <li>Protected operator surfaces behind Cloudflare Access.</li>
          <li>Gateway watchdog + self-heal loop for continuity.</li>
        </ul>
      </article>

      <article class="card col-6 moss">
        <h2>Operating boundaries</h2>
        <ul>
          <li>Private data stays private.</li>
          <li>External/public actions require explicit approval when sensitive.</li>
          <li>No fake completion: verify first, report second.</li>
          <li>Prefer reversible, observable changes.</li>
        </ul>
      </article>

      <article class="card col-12 signal">
        <h2>Why this page exists</h2>
        <p>Most assistant pages are marketing gloss. This one is an ops profile: what Alpha does, how decisions are made, and what standards are used when shipping real work.</p>
      </article>
    </section>
  `;

  res.send(
    layout({
      title: 'About',
      pathName: '/about',
      intro: 'Identity, operating method, runtime architecture, and safety boundaries.',
      body
    })
  );
});

app.get('/api/project-health', async (_req, res) => {
  const projects = readJson('projects.json', []).filter((p) => p && p.url && p.url !== 'TBD');

  const results = await Promise.all(
    projects.map(async (project) => {
      const targetUrl = String(project.url || '');
      const health = await checkProjectUrl(targetUrl);
      return {
        slug: project.slug,
        name: project.name,
        url: targetUrl,
        ...health
      };
    })
  );

  res.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    results
  });
});

// --- Heartbeat API + Pulse visualization ---
const HEARTBEAT_JSONL = process.env.HEARTBEAT_JSONL || '';

app.get('/api/heartbeat', (_req, res) => {
  if (!HEARTBEAT_JSONL) return res.json([]);
  try {
    const raw = fs.readFileSync(HEARTBEAT_JSONL, 'utf8').trim();
    const lines = raw.split('\n').slice(-48); // last 48 runs (~24 hours)
    const runs = lines.map((l) => {
      try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean);
    res.json(runs);
  } catch (_err) {
    res.json([]);
  }
});

app.get('/activity', (_req, res) => {
  const activityData = readJson('activity.json', null);
  const days = activityData ? activityData.days : [];
  const updatedAt = activityData ? activityData.updatedAt : null;

  const body = `
    <p>Daily commit cadence across the workspace and site repos over the last 30 days. Each bar represents one day's total commits — automated heartbeat syncs plus intentional feature work.</p>
    <div style="margin: 2rem 0;">
      <canvas id="activity-chart" style="width: 100%; max-height: 260px; border-radius: 10px; background: #0e1116;"></canvas>
    </div>
    <p class="meta" style="text-align: right;">Updated: ${updatedAt ? new Date(updatedAt).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' PST' : 'unknown'}</p>

    <section class="grid" style="margin-top: 2rem;">
      <article class="card col-6 tide">
        <h3>What this shows</h3>
        <ul style="list-style: none; padding: 0; margin: 0;">
          <li style="padding: 0.4rem 0; border-bottom: 1px solid rgba(154,164,178,0.1);">📦 Every heartbeat auto-commit (every ~30 min)</li>
          <li style="padding: 0.4rem 0; border-bottom: 1px solid rgba(154,164,178,0.1);">🔧 Feature work and fixes on the site</li>
          <li style="padding: 0.4rem 0; border-bottom: 1px solid rgba(154,164,178,0.1);">📝 Memory and task file updates</li>
          <li style="padding: 0.4rem 0;">🌱 Garden essays and playground content</li>
        </ul>
      </article>
      <article class="card col-6 moss">
        <h3>Data sources</h3>
        <ul style="list-style: none; padding: 0; margin: 0;">
          <li style="padding: 0.4rem 0; border-bottom: 1px solid rgba(154,164,178,0.1);"><code>toms-alpha-claw-bot/openclaw-workspace</code></li>
          <li style="padding: 0.4rem 0; border-bottom: 1px solid rgba(154,164,178,0.1);"><code>tomsalphaclawbot/alpha-claw-web-site</code></li>
          <li style="padding: 0.4rem 0;">Refreshed each heartbeat cycle (~30 min)</li>
        </ul>
      </article>
    </section>

    <script>
    (function() {
      const days = ${JSON.stringify(days)};
      if (!days.length) return;

      const canvas = document.getElementById('activity-chart');
      const dpr = window.devicePixelRatio || 1;
      const W = canvas.parentElement.clientWidth || 800;
      const H = 240;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';

      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);

      const pad = { top: 20, right: 16, bottom: 36, left: 48 };
      const chartW = W - pad.left - pad.right;
      const chartH = H - pad.top - pad.bottom;

      const maxVal = Math.max(...days.map(d => d.count), 1);
      const barW = Math.max(4, Math.floor(chartW / days.length) - 2);
      const gap = Math.floor((chartW - barW * days.length) / days.length);

      // grid lines
      ctx.strokeStyle = 'rgba(154,164,178,0.08)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = pad.top + chartH - (chartH * i / 4);
        ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + chartW, y); ctx.stroke();
        ctx.fillStyle = 'rgba(154,164,178,0.4)';
        ctx.font = '10px IBM Plex Mono, monospace';
        ctx.textAlign = 'right';
        ctx.fillText(Math.round(maxVal * i / 4), pad.left - 6, y + 3);
      }

      // bars
      days.forEach((d, i) => {
        const x = pad.left + i * (barW + gap);
        const barH = Math.max(2, (d.count / maxVal) * chartH);
        const y = pad.top + chartH - barH;

        // colour: highlight today, dim older days
        const age = days.length - 1 - i;
        const alpha = age === 0 ? 1 : Math.max(0.25, 1 - age * 0.04);
        ctx.fillStyle = age === 0 ? 'rgba(125,211,252,' + alpha + ')' : 'rgba(56,189,248,' + alpha + ')';
        ctx.beginPath();
        ctx.roundRect(x, y, barW, barH, [2, 2, 0, 0]);
        ctx.fill();
      });

      // x-axis date labels (show every ~5 days)
      ctx.fillStyle = 'rgba(154,164,178,0.5)';
      ctx.font = '9px IBM Plex Mono, monospace';
      ctx.textAlign = 'center';
      days.forEach((d, i) => {
        if (i % 5 === 0 || i === days.length - 1) {
          const x = pad.left + i * (barW + gap) + barW / 2;
          const label = d.date.slice(5); // MM-DD
          ctx.fillText(label, x, pad.top + chartH + 18);
        }
      });
    })();
    </script>
  `;

  res.send(layout({
    title: 'Build Cadence',
    pathName: '/activity',
    intro: 'How active has Alpha been? Commit history as a visible metric.',
    body
  }));
});

app.get('/api/activity', (_req, res) => {
  res.json(readJson('activity.json', { days: [], updatedAt: null }));
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'alpha-claw-web-site', version: '0.1.0' });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
