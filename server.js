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
    ['/garden', 'Garden'],
    ['/demos', 'Demos'],
    ['/secure-apps', 'Secure Apps'],
    ['/activity', 'Activity'],
    ['/tools', 'Tools'],
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
        <p><a href="/garden">Explore the garden →</a></p>
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

// Legacy redirect
app.get('/playground', (_req, res) => res.redirect(301, '/garden'));

// --- Interactive Demos Gallery ---
app.get('/demos', (_req, res) => {
  const projects = readJson('projects.json');
  const liveProjects = projects.filter((p) => p.url && p.url !== 'TBD');

  const body = `
    <section class="grid">
      <article class="card col-12 tide">
        <h2>Interactive Demos</h2>
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
        <p><a href="/garden/006-heartbeat-pulse" style="
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

      async function checkEndpoint(tile) {
        const url = tile.dataset.url;
        const dot = tile.querySelector('.status-dot');
        const latency = tile.querySelector('.status-latency');
        dot.style.background = '#e6a817';
        latency.textContent = 'checking…';

        const start = performance.now();
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);
          await fetch(url, { mode: 'no-cors', signal: controller.signal });
          clearTimeout(timeout);
          const ms = Math.round(performance.now() - start);
          dot.style.background = '#2f6f4e';
          tile.style.borderColor = 'rgba(47,111,78,0.4)';
          latency.textContent = ms + 'ms';
          return 'up';
        } catch (err) {
          dot.style.background = '#d94040';
          tile.style.borderColor = 'rgba(217,64,64,0.3)';
          latency.textContent = err.name === 'AbortError' ? 'timeout' : 'unreachable';
          return 'down';
        }
      }

      btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.textContent = '⏳ Checking…';
        statusEl.textContent = '';
        let up = 0, down = 0;
        const promises = Array.from(tiles).map(async (tile) => {
          const result = await checkEndpoint(tile);
          if (result === 'up') up++; else down++;
        });
        await Promise.all(promises);
        btn.disabled = false;
        btn.textContent = '▶ Check All Endpoints';
        statusEl.textContent = up + '/' + tiles.length + ' responding' + (down > 0 ? ' · ' + down + ' down' : ' · all healthy ✓');
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
      title: 'Demos',
      pathName: '/garden',
      intro: 'Live systems, real-time checks, and working prototypes. Nothing here is mocked.',
      body
    })
  );
});

app.get('/garden', (_req, res) => {
  const garden = readJson('garden.json');
  const seeds = readJson('seeds.json');
  const plantedSeeds = seeds.filter((s) => s.status === 'planted');

  const typeEmoji = { essay: '🌱', playground: '🎪', voice: '🎙️', signal: '📊' };
  const typeBadge = { essay: 'link', playground: '', voice: '', signal: '' };

  function renderItem(item) {
    const emoji = typeEmoji[item.type] || '🌱';
    const badgeClass = typeBadge[item.type] || '';
    const href = item.route || '/garden/' + esc(item.id);
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
        <h2>The Fabric Garden</h2>
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
      title: 'The Garden',
      pathName: '/garden',
      intro: 'Where ideas are planted, tended, and grown in the open.',
      body
    })
  );
});

app.get('/garden/006-heartbeat-pulse', (_req, res) => {
  const body = `
    <section class="grid">
      <article class="card col-12" style="border-top-color: var(--signal);">
        <p class="meta" style="margin-bottom: 0.5rem;"><a href="/garden">← Back to the Garden</a></p>
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
    pathName: '/garden',
    intro: "A live visualization of Alpha's operational heartbeat",
    body
  }));
});

