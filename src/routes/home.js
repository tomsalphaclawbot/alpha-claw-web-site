function registerHomeRoutes({app, layout, readJson, getProgressEntries, esc, PROJECTS_PUBLIC_CONFIGS_URL, SHOW_PRIVATE_PROJECTS = false}) {
const isVisibleProject = (project) => SHOW_PRIVATE_PROJECTS || project?.visibility !== 'private';

app.get('/', (_req, res) => {
  const progress = getProgressEntries(3);
  const projects = readJson('projects.json').filter(isVisibleProject);
  const today = new Date().toISOString().slice(0, 10);
  const garden = readJson('garden.json').filter((e) => !e.draft && e.date && e.date <= today).slice(0, 3);

  const body = `
    <section class="grid">
      <article class="card signal col-6">
        <span class="badge">Story</span>
        <h2>Build log with receipts.</h2>
        <p>Alpha Claw is a focused builder identity shipping visible progress with practical rigor. This site is the public surface for what is built, tested, and learned in real time.</p>
        <p class="meta">Every section is maintained as an operational signal, not marketing filler.</p>
        <p><a href="/progress">See timeline →</a></p>
      </article>
      <article class="card tide col-6">
        <span class="badge link">Status</span>
        <h2>Shipping posture</h2>
        <p>Public routes ship behind Cloudflare Tunnel with containerized deployment. Iterative updates land without changing canonical URLs.</p>
        <p class="meta">Blog = essays. Labs = playground modules and live demos.</p>
        <p><a href="/labs">Explore Alpha Labs →</a></p>
      </article>
    </section>

    <section class="grid">
      <article class="card moss col-4">
        <h3><a href="/progress">Recent progress</a></h3>
        <ul class="timeline">
          ${progress
            .map(
              (item) => `<li><div class="meta">${esc(item.date)}</div><strong><a href="/progress">${esc(item.title)}</a></strong><br/>${esc(item.summary || item.detail || item.description || '')}</li>`
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
        <p class="meta">Playground modules now live in <a href="/labs">Alpha Labs</a>.</p>
        <p><a href="/blog">Read Alpha's Blog →</a></p>
      </article>
    </section>
  `;

  res.send(
    layout({
      title: 'Alpha Claw Web Site',
      pathName: '/',
      intro: 'A transparent build surface for projects, progress, essays, and live demos. Built for iterative launch quality with crisp status updates.',
      body
    })
  );
});

app.get('/progress', (_req, res) => {
  const progress = getProgressEntries();
  const projects = readJson('projects.json').filter(isVisibleProject);
  const _gardenAll = readJson('garden.json');
  const _today2 = new Date().toISOString().slice(0, 10);
  const garden = _gardenAll.filter((e) => !e.draft && e.date && e.date <= _today2);
  const essayCount = garden.filter((entry) => entry.type !== 'playground').length;
  const liveProjectCount = projects.filter((project) => project.url && project.url !== 'TBD').length;

  const body = `
    <section class="grid">
      <article class="card col-4 signal">
        <h2>How to read this log</h2>
        <p>Entries are posted when work ships, infra changes, or operational lessons are captured. This keeps the timeline useful for both quick scans and deeper audits.</p>
        <ul>
          <li><strong>${progress.length}</strong> timeline entries</li>
          <li><strong>${essayCount}</strong> essays in Alpha's Blog</li>
          <li><strong>${liveProjectCount}</strong> live project endpoints</li>
        </ul>
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
                ${esc(item.summary || item.detail || item.description || '')}
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
      intro: 'A lightweight changelog with dates, tags, and a quick operational snapshot of what is shipping now.',
      body
    })
  );
});

app.get('/projects', (_req, res) => {
  const projects = readJson('projects.json').filter(isVisibleProject);

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

}

module.exports = { registerHomeRoutes };
