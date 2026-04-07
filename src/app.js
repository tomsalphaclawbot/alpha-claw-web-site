const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const { marked } = require('marked');

const { createContentStore } = require('./lib/content');
const { esc, createLayout } = require('./lib/html');
const { checkProjectUrl } = require('./lib/health');

const { registerHomeRoutes } = require('./routes/home');
const { registerLabsRoutes } = require('./routes/labs');
const { registerBlogRoutes } = require('./routes/blog');
const { registerSiteRoutes } = require('./routes/site');
const { registerApiRoutes } = require('./routes/api');

function createApp({ rootDir = path.join(__dirname, '..') } = {}) {
  const app = express();

  const ASSET_VERSION = '20260319a';
  const PROJECTS_PUBLIC_CONFIGS_URL = 'https://configs.tomsalphaclawbot.work';
  const PROJECT_HEALTH_TIMEOUT_MS = Number(process.env.PROJECT_HEALTH_TIMEOUT_MS || 12000);
  const HEARTBEAT_JSONL = process.env.HEARTBEAT_JSONL || '';
  const SHOW_PRIVATE_PROJECTS = String(process.env.SHOW_PRIVATE_PROJECTS || '').toLowerCase() === 'true';

  const contentDir = path.join(rootDir, 'content');
  const publicDir = path.join(rootDir, 'public');

  const { readMd, readJson, getProgressEntries } = createContentStore(contentDir);
  const layout = createLayout({
    assetVersion: ASSET_VERSION,
    projectsPublicConfigsUrl: PROJECTS_PUBLIC_CONFIGS_URL
  });

  app.use('/public', express.static(publicDir, { maxAge: '7d' }));

  const deps = {
    app,
    fs,
    marked,
    esc,
    layout,
    readMd,
    readJson,
    getProgressEntries,
    checkProjectUrl,
    PROJECTS_PUBLIC_CONFIGS_URL,
    PROJECT_HEALTH_TIMEOUT_MS,
    HEARTBEAT_JSONL,
    SHOW_PRIVATE_PROJECTS
  };

  registerHomeRoutes(deps);
  registerLabsRoutes(deps);
  registerBlogRoutes(deps);
  registerSiteRoutes(deps);
  registerApiRoutes(deps);

  return app;
}

module.exports = { createApp };