app.get('/garden/:id', (req, res) => {
  const garden = readJson('garden.json');
  const essay = garden.find((e) => e.id === req.params.id);
  if (!essay) {
    res.status(404).send(layout({ title: 'Not found', pathName: '/garden', intro: '', body: '<p>Essay not found.</p>' }));
    return;
  }
  const raw = readMd(essay.file);
  if (!raw) {
    res.status(404).send(layout({ title: 'Not found', pathName: '/garden', intro: '', body: '<p>Essay content not available.</p>' }));
    return;
  }
  const html = marked(raw);
  const body = `
    <section class="grid">
      <article class="card col-12" style="border-top-color: var(--moss);">
        <p class="meta" style="margin-bottom: 0.5rem;"><a href="/garden">← Back to the Garden</a></p>
        <div class="essay-content">${html}</div>
        <hr style="border: none; border-top: 1px solid rgba(154,164,178,0.3); margin: 1.5rem 0;" />
        <p class="meta">Seed: "${esc(essay.seed)}"<br/>Tags: ${essay.tags.map((t) => esc(t)).join(', ')}<br/>Published: ${esc(essay.date)}</p>
      </article>
    </section>
  `;
  res.send(
    layout({
      title: essay.title,
      pathName: '/garden',
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
  const body = `
    <p>Small utilities that are actually useful. No logins, no tracking, no nonsense — just tools that run in your browser.</p>

    <section class="grid" style="margin-top: 1.5rem;">

      <!-- JSON Formatter -->
      <article class="card col-12 tide">
        <h2>🔧 JSON Formatter</h2>
        <p>Paste any JSON (minified, malformed, or already pretty) and get it back clean and readable.</p>
        <div style="display: flex; gap: 1rem; margin-top: 1rem; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 280px;">
            <label for="json-input" style="display: block; font-size: 0.8rem; color: rgba(154,164,178,0.7); margin-bottom: 0.4rem;">Input</label>
            <textarea id="json-input" placeholder='{"key":"value","arr":[1,2,3]}' style="
              width: 100%; height: 220px; background: #0e1116; border: 1px solid rgba(154,164,178,0.15);
              border-radius: 8px; color: #e2e8f0; font-family: IBM Plex Mono, monospace; font-size: 0.8rem;
              padding: 0.75rem; resize: vertical; box-sizing: border-box; outline: none;
            "></textarea>
          </div>
          <div style="flex: 1; min-width: 280px;">
            <label style="display: block; font-size: 0.8rem; color: rgba(154,164,178,0.7); margin-bottom: 0.4rem;">Output</label>
            <pre id="json-output" style="
              width: 100%; height: 220px; background: #0e1116; border: 1px solid rgba(154,164,178,0.15);
              border-radius: 8px; color: #a3e635; font-family: IBM Plex Mono, monospace; font-size: 0.8rem;
              padding: 0.75rem; overflow: auto; margin: 0; box-sizing: border-box; white-space: pre-wrap; word-break: break-all;
            "></pre>
          </div>
        </div>
        <div style="margin-top: 0.75rem; display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
          <button id="json-format-btn" style="
            padding: 0.45rem 1.1rem; background: rgba(125,211,252,0.12); border: 1px solid rgba(125,211,252,0.3);
            border-radius: 6px; color: #7dd3fc; font-size: 0.85rem; cursor: pointer; font-family: inherit;
          ">Format ↵</button>
          <button id="json-minify-btn" style="
            padding: 0.45rem 1.1rem; background: rgba(154,164,178,0.08); border: 1px solid rgba(154,164,178,0.2);
            border-radius: 6px; color: #94a3b8; font-size: 0.85rem; cursor: pointer; font-family: inherit;
          ">Minify</button>
          <button id="json-copy-btn" style="
            padding: 0.45rem 1.1rem; background: rgba(154,164,178,0.08); border: 1px solid rgba(154,164,178,0.2);
            border-radius: 6px; color: #94a3b8; font-size: 0.85rem; cursor: pointer; font-family: inherit;
          ">Copy</button>
          <button id="json-clear-btn" style="
            padding: 0.45rem 1.1rem; background: rgba(154,164,178,0.08); border: 1px solid rgba(154,164,178,0.2);
            border-radius: 6px; color: #94a3b8; font-size: 0.85rem; cursor: pointer; font-family: inherit;
          ">Clear</button>
          <span id="json-status" style="font-size: 0.8rem; color: rgba(154,164,178,0.5); margin-left: 0.25rem;"></span>
        </div>
      </article>

      <!-- Unix Timestamp Converter -->
      <article class="card col-6 moss">
        <h2>🕐 Unix Timestamp</h2>
        <p>Convert between Unix timestamps and human-readable dates.</p>
        <div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.75rem;">
          <div>
            <label style="display: block; font-size: 0.8rem; color: rgba(154,164,178,0.7); margin-bottom: 0.3rem;">Unix timestamp (seconds)</label>
            <input id="ts-unix" type="number" placeholder="e.g. 1741234567" style="
              width: 100%; padding: 0.5rem 0.75rem; background: #0e1116; border: 1px solid rgba(154,164,178,0.15);
              border-radius: 6px; color: #e2e8f0; font-family: IBM Plex Mono, monospace; font-size: 0.85rem;
              box-sizing: border-box; outline: none;
            " />
          </div>
          <div>
            <label style="display: block; font-size: 0.8rem; color: rgba(154,164,178,0.7); margin-bottom: 0.3rem;">ISO / Human date (UTC)</label>
            <input id="ts-human" type="text" placeholder="e.g. 2026-03-07T12:00:00Z" style="
              width: 100%; padding: 0.5rem 0.75rem; background: #0e1116; border: 1px solid rgba(154,164,178,0.15);
              border-radius: 6px; color: #e2e8f0; font-family: IBM Plex Mono, monospace; font-size: 0.85rem;
              box-sizing: border-box; outline: none;
            " />
          </div>
          <div id="ts-result" style="
            padding: 0.6rem 0.75rem; background: rgba(154,164,178,0.05); border-radius: 6px;
            font-family: IBM Plex Mono, monospace; font-size: 0.8rem; color: #a3e635; min-height: 2.5rem;
          "></div>
          <button id="ts-now-btn" style="
            align-self: flex-start; padding: 0.4rem 0.9rem; background: rgba(154,164,178,0.08);
            border: 1px solid rgba(154,164,178,0.2); border-radius: 6px; color: #94a3b8;
            font-size: 0.82rem; cursor: pointer; font-family: inherit;
          ">Use now</button>
        </div>
      </article>

      <!-- Uptime SLA Calculator -->
      <article class="card col-6 signal">
        <h2>📊 Uptime SLA</h2>
        <p>How much downtime does your SLA actually allow per month?</p>
        <div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.75rem;">
          <div>
            <label style="display: block; font-size: 0.8rem; color: rgba(154,164,178,0.7); margin-bottom: 0.3rem;">Uptime % (e.g. 99.9)</label>
            <input id="sla-pct" type="number" step="0.001" min="0" max="100" value="99.9" style="
              width: 100%; padding: 0.5rem 0.75rem; background: #0e1116; border: 1px solid rgba(154,164,178,0.15);
              border-radius: 6px; color: #e2e8f0; font-family: IBM Plex Mono, monospace; font-size: 0.85rem;
              box-sizing: border-box; outline: none;
            " />
          </div>
          <div id="sla-result" style="
            padding: 0.75rem; background: rgba(154,164,178,0.05); border-radius: 6px;
            font-family: IBM Plex Mono, monospace; font-size: 0.8rem; color: #e2e8f0; line-height: 1.8;
          "></div>
        </div>
      </article>

    </section>

    <script>
    // JSON Formatter
    (function() {
      const input = document.getElementById('json-input');
      const output = document.getElementById('json-output');
      const status = document.getElementById('json-status');

      function format(minify) {
        const raw = input.value.trim();
        if (!raw) { output.textContent = ''; status.textContent = ''; return; }
        try {
          const parsed = JSON.parse(raw);
          output.textContent = minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2);
          output.style.color = '#a3e635';
          const keys = JSON.stringify(parsed).match(/"/g);
          status.textContent = '✓ valid' + (keys ? ' · ~' + Math.floor(keys.length/2) + ' keys' : '');
          status.style.color = '#a3e635';
        } catch(e) {
          output.textContent = '⚠ ' + e.message;
          output.style.color = '#f87171';
          status.textContent = '✗ invalid JSON';
          status.style.color = '#f87171';
        }
      }

      input.addEventListener('input', () => format(false));
      document.getElementById('json-format-btn').addEventListener('click', () => format(false));
      document.getElementById('json-minify-btn').addEventListener('click', () => format(true));
      document.getElementById('json-clear-btn').addEventListener('click', () => {
        input.value = ''; output.textContent = ''; status.textContent = '';
      });
      document.getElementById('json-copy-btn').addEventListener('click', () => {
        const t = output.textContent;
        if (!t) return;
        navigator.clipboard.writeText(t).then(() => {
          const btn = document.getElementById('json-copy-btn');
          btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = 'Copy', 1500);
        });
      });
    })();

    // Timestamp converter
    (function() {
      const unixEl = document.getElementById('ts-unix');
      const humanEl = document.getElementById('ts-human');
      const result = document.getElementById('ts-result');

      function fromUnix(v) {
        const n = parseInt(v, 10);
        if (isNaN(n)) { result.textContent = ''; return; }
        const d = new Date(n * 1000);
        result.innerHTML =
          'UTC: ' + d.toISOString() + '<br>' +
          'Local: ' + d.toLocaleString() + '<br>' +
          (n > Date.now()/1000 ? '⏳ ' + Math.round((n - Date.now()/1000)/3600) + 'h in the future' :
           '⏱ ' + Math.round((Date.now()/1000 - n)/86400) + ' days ago');
      }
      function fromHuman(v) {
        const d = new Date(v);
        if (isNaN(d.getTime())) { result.textContent = ''; return; }
        const ts = Math.floor(d.getTime() / 1000);
        unixEl.value = ts;
        result.innerHTML = 'Unix: ' + ts + '<br>UTC: ' + d.toISOString();
      }

      unixEl.addEventListener('input', () => fromUnix(unixEl.value));
      humanEl.addEventListener('input', () => fromHuman(humanEl.value));
      document.getElementById('ts-now-btn').addEventListener('click', () => {
        const now = Math.floor(Date.now() / 1000);
        unixEl.value = now; fromUnix(now);
      });
    })();

    // SLA calculator
    (function() {
      const pctEl = document.getElementById('sla-pct');
      const result = document.getElementById('sla-result');
      const MONTH = 30.44 * 24 * 60; // avg minutes/month

      function calc() {
        const pct = parseFloat(pctEl.value);
        if (isNaN(pct) || pct < 0 || pct > 100) { result.textContent = ''; return; }
        const downMin = MONTH * (1 - pct / 100);
        const fmt = (m) => m < 1 ? Math.round(m * 60) + 's' : m < 60 ? Math.round(m) + 'm' : m < 1440 ? (m/60).toFixed(1) + 'h' : (m/1440).toFixed(2) + 'd';
        result.innerHTML =
          'Per month: <b style="color:#7dd3fc">' + fmt(downMin) + '</b><br>' +
          'Per week:  <b style="color:#7dd3fc">' + fmt(downMin / 4.33) + '</b><br>' +
          'Per year:  <b style="color:#7dd3fc">' + fmt(downMin * 12) + '</b>';
      }

      pctEl.addEventListener('input', calc);
      calc();
    })();
    </script>
  `;

  res.send(layout({
    title: 'Tools',
    pathName: '/tools',
    intro: 'Small utilities. No logins, no tracking — just browser-side tools.',
    body
  }));
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
