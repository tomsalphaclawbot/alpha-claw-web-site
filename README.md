# Hello World Web App (Node.js + Express)

Minimal Dockerized Express app with:
- `GET /` plain-text hello message
- `GET /health` JSON health check

## Requirements
- Docker Desktop running

## Run

```bash
docker compose up -d --build
```

App will be available at:
- http://localhost:8787/
- http://localhost:8787/health

Public URL (via Cloudflare Tunnel):
- https://hello.tomsalphaclawbot.work/

## Test

```bash
curl -sS localhost:8787/
curl -sS localhost:8787/health
```

## Stop

```bash
docker compose down
```
