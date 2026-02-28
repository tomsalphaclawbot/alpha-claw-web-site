const express = require('express');
const fs = require('node:fs');
const path = require('node:path');

const app = express();
const port = process.env.PORT || 8080;

const contentDir = path.join(__dirname, 'content');
const publicDir = path.join(__dirname, 'public');

const PROJECTS_PUBLIC_CONFIGS_URL = 'https://configs.tomsalphaclawbot.work';

app.use('/public', express.static(publicDir, { maxAge: '7d' }));

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
  <link rel="stylesheet" href="/public/styles.css" />
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
  const playground = readJson('playground.json').slice(0, 2);

  const body = `
    <section class="grid">
      <article class="card signal col-6">
        <span class="badge">Story</span>
        <h2>Living lab, not brochureware.</h2>
        <p>Alpha Claw is a focused builder brand shipping visible progress with practical rigor. This site is the public surface for what is built, tested, and learned in real time.</p>
        <p><a href="/progress">See timeline →</a></p>
      </article>
      <article class="card tide col-6">
        <span class="badge link">Status</span>
        <h2>Launch posture</h2>
        <p>Public routes are live behind Cloudflare Tunnel and backed by containerized deployment. Iterative updates land without changing canonical URLs.</p>
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
        <h3>Playground slots</h3>
        <ul>
          ${playground.map((slot) => `<li><strong>${esc(slot.slot)}</strong><br/>${esc(slot.description)}</li>`).join('')}
        </ul>
        <p><a href="/playground">Explore experiments →</a></p>
      </article>
    </section>
  `;

  res.send(
    layout({
      title: 'Alpha Claw Web Site v0.1',
      pathName: '/',
      intro: 'A transparent build surface for projects, progress, and experiments. Built for iterative launch quality.',
      body
    })
  );
});

app.get('/progress', (_req, res) => {
  const progress = readJson('progress.json').sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const body = `
    <section class="grid">
      <article class="card col-12 tide">
        <h2>Timeline / Changelog</h2>
        <p class="meta">Data source: content/progress.json</p>
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
      intro: 'A lightweight changelog showing visible delivery milestones and operational movement.',
      body
    })
  );
});

app.get('/projects', (_req, res) => {
  const projects = readJson('projects.json');

  const body = `
    <section class="grid">
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
      intro: 'Public projects and transparent links. Placeholder records are structured to make URL updates simple.',
      body
    })
  );
});

app.get('/playground', (_req, res) => {
  const slots = readJson('playground.json');

  const body = `
    <section class="grid">
      ${slots
        .map((slot) => {
          const badgeClass = slot.type === 'evergreen' ? 'link' : slot.type === 'archive' ? 'archive' : '';
          return `<article class="card col-4 moss">
            <span class="badge ${badgeClass}">${esc(slot.type)}</span>
            <h3>${esc(slot.slot)}</h3>
            <p>${esc(slot.description)}</p>
            <p class="meta">Status: ${esc(slot.status)} · Refresh: ${esc(slot.refresh)}</p>
          </article>`;
        })
        .join('')}
    </section>
  `;

  res.send(
    layout({
      title: 'Playground',
      pathName: '/playground',
      intro: 'Experimental and evergreen slots where ideas are tested, hardened, archived, or promoted.',
      body
    })
  );
});

app.get('/about', (_req, res) => {
  const body = `
    <section class="grid">
      <article class="card col-6 tide">
        <h2>What Alpha Claw is</h2>
        <p>Alpha Claw is an inventive builder identity focused on practical systems, transparent progress, and public experimentation with guardrails.</p>
      </article>
      <article class="card col-6 signal">
        <h2>Operating principles</h2>
        <ul>
          <li>Evidence over hype</li>
          <li>Visible milestones with dates</li>
          <li>Safe public snapshots of non-sensitive configs/docs</li>
          <li>Iterative launch quality over perfection paralysis</li>
        </ul>
      </article>
      <article class="card col-12 moss">
        <h2>Current phase</h2>
        <p>v0.1 establishes the branded core surface and content lanes: progress, projects, and playground. Future phases expand analytics, richer content, and public changelog depth.</p>
      </article>
    </section>
  `;

  res.send(
    layout({
      title: 'About',
      pathName: '/about',
      intro: 'A focused, creative, and transparent build operation with an engineering-first public footprint.',
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
