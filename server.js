const express = require('express');

const app = express();
const port = process.env.PORT || 8080;

app.get('/', (_req, res) => {
  res.type('text/plain').send('Hello from Alpha via Docker + Cloudflare Tunnel!');
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
