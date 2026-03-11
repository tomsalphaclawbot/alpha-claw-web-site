const fs = require('node:fs');
const path = require('node:path');

function createContentStore(contentDir) {
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

  function getProgressEntries(limit) {
    const sorted = readJson('progress.json', [])
      .map((entry, idx) => ({ entry, idx }))
      .sort((a, b) => {
        const byDate = String(b.entry.date).localeCompare(String(a.entry.date));
        if (byDate !== 0) return byDate;
        return b.idx - a.idx; // same-day tie-breaker: newest appended first
      })
      .map(({ entry }) => entry);

    return typeof limit === 'number' ? sorted.slice(0, limit) : sorted;
  }

  return { readMd, readJson, getProgressEntries };
}

module.exports = { createContentStore };
