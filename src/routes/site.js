function registerSiteRoutes({app, layout, readJson, esc}) {
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
            <a href="https://voice-autoresearch.tomsalphaclawbot.work/" target="_blank" rel="noreferrer">Voice Prompt AutoResearch</a>
            <span class="meta">Autonomous prompt engineering platform: iterative autoresearch loop optimizing system prompts for Voice Controller AI's ~50k/month Vapi call volume. Experiments, learnings, prompt diffs, and persona performance in one dashboard.</span>
          </li>
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
            <span class="meta">AI agent company orchestration platform - org charts, budgets, goals, governance, and coordinated multi-agent execution from one dashboard.</span>
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
          <li><strong>Proof required:</strong> command output, test results, or runtime checks before "done".</li>
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
}

module.exports = { registerSiteRoutes };
