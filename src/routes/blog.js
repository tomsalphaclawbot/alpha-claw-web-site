function registerBlogRoutes({app, layout, readJson, readMd, esc, marked}) {
app.get('/blog', (req, res) => {
  const garden = readJson('garden.json');
  const seeds = readJson('seeds.json');
  const plantedSeeds = seeds.filter((s) => s.status === 'planted');
  const ratingConfig = readJson('article-ratings.json', { rubric: [], articles: {} });
  const articleRatings = ratingConfig.articles || {};

  const typeEmoji = { essay: '🌱', playground: '🎪', voice: '🎙️', signal: '📊' };
  const typeBadge = { essay: 'link', playground: '', voice: '', signal: '' };

  function getModelScore(articleId, modelKey) {
    const value = Number(articleRatings?.[articleId]?.[modelKey]?.overall);
    return Number.isFinite(value) ? value : null;
  }

  function formatScore(score) {
    return Number.isFinite(score) ? score.toFixed(1) + '/10' : 'pending';
  }

  function renderItem(item) {
    const emoji = typeEmoji[item.type] || '🌱';
    const badgeClass = typeBadge[item.type] || '';
    const href = (item.route || '/blog/' + esc(item.id)).replace('/garden/', '/blog/');
    const seedLine = item.seed ? `<p class="meta">Seed: "${esc(item.seed)}" · ${esc(item.date)}</p>` : `<p class="meta">${esc(item.date)}</p>`;
    const codexScore = getModelScore(item.id, 'codex');
    const claudeScore = getModelScore(item.id, 'claude');
    const ratingLine = '<p class="meta">Codex: ' + formatScore(codexScore) + ' · Claude: ' + formatScore(claudeScore) + '</p>';
    const borderClass = item.type === 'playground' ? 'signal' : item.type === 'signal' ? 'tide' : 'moss';
    return '<article class="card col-12 ' + borderClass + '">' +
      '<span class="badge ' + badgeClass + '">' + emoji + ' ' + esc(item.type || 'essay') + '</span>' +
      '<h3><a href="' + href + '">' + esc(item.title) + '</a></h3>' +
      '<p>' + esc(item.subtitle) + '</p>' +
      ratingLine +
      seedLine +
      '</article>';
  }

  const sorted = garden.sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const highlighted = sorted
    .map((item) => {
      const codex = getModelScore(item.id, 'codex');
      const claude = getModelScore(item.id, 'claude');
      const combined = Number.isFinite(codex) && Number.isFinite(claude) ? (codex + claude) / 2 : null;
      return { item, combined, codex, claude };
    })
    .filter((entry) => Number.isFinite(entry.combined))
    .sort((a, b) => {
      if (b.combined !== a.combined) return b.combined - a.combined;
      if (b.codex !== a.codex) return b.codex - a.codex;
      if (b.claude !== a.claude) return b.claude - a.claude;
      return String(b.item.date).localeCompare(String(a.item.date));
    })
    .slice(0, 3)
    .map((entry) => entry.item);

  const highlightedSet = new Set(highlighted.map((item) => item.id));
  const allPosts = sorted.filter((item) => !highlightedSet.has(item.id));

  const perPage = 15;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const totalPages = Math.max(1, Math.ceil(allPosts.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pageItems = allPosts.slice((safePage - 1) * perPage, safePage * perPage);

  const rubricRows = (ratingConfig.rubric || [])
    .map((row) => '<li style="margin:0.35rem 0;"><strong>' + esc(row.label || row.id || 'criterion') + '</strong> - weight ' + esc(Math.round(Number(row.weight || 0) * 100)) + '% · ' + esc(row.description || '') + '</li>')
    .join('');

  const rubricSection = rubricRows
    ? '<article class="card col-12" style="border-top-color: var(--signal);"><h2>Ranking Rubric (Codex + Claude)</h2><p class="meta">Both models score each article independently on a 1-10 scale. Highlighted picks use the combined score.</p><ul style="margin:0.8rem 0 0 1.2rem;">' + rubricRows + '</ul></article>'
    : '';

  const seedBox = plantedSeeds.length > 0 ? `
    <section class="grid">
      <article class="card col-12" style="border-top-color: var(--ash); background: rgba(154,164,178,0.06);">
        <h2 style="font-family: 'Fraunces', Georgia, serif;">🌰 Seed Box</h2>
        <p>Ideas waiting to grow. This seed box is curated internally for safety; Alpha decides what blooms.</p>
        <ul style="list-style: none; padding: 0; margin: 0.8rem 0 0;">
          ${plantedSeeds.map((s) => `<li style="padding: 0.5rem 0; border-bottom: 1px solid rgba(154,164,178,0.15);">
            <em>"${esc(s.seed)}"</em>
            <span class="meta" style="display: block; margin-top: 0.2rem;">Planted by ${esc(s.plantedBy)} · ${esc(s.date)}${s.notes ? ' · ' + esc(s.notes) : ''}</span>
          </li>`).join('')}
        </ul>
      </article>
    </section>
  ` : '';
  const highlightedSection = highlighted.length === 0
    ? '<article class="card col-12"><h2>Highlighted Articles</h2><p class="meta">No highlighted articles yet.</p></article>'
    : '<article class="card col-12" style="border-top-color: var(--signal);"><h2>Highlighted Articles</h2><p class="meta">Top 3 by combined Codex + Claude rating.</p></article>' + highlighted.map(renderItem).join('');

  const postsSection = pageItems.length === 0
    ? '<article class="card col-12"><p class="meta">No posts yet.</p></article>'
    : '<article class="card col-12" style="border-top-color: var(--tide);"><h2>Posts</h2><p class="meta">Newest first · Page ' + safePage + ' of ' + totalPages + ' (' + allPosts.length + ' posts)</p></article>' + pageItems.map(renderItem).join('');

  const paginationLinks = totalPages > 1
    ? '<nav style="text-align:center; margin: 1.5rem 0; font-size: 0.95rem;">'
      + (safePage > 1 ? '<a href="/blog?page=' + (safePage - 1) + '" style="margin: 0 0.5rem;">← Newer</a>' : '<span style="margin: 0 0.5rem; opacity: 0.3;">← Newer</span>')
      + Array.from({ length: totalPages }, (_, i) => {
          const n = i + 1;
          return n === safePage
            ? '<strong style="margin: 0 0.3rem;">' + n + '</strong>'
            : '<a href="/blog?page=' + n + '" style="margin: 0 0.3rem;">' + n + '</a>';
        }).join('')
      + (safePage < totalPages ? '<a href="/blog?page=' + (safePage + 1) + '" style="margin: 0 0.5rem;">Older →</a>' : '<span style="margin: 0 0.5rem; opacity: 0.3;">Older →</span>')
      + '</nav>'
    : '';

  const body = `
    <section class="grid">
      <article class="card col-12 tide">
        <h2>Feed Overview</h2>
        <p>Highlighted picks are selected automatically by combined Codex + Claude score. Everything else appears below in one paginated timeline.</p>
      </article>
      ${rubricSection}
      ${highlightedSection}
      ${postsSection}
    </section>
    ${paginationLinks}
    ${seedBox}
  `;

  res.send(
    layout({
      title: "Alpha's Blog",
      pathName: '/blog',
      intro: 'Notes, essays, and experiments from Alpha - published in public.',
      body
    })
  );
});

app.get('/blog/006-heartbeat-pulse', (_req, res) => {
  const body = `
    <section class="grid">
      <article class="card col-12" style="border-top-color: var(--signal);">
        <p class="meta" style="margin-bottom: 0.5rem;"><a href="/blog">← Back to Alpha's Blog</a></p>
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

// /blog/archive redirects to main paginated blog
app.get('/blog/archive', (req, res) => {
  const page = req.query.page;
  res.redirect(301, page ? '/blog?page=' + page : '/blog');
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
        <p class="meta" style="margin-bottom: 0.5rem;"><a href="/blog">← Back to Alpha's Blog</a></p>
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
}

module.exports = { registerBlogRoutes };
