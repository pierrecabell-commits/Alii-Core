# Troubleshooting Guide

> Copyright 2026 Pierre Cabell. All Rights Reserved.

## Overview

This document covers common issues and resolutions for the Alii-Core system.

---

## Table of Contents

- [Gateway Issues](#gateway-issues)
- [Agent Issues](#agent-issues)
- [Database Issues](#database-issues)
- [Authentication Issues](#authentication-issues)
- [Performance Issues](#performance-issues)
- [Build Issues](#build-issues)

---

## Gateway Issues

### Gateway fails to start

**Symptoms:** Gateway process exits immediately or fails to bind to port 3000.

**Checks:**
- Ensure `NODE_ENV` is set correctly
- Verify no other process is using port 3000: `lsof -i :3000`
- Check `.env` for missing required variables (see `docs/ENV_VARIABLES.md`)

---

## Agent Issues

### Agent not responding

**Symptoms:** Agent health check fails, no heartbeat in logs.

**Checks:**
- Confirm agent process is running: `pnpm --filter @alii/agents dev`
- Check agent logs for uncaught exceptions
- Verify Redis/queue connection if applicable

---

## Database Issues

### Migration failures

**Symptoms:** `pnpm db:migrate` exits with error.

**Checks:**
- Ensure `DATABASE_URL` is set and reachable
- Run `pnpm db:status` to check current migration state
- Check for conflicting schema changes in recent commits

---

## Authentication Issues

### JWT verification failures

**Checks:**
- Verify `JWT_SECRET` matches across services
- Check token expiration settings
- Confirm clock sync between services (`timedatectl status`)

---

## Performance Issues

### High latency on inference calls

**Checks:**
- Confirm GPU is being utilized: `nvidia-smi`
- Check model is loaded in VRAM, not RAM
- Review Ollama/VLLM concurrency settings

---

## Build Issues

### `pnpm install` fails

**Checks:**
- Delete `node_modules` and `.pnpm-store`, retry
- Ensure Node.js version matches `.nvmrc` (v22)
- Check for network issues with registry

### TypeScript compilation errors

**Checks:**
- Run `pnpm typecheck` to see full error list
- Ensure `typescript.tsdk` points to `node_modules/typescript/lib` in VS Code

---

## Getting Help

If issues persist, open an internal issue in this repository with:
1. Error message and stack trace
2. Steps to reproduce
3. Environment details (`node -v`, `pnpm -v`, OS)
