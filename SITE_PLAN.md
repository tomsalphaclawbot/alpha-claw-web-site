# Alpha Claw Web Site — Site Plan

## Objectives and Success Metrics
- Objective: Launch a public marketing site that clearly explains Alpha Claw, captures interest, and provides a reliable status surface.
- Objective: Provide a clean, branded landing experience beyond the current plain-text root.
- Objective: Maintain high uptime and fast load times from day one.
- Success Metric: >= 60% of visits reach at least one section beyond the hero within 30 days.
- Success Metric: < 1.5s LCP on mobile (P75) and < 200ms TTFB on origin.
- Success Metric: 99.9% uptime monthly for root and health endpoints.
- Success Metric: First meaningful inquiry or signup within 30 days of launch.

## Audiences and Journeys
- Audience: Prospective users
- Journey: Land on home page -> Understand value proposition in 10 seconds -> See features -> View FAQs -> Take action (contact / waitlist).
- Audience: Partners or vendors
- Journey: Land on home -> Read about company/product -> Find contact -> Send inquiry.
- Audience: Developers/maintainers
- Journey: Check status page -> Verify health endpoint -> View deployment info.

## Sitemap
- `/` Home
- `/about` About Alpha Claw
- `/features` Features and benefits
- `/pricing` Pricing or “Coming soon” placeholder
- `/faq` Frequently asked questions
- `/contact` Contact form or mailto
- `/status` Service status (can proxy to `/health` or show last checks)
- `/legal/privacy` Privacy policy
- `/legal/terms` Terms of service

## Scope

### MVP
- Static marketing pages: Home, About, Features, FAQ, Contact, Legal, Status.
- Simple contact form or mailto with anti-spam measures.
- Basic branding: logo, colors, typography, and a favicon.
- Analytics: pageview tracking and basic event tracking for CTA clicks.
- SEO: title/description tags, open graph, sitemap.xml, robots.txt.
- Performance: static assets optimized and cached.

### Phase 2
- Richer content: customer stories, detailed product screenshots, use-case pages.
- Newsletter or waitlist flow with email capture and double opt-in.
- Admin-friendly content updates (lightweight CMS or markdown-based system).
- Monitoring dashboard improvements on `/status` with historical uptime.

### Phase 3
- Full marketing funnel: gated content, A/B testing, lifecycle email journeys.
- Multi-language support.
- Self-serve product docs and onboarding hub.

## Technical Architecture Recommendations
- Continue Express server for routing, but add a static site renderer or template engine.
- Prefer server-side rendered templates for fast time-to-first-byte and SEO.
- Use a CDN for static assets with long cache headers and cache-busting.
- Add a lightweight form handler endpoint or integrate a serverless form backend.
- Keep `/health` fast and independent of external services.
- Observability: structured logs, uptime monitoring, and a synthetic check.

## Milestone Plan

### Milestone 1: Discovery and Content Definition
- Define value proposition and key messaging.
- Create a simple brand kit: logo, colors, typography.
- Draft content for each page in MVP.

### Milestone 2: Site Structure and Templates
- Implement base layout, navigation, and footer.
- Build templates for Home, About, Features, FAQ, Contact, Status, Legal pages.
- Add SEO tags and social preview metadata.

### Milestone 3: Integrations and Polish
- Add analytics tracking and CTA events.
- Add contact form handling or mailto workflow.
- Optimize performance: image compression, caching headers.

### Milestone 4: QA and Launch
- Accessibility pass and cross-device testing.
- Load test `/` and `/health` endpoints.
- Final content review and deployment.

## Risk and Mitigation
- Risk: Content delays block build.
- Mitigation: Use placeholder copy with clear review checkpoints.
- Risk: Form abuse or spam.
- Mitigation: Use honeypot fields, rate limiting, and CAPTCHA if needed.
- Risk: Performance regressions after adding media.
- Mitigation: Enforce image budgets and lazy loading.
- Risk: SEO issues due to missing metadata.
- Mitigation: Create a checklist and validate with Lighthouse.
- Risk: Uptime issues during launch.
- Mitigation: Pre-launch load tests and rollback plan.

## Launch Checklist
- Verify all pages render with correct content.
- Confirm analytics events fire for CTAs.
- Confirm contact method works end-to-end.
- Validate SEO metadata, sitemap.xml, and robots.txt.
- Run Lighthouse for performance and accessibility.
- Validate /health and /status.
- Enable CDN caching for assets.

## Post-Launch Checklist
- Monitor traffic, errors, and form submissions daily for 2 weeks.
- Review analytics funnel for drop-offs.
- Collect feedback from first visitors.
- Ship 1-2 iteration fixes based on data.
- Establish a monthly content update cadence.

## Prioritized Backlog

### P0
- Replace plain-text `/` with branded home page.
- Add site-wide navigation and footer.
- Add `/contact` and `/status` pages.
- Add metadata, sitemap.xml, robots.txt.
- Add analytics with CTA tracking.

### P1
- Add `/features`, `/faq`, and `/about` pages.
- Implement contact form handling with spam protection.
- Add performance optimizations for assets.
- Add basic brand kit assets and favicon.

### P2
- Add customer stories and use-case pages.
- Add CMS or markdown-driven content updates.
- Add email capture and waitlist flow.
- Add expanded `/status` with historical data.
