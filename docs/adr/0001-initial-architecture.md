# ADR 0001: Initial Architecture Decision — Monorepo with pnpm Workspaces

> Copyright 2026 Pierre Cabell. All Rights Reserved.

## Status

Accepted

## Date

2026-01-01

## Context

Alii-Core is a complex, multi-service AI platform comprising a Gateway API, Web UI, Agent runtime, CLI tooling, and shared packages. A structural decision was needed early on: should the system be organized as a monorepo or as separate repositories?

Key considerations:
- Multiple packages share common types, utilities, and configuration
- Development velocity is improved when changes to shared code don't require cross-repo PRs
- The team (and AI agents) need to reason about the full system simultaneously
- Deployment pipelines need to build and publish selective packages

## Decision

We adopt a **monorepo** structure managed by **pnpm workspaces**, with packages organized under `packages/`, applications under `apps/`, and UI code under `ui/`.

### Structure

```
Alii-Core/
  apps/          # Runnable applications (Gateway, CLI, etc.)
  packages/      # Shared libraries (types, db, utils, etc.)
  ui/            # Frontend applications (Web UI, etc.)
  .github/       # CI/CD workflows
  docs/          # Documentation (including this ADR)
```

### Tooling

- **pnpm** for package management (workspaces + fast installs)
- **Turborepo** (or pnpm `--filter`) for task orchestration and caching
- **TypeScript** project references for type-safe cross-package imports
- **ESLint + Prettier** enforced at the root level

## Consequences

### Positive
- Single source of truth for shared types and utilities
- Atomic commits spanning multiple packages
- Simplified local development (`pnpm install` at root installs everything)
- AI agents can navigate the full codebase in a single context

### Negative
- Larger repository size over time
- CI must selectively build/test only affected packages (mitigated by Turborepo caching)
- Requires discipline to avoid cross-package circular dependencies

## Alternatives Considered

| Alternative | Reason Rejected |
|-------------|----------------|
| Polyrepo (separate repos per service) | Too much overhead for cross-cutting changes; slows AI-assisted development |
| Nx monorepo | Additional complexity; pnpm workspaces sufficient for current scale |
| Lerna | Deprecated in favor of pnpm workspaces native support |
