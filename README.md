# Alii-Core

> The multi-channel AI gateway at the heart of the Alii system.

Alii-Core is the TypeScript engine that connects Alii's autonomous agents to the outside world. It handles all inbound and outbound communication across every major messaging platform, routing and responding through a unified protocol layer with a fully extensible plugin and agent SDK.

---

## What It Does

Alii-Core acts as the nervous system between the Alii brain and the real world. Any message sent to Alii, whether through Discord, Telegram, Slack, iMessage, Signal, WhatsApp, or the web, flows through this gateway. It normalizes the input, routes it to the right agent or model, and delivers the response back through the correct channel.

---

## Architecture

```
Inbound                   Gateway Core             Output
------                    ------------             ------
Discord   ---+            +------------+    +---- Agent Router
Telegram  ---+            | Protocol   |    |     Model Layer
Slack     ---+----------->| Layer      |----+     Memory Bridge
iMessage  ---+            | + Routing  |    |     Plugin Runtime
Signal    ---+            +------------+    +---- Hook System
WhatsApp  ---+                  |
Web       ---                   v
                       Plugin / Agent SDK
                       (extensible by design)
```

---

## Key Modules

| Module | Description |
|---|---|
| `src/gateway/` | Core protocol server and routing logic |
| `src/agents/` | Built-in agent definitions and tool bindings |
| `src/plugin-sdk/` | SDK for building and registering custom agents |
| `src/plugins/` | Plugin runtime, registry, discovery, and loader |
| `src/hooks/` | Pre/post message hook system |
| `src/providers/` | LLM provider abstractions |
| `src/memory/` | Session and persistent memory layer |
| `src/routing/` | Channel-aware message routing |
| `src/security/` | Auth, TLS, and access control |
| `src/tui/` | Terminal UI for live monitoring |
| `src/agents/tools/ops-tools.ts` | Alii-native ops and cluster tools |

---

## Supported Channels

- **Discord** - bot + slash commands
- **Telegram** - bot API
- **Slack** - Events API + slash commands
- **iMessage** - macOS bridge
- **Signal** - signal-cli bridge
- **WhatsApp** - web protocol
- **Web** - HTTP inbound/auto-reply
- **Terminal** - direct TUI interface

---

## Getting Started

```bash
# Install dependencies
yarn install

# Configure your channels
cp .env.example .env

# Run the gateway
yarn dev
```

---

## Plugin and Agent SDK

Alii-Core ships with a full plugin SDK for building custom agents that plug directly into the gateway. See `src/plugin-sdk/` for interface definitions and `src/plugins/` for the runtime that loads and manages them.

Agents built with the SDK get automatic access to:
- All connected channels (read and write)
- The memory layer
- The hook system (pre/post message intercept)
- The provider abstraction (swap LLMs without rewriting agents)

---

## Part of the Alii System

| Repo | Role |
|---|---|
| **Alii-Core** *(this repo)* | TypeScript gateway + agent SDK |
| **Alii-God** | Python autonomous agent brain + cluster |
| **Alii-Public** | Public agent store *(coming soon)* |

---

*Built by Pierre Cabell. Alii is a self-evolving autonomous AI system.*
