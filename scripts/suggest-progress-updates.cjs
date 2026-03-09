#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const siteDir = path.resolve(__dirname, '..');
const workspaceDir = path.resolve(siteDir, '..', '..');

const progressPath = path.join(siteDir, 'content', 'progress.json');
const donePath = path.join(workspaceDir, 'tasks', 'DONE.md');
const outPath = path.join(siteDir, 'content', 'progress.suggestions.json');

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function safeJson(file, fallback) {
  try {
    return JSON.parse(read(file));
  } catch {
    return fallback;
  }
}

function slugifyTitle(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function parseDoneTasks(md) {
  const blocks = md.split(/\n\n(?=- id: `task-)/g);
  const tasks = [];
  for (const b of blocks) {
    if (!b.includes('- id: `task-')) continue;
    const title = (b.match(/^- title: (.+)$/m) || [])[1];
    const completed = (b.match(/^- completed: (.+)$/m) || [])[1];
    if (!title || !completed) continue;
    tasks.push({ title: title.trim(), completed: completed.trim() });
  }
  return tasks;
}

function toIsoDate(completed) {
  const m = completed.match(/(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

function makeSummary(title) {
  return title
    .replace(/^Build\/deploy\s+/i, 'Shipped ')
    .replace(/^Publish\s+/i, 'Published ')
    .replace(/^Refresh\s+/i, 'Refreshed ')
    .replace(/^Deploy\s+/i, 'Deployed ');
}

const progress = safeJson(progressPath, []);
const doneMd = read(donePath);
const doneTasks = parseDoneTasks(doneMd);

const existingKeys = new Set(progress.map((p) => `${p.date}|${slugifyTitle(p.title)}`));

const suggestions = [];
for (const t of doneTasks.slice(0, 40)) {
  const date = toIsoDate(t.completed);
  if (!date) continue;
  const key = `${date}|${slugifyTitle(t.title)}`;
  if (existingKeys.has(key)) continue;
  suggestions.push({
    date,
    title: t.title,
    summary: makeSummary(t.title),
    tags: ['ops']
  });
}

fs.writeFileSync(outPath, JSON.stringify(suggestions.slice(0, 20), null, 2) + '\n');
console.log(`Wrote ${Math.min(suggestions.length, 20)} suggestions -> ${path.relative(siteDir, outPath)}`);
if (suggestions.length) {
  console.log('Top suggestion:', suggestions[0].date, '-', suggestions[0].title);
}
