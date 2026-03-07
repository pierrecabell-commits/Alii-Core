<p align="center">
  <strong>A L I I - C O R E</strong>
</p>

<p align="center">
  <em>One agent. Every channel. Infinite reach.</em>
</p>

<p align="center">
  Built by <strong>Pierre Cabell</strong> &mdash; All Rights Reserved
</p>

---

Alii-Core is the **nervous system** of the Alii ecosystem — a high-performance TypeScript gateway that connects autonomous AI agents to the real world through **34+ messaging channels**, a full plugin SDK, and a battle-tested runtime built for production.

Discord. Telegram. Slack. WhatsApp. iMessage. Signal. LINE. Matrix. Nostr. Twitch. MS Teams. Google Chat. And more. One gateway. One config. One agent that shows up everywhere.

While [Alii-God](https://github.com/pierrecabell-commits/Alii-God) is the brain that thinks, Alii-Core is the voice that speaks.

---

## The Problem It Solves

Building an AI agent is the easy part. Getting that agent into Discord, Telegram, WhatsApp, iMessage, Signal, Slack, and 28 other platforms — **simultaneously, reliably, with memory, tools, and security** — is where most people give up.

Alii-Core makes that problem disappear.

Every inbound message, from any channel, normalizes into a single protocol. Routes to the right agent or model. Executes tools. Queries memory. Streams the response. Delivers it back through the correct channel. All of it handled. All of it extensible. All of it fast.

---

## Architecture

```
  Discord ─────┐
  Telegram ────┤
  Slack ───────┤      ┌──────────────────────────┐       ┌─────────────────┐
  WhatsApp ────┤      │                          │       │  Agent Router   │
  iMessage ────┼─────▶│    Gateway Control Plane  │──────▶│  Model Layer    │
  Signal ──────┤      │    Protocol + Routing     │       │  Memory Bridge  │
  LINE ────────┤      │    Hooks + Sessions       │       │  Plugin Runtime │
  Matrix ──────┤      │                          │       │  Tool Execution │
  Nostr ───────┤      └──────────────────────────┘       └─────────────────┘
  Web ─────────┤                   │
  Terminal ────┘                   ▼
                          Plugin / Agent SDK
                       (extensible by design)
```

---

## What Makes It Different

### 34+ Channels, One Gateway

Not 34 bots. Not 34 codebases. **One gateway** that speaks every protocol:

- **Discord** — Bot + slash commands + thread support
- **Telegram** — Bot API with inline buttons
- **Slack** — Events API + slash commands + threading
- **WhatsApp** — Web protocol via Baileys
- **iMessage** — Native macOS bridge
- **Signal** — signal-cli bridge
- **LINE** — Flex Messages support
- **Matrix** — Community plugin
- **MS Teams** — Enterprise integration
- **Google Chat** — Workspace integration
- **Nostr** — Decentralized protocol
- **Twitch** — Live chat integration
- **BlueBubbles** — Alternative iMessage bridge
- **Mattermost, Zalo, Feishu, NextCloud Talk** — And more
- **Web** — HTTP + WebSocket
- **Terminal** — Direct TUI interface

Add a channel by dropping in an extension. Remove one by deleting a folder. That simple.

### Memory That Actually Matters

Not just chat history. **Hybrid semantic search** combining BM25 keyword matching with vector embeddings:

- **Multiple embedding providers** — OpenAI, Google Gemini, Voyage, local via node-llama-cpp
- **Batch processing** — Optimized embedding via Gemini Batch API and OpenAI Batch API
- **SQLite-Vec** — Local vector database with semantic search
- **Session transcripts** — Automatic file syncing with change detection
- **Configurable chunking** — Markdown-aware with configurable overlap

Your agent doesn't just respond. It **remembers context, retrieves concepts, and builds understanding over time**.

### 54 Built-In Skills

Out of the box, Alii-Core ships with tools for:

Apple Notes, Reminders, Bear Notes, 1Password, Obsidian, Notion, GitHub, Discord, Slack, Telegram, Browser Automation, Bloomberg Terminal, Spotify, Weather, Video Frames, PDF Tools, Image Generation, Local Places, Health Checks, Session Logs, Model Usage Tracking, and more.

Every skill is a tool the agent can invoke autonomously. No manual wiring required.

### Agent Superpowers

Agents running on Alii-Core aren't limited to text responses:

- **Bash execution** — Full shell access with PTY support, background processes, and approval gating
- **Browser automation** — Headless Chrome via CDP. Navigate, click, fill forms, extract data, execute JavaScript
- **Canvas / A2UI** — Visual interaction layer for structured, rich UX
- **Sub-agents** — Sessions can spawn child agents with cross-agent messaging
- **Sandbox execution** — Docker-based sandboxes with per-agent resource limits and workspace isolation

### Plugin SDK — Build Anything

The full plugin SDK gives you:

- **Channel adapters** — Register new messaging platforms
- **Agent tools** — JSON-schema functions with Zod validation
- **Hooks** — Pre/post message intercept for middleware patterns
- **HTTP routes** — Plugins can register their own REST endpoints
- **Memory access** — Read and write to the shared memory layer
- **Provider abstraction** — Swap LLMs without rewriting a single line of agent code

Define a plugin manifest (`openclaw.plugin.json`), implement the interfaces, and you're live.

---

## Terminal UI

A real-time operational dashboard in your terminal. Not just logs.

- **Live chat stream** — Watch messages flow in real-time with syntax highlighting
- **Session switcher** — Browse and switch between active sessions
- **Slash commands** — `/clear`, `/switch`, `/set`, `/help` for runtime control
- **Approval dialogs** — Approve or deny sensitive tool executions inline
- **Local shell** — Drop into bash without leaving the TUI
- **Theme support** — Dark and light modes

---

## Multi-Platform Companion Apps

Alii-Core doesn't stop at the server:

- **macOS** — Menu bar app for Voice Wake, Talk Mode, Canvas
- **iOS** — Native app via XcodeGen with WebSocket client
- **Android** — Gradle-based APK with JNI bridges
- **Web** — Browser-based chat + control panel + configuration UI

---

## Key Modules

| Module | What It Does |
|---|---|
| `src/gateway/` | Core protocol server, routing, sessions, streaming, hooks |
| `src/agents/` | Built-in agent definitions, tool bindings, bash/browser/canvas |
| `src/plugin-sdk/` | Full SDK for building and registering custom agents and tools |
| `src/plugins/` | Plugin runtime, registry, discovery, and loader |
| `src/hooks/` | Event-driven pre/post message hook system |
| `src/providers/` | LLM provider abstractions (swap models without code changes) |
| `src/memory/` | Hybrid search, embeddings, session persistence |
| `src/routing/` | Channel-aware message routing and delivery |
| `src/security/` | Auth, TLS, device pairing, access control |
| `src/tui/` | Terminal UI for live monitoring and control |
| `src/channels/` | Channel adapter implementations |
| `src/cron/` | Scheduled jobs, delivery logs, session reaping |
| `extensions/` | 34+ channel and feature extensions |
| `skills/` | 54+ built-in agent skills |
| `apps/` | macOS, iOS, Android companion apps |

---

## Security Model

- **Device pairing** — Approval workflows for new device connections
- **Allowlist/blocklist** — Per-channel with hierarchical merging
- **DM policy** — Control who can message the agent directly
- **Tool approval gates** — Sensitive operations require human approval
- **Command gating** — Per-channel command restrictions
- **TLS + origin checking** — Built-in transport security
- **Rate limiting** — Per-channel, per-user throttling

---

## Scale

- **1,675** production TypeScript files
- **34** channel extensions
- **54** built-in skills
- **100+** gateway components
- **Comprehensive test suite** — Unit, E2E, live integration, and Docker-based tests

---

## Getting Started

```bash
git clone https://github.com/pierrecabell-commits/Alii-Core.git
cd Alii-Core

pnpm install

cp .env.example .env
# Add your API keys and channel configs

pnpm dev
```

Node 22+ required. An API key (Anthropic recommended). 5 minutes.

---

## Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js 22+ (ESM) |
| **Language** | TypeScript (strict mode) |
| **Package Manager** | pnpm (monorepo workspace) |
| **Build** | tsdown |
| **Testing** | Vitest (unit + E2E + live) |
| **Linting** | Oxlint + Oxfmt |
| **Deployment** | Docker, Fly.io, Render, self-hosted |
| **Documentation** | Mintlify (with i18n) |

---

## Part of the Alii System

| Repo | Role |
|---|---|
| **[Alii-Core](https://github.com/pierrecabell-commits/Alii-Core)** *(this repo)* | The nervous system. Gateway, 34+ channels, plugin SDK, companion apps |
| **[Alii-God](https://github.com/pierrecabell-commits/Alii-God)** | The brain. Python agents, memory, cluster, autonomy |

---

## License

Copyright (c) 2026 Pierre Cabell. All Rights Reserved.

See [LICENSE](LICENSE) for details.

---

<p align="center">
  <em>One agent. Every channel. No limits.<br/>Alii-Core is how autonomous AI reaches the real world.</em>
</p>
