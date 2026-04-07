function registerApiRoutes({app, layout, readJson, esc, checkProjectUrl, PROJECT_HEALTH_TIMEOUT_MS, HEARTBEAT_JSONL, fs, SHOW_PRIVATE_PROJECTS = false}) {
const isVisibleProject = (project) => SHOW_PRIVATE_PROJECTS || project?.visibility !== 'private';

app.get('/api/project-health', async (_req, res) => {
  const projects = readJson('projects.json', []).filter((p) => p && isVisibleProject(p) && p.url && p.url !== 'TBD');

  const results = await Promise.all(
    projects.map(async (project) => {
      const targetUrl = String(project.url || '');
      const health = await checkProjectUrl(targetUrl, PROJECT_HEALTH_TIMEOUT_MS);
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
    <p>Daily commit cadence across the workspace and site repos over the last 30 days. Each bar represents one day's total commits - automated heartbeat syncs plus intentional feature work.</p>
    <div style="margin: 2rem 0;">
      <canvas id="activity-chart" style="width: 100%; max-height: 260px; border-radius: 10px; background: #0e1116;"></canvas>
    </div>
    <p class="meta" style="text-align: right;">Updated: ${updatedAt ? new Date(updatedAt).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }) : 'unknown'}</p>

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
}

module.exports = { registerApiRoutes };
