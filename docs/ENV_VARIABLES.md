# Environment Variables Reference

> Copyright 2026 Pierre Cabell. All Rights Reserved.

## Overview

This document describes all environment variables used across Alii-Core services. Copy `.env.example` to `.env` and populate all required values before running the system.

---

## Required Variables

### Core

| Variable | Description | Example |
|----------|-------------|--------|
| `NODE_ENV` | Runtime environment | `development` / `production` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/alii` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Secret for signing JWTs (min 32 chars) | `your-super-secret-key` |

### AI / Inference

| Variable | Description | Example |
|----------|-------------|--------|
| `OLLAMA_BASE_URL` | Ollama API base URL | `http://localhost:11434` |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key | `sk-ant-...` |
| `OPENAI_API_KEY` | OpenAI API key (optional fallback) | `sk-...` |
| `DEFAULT_MODEL` | Default inference model | `claude-3-5-sonnet-20241022` |

### Gateway

| Variable | Description | Example |
|----------|-------------|--------|
| `GATEWAY_PORT` | Port for Gateway server | `3000` |
| `GATEWAY_HOST` | Host to bind Gateway | `0.0.0.0` |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:5173` |

### Web UI

| Variable | Description | Example |
|----------|-------------|--------|
| `VITE_API_URL` | Gateway API base URL for the UI | `http://localhost:3000` |
| `VITE_WS_URL` | WebSocket URL for the UI | `ws://localhost:3000` |

### Agents

| Variable | Description | Example |
|----------|-------------|--------|
| `AGENT_CONCURRENCY` | Max concurrent agent tasks | `4` |
| `AGENT_TIMEOUT_MS` | Agent task timeout in ms | `30000` |

---

## Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | Logging verbosity | `info` |
| `SENTRY_DSN` | Sentry error tracking DSN | _(unset)_ |
| `TELEMETRY_ENABLED` | Enable OpenTelemetry tracing | `false` |

---

## Notes

- Never commit `.env` to version control — it is listed in `.gitignore`.
- Use `.env.example` as the canonical reference for all required keys.
- For production deployments, use a secrets manager (e.g., Vault, AWS Secrets Manager) rather than `.env` files.
