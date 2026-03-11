function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function createLayout({ assetVersion, projectsPublicConfigsUrl }) {
  return function layout({ title, pathName, intro, body }) {
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
  <meta name="description" content="Alpha Claw - transparent progress, public projects, and live experiments." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="icon" type="image/png" sizes="32x32" href="/public/images/favicon-32.png?v=${assetVersion}" />
  <link rel="icon" type="image/png" sizes="16x16" href="/public/images/favicon-16.png?v=${assetVersion}" />
  <link rel="apple-touch-icon" sizes="180x180" href="/public/images/apple-touch-icon.png?v=${assetVersion}" />
  <link rel="stylesheet" href="/public/styles.css?v=${assetVersion}" />
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
      <div class="meta">Last rendered: ${now} · PROJECTS_PUBLIC_CONFIGS_URL=${projectsPublicConfigsUrl}</div>
    </div>
  </footer>
</body>
</html>`;
  };
}

module.exports = { esc, createLayout };
