function registerLabsRoutes({app, layout, readJson, esc, SHOW_PRIVATE_PROJECTS = false}) {
const isVisibleProject = (project) => SHOW_PRIVATE_PROJECTS || project?.visibility !== 'private';

app.get('/labs', (_req, res) => {
  const projects = readJson('projects.json').filter(isVisibleProject);
  const liveProjects = projects.filter((p) => p.url && p.url !== 'TBD');

  const body = `
    <section class="grid">
      <article class="card col-12 tide">
        <h2>Live demos overview</h2>
        <p>Live systems, real health checks, and working prototypes. Everything on this page talks to actual running services - nothing is mocked.</p>
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
                <span class="status-latency meta" style="font-size: 0.75rem;">-</span>
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
        <p>Alpha has a real voice - text-to-speech output generated locally through Chatterbox-Turbo on Apple Silicon. These samples come straight from the pipeline, no cloud processing.</p>
        <div id="voice-demos" style="margin-top: 1rem; display: flex; flex-direction: column; gap: 1rem;">
          <div style="padding: 1rem; background: rgba(154,164,178,0.06); border-radius: 10px; border: 1px solid rgba(154,164,178,0.12);">
            <p style="margin: 0 0 0.5rem; font-weight: 600; font-size: 0.85rem; color: var(--c-accent, #7dd3fc);">Sample A - Voice synthesis demo</p>
            <audio controls style="width: 100%; accent-color: #7dd3fc;" preload="none">
              <source src="/public/audio/sample-voice-a.wav" type="audio/wav" />
              Your browser does not support audio playback.
            </audio>
          </div>
          <div style="padding: 1rem; background: rgba(154,164,178,0.06); border-radius: 10px; border: 1px solid rgba(154,164,178,0.12);">
            <p style="margin: 0 0 0.5rem; font-weight: 600; font-size: 0.85rem; color: var(--c-accent, #7dd3fc);">Sample B - Extended generation</p>
            <audio controls style="width: 100%; accent-color: #7dd3fc;" preload="none">
              <source src="/public/audio/sample-voice-b.wav" type="audio/wav" />
              Your browser does not support audio playback.
            </audio>
          </div>
          <div style="padding: 1rem; background: rgba(154,164,178,0.06); border-radius: 10px; border: 1px solid rgba(154,164,178,0.12);">
            <p style="margin: 0 0 0.5rem; font-weight: 600; font-size: 0.85rem; color: var(--c-accent, #7dd3fc);">Sample C - Alternate voice style</p>
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
        <p>Watch Alpha's operational heartbeat in real time. Every 30 minutes, a holistic health check runs - and the Pulse page visualizes the results as a heatmap.</p>
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
        { id: 'gateway', label: 'Gateway', x: 400, y: 140, r: 32, color: '#2b8cbe', desc: 'OpenClaw Gateway - routes messages to the right agent session.' },
        { id: 'alpha', label: 'Alpha', x: 400, y: 260, r: 36, color: '#2f6f4e', desc: 'Alpha main agent - triage, dispatch, memory, and direct execution.' },
        { id: 'telegram', label: 'TG', x: 180, y: 100, r: 22, color: '#0088cc', desc: 'Telegram bot channel - primary fast-path messaging.' },
        { id: 'discord', label: 'DC', x: 620, y: 100, r: 22, color: '#5865F2', desc: 'Discord bot - Voice Controller server.' },
        { id: 'vapi', label: 'Vapi', x: 180, y: 200, r: 22, color: '#ff6b35', desc: 'Vapi voice gateway - phone call integration (in development).' },
        { id: 'subagent', label: 'Workers', x: 620, y: 260, r: 26, color: '#9aa4b2', desc: 'Sub-agents for coding, research, and parallel task execution.' },
        { id: 'memory', label: 'Memory', x: 250, y: 340, r: 24, color: '#8b6ec1', desc: 'Durable memory - MEMORY.md, daily logs, and semantic search.' },
        { id: 'tools', label: 'Tools', x: 550, y: 340, r: 24, color: '#d94040', desc: 'Shell, browser, GitHub, Docker, mail, search, TTS, and more.' },
        { id: 'site', label: 'Site', x: 400, y: 390, r: 20, color: '#e6a817', desc: 'This website - public surface for progress, garden, and demos.' }
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
}

module.exports = { registerLabsRoutes };
