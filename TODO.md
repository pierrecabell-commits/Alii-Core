# Alii-Core -- Task List

> Meticulous list of tasks required to make Alii-Core production-ready and amazing.

---

## CRITICAL -- Must Fix Immediately

### 1. License Update
- [x] Replace MIT license with All Rights Reserved (Pierre Cabell)
- [x] Update `package.json` license field from `"MIT"` to `"SEE LICENSE IN LICENSE"`
- [x] Remove any MIT license references in documentation or headers

### 2. File Size Refactoring (In Progress)
These files exceed the 700 LOC guideline and need splitting:

**Phase 1 (Pending):**
- [ ] `src/infra/session-cost-usage.ts` (984 LOC -> target 700)
- [ ] `src/media-understanding/runner.ts` (1,232 LOC -> target 700)

**Phase 2a (Pending):**
- [ ] `heartbeat-runner.ts` (956 -> 560)
- [ ] `message-action-runner.ts` (1,082 -> 620)

**Phase 2b (Pending):**
- [ ] `tts/tts.ts` (1,445 -> 950)
- [ ] `exec-approvals.ts` (1,437 -> 700)
- [ ] `update-cli.ts` (1,245 -> 1,000)

**Phase 3+ (Major refactoring):**
- [ ] `memory/manager.ts` (2,280 LOC)
- [ ] `bash-tools.exec.ts` (1,546 LOC)
- [ ] `ui/views/usage.ts` (3,076 LOC)
- [ ] `bluebubbles/monitor.ts` (2,348 LOC)

### 3. Channel Stability (Active Priority)
- [ ] Fix edge cases in WhatsApp channel connection handling
- [ ] Fix edge cases in Telegram channel connection handling
- [ ] Improve reconnection logic for all channel adapters
- [ ] Add connection state recovery after network interruptions

### 4. Security Hardening
- [ ] Verify all dependency overrides in `pnpm.overrides` are current
- [ ] Update Node.js version requirements for latest CVE patches
- [ ] Review and update `.secrets.baseline` for secret detection
- [ ] Audit all HTTP endpoints for authentication requirements
- [ ] Verify web UI is never exposed publicly (local-only binding)

---

## HIGH PRIORITY -- Before Production Use

### 5. Onboarding Experience
- [ ] Improve onboarding wizard error messages
- [ ] Add validation for common configuration mistakes
- [ ] Better guidance for channel-specific setup (API keys, webhooks, etc.)
- [ ] Add setup health checks that validate connectivity before completing onboarding
- [ ] Create quickstart guides for each channel

### 6. Performance Optimization
- [ ] Optimize token usage across LLM calls
- [ ] Improve memory compaction logic for long conversations
- [ ] Profile and optimize gateway routing performance
- [ ] Reduce cold start time for the gateway server
- [ ] Optimize plugin loading (lazy load unused plugins)

### 7. Extension Testing Coverage
- [ ] Add unit tests for all extensions missing tests:
  - [ ] `extensions/discord/`
  - [ ] `extensions/signal/`
  - [ ] `extensions/imessage/`
  - [ ] `extensions/phone-control/`
  - [ ] `extensions/device-pair/`
  - [ ] `extensions/voice-call/`
  - [ ] `extensions/line/`
- [ ] Add integration tests for channel connection lifecycle
- [ ] Add tests for plugin registration and discovery
- [ ] Ensure all extensions have consistent error handling

### 8. Documentation Gaps
- [ ] Complete API reference documentation in Mintlify docs
- [ ] Add troubleshooting guide for common channel issues
- [ ] Document all environment variables and their defaults
- [ ] Create extension development tutorial (step-by-step)
- [ ] Add architecture decision records (ADRs)
- [ ] Update CHANGELOG.md to reflect latest changes

### 9. Mobile App Completion
- [ ] Complete iOS companion app
  - [ ] Finish Xcode project build configuration
  - [ ] Implement push notification integration
  - [ ] Add app-to-gateway secure communication
- [ ] Complete Android companion app
  - [ ] Finalize Gradle build configuration
  - [ ] Implement background service for persistent connection
  - [ ] Add material design UI components
- [ ] Create shared mobile SDK for common functionality

---

## MEDIUM PRIORITY -- Quality and Reliability

### 10. Plugin SDK Improvements
- [ ] Add more comprehensive TypeScript type exports
- [ ] Create plugin development template/scaffold
- [ ] Add plugin hot-reload during development
- [ ] Implement plugin versioning and compatibility checks
- [ ] Add plugin dependency resolution

### 11. Gateway Reliability
- [ ] Add rate limiting per channel per user
- [ ] Implement request queuing for bursty traffic
- [ ] Add graceful degradation when LLM providers are down
- [ ] Implement health check aggregation across all channels
- [ ] Add connection pool management for external services

### 12. Observability
- [ ] Expand OpenTelemetry integration beyond diagnostics extension
- [ ] Add distributed tracing for message flow (inbound -> routing -> agent -> response)
- [ ] Create operational dashboards for channel health
- [ ] Add alerting for channel disconnections
- [ ] Track and report message delivery success rates

### 13. Memory System
- [ ] Optimize session memory retrieval performance
- [ ] Add memory export/import functionality
- [ ] Implement memory pruning policies (TTL, size limits)
- [ ] Add cross-channel memory sharing (same user across Discord + Telegram)
- [ ] Improve vector search accuracy in memory-lancedb extension

### 14. Build and Development
- [ ] Optimize `pnpm build` time (currently includes UI build)
- [ ] Add incremental TypeScript compilation
- [ ] Improve `pnpm dev` hot-reload speed
- [ ] Reduce Docker image size (multi-stage build optimization)
- [ ] Add development container (devcontainer) config

---

## LOW PRIORITY -- Polish

### 15. TUI Improvements
- [ ] Add real-time message flow visualization
- [ ] Show per-channel connection status
- [ ] Add command palette for common operations
- [ ] Improve log viewing with filtering and search

### 16. Web UI Enhancements
- [ ] Add dark mode support
- [ ] Improve mobile responsiveness
- [ ] Add real-time metrics dashboard
- [ ] Channel configuration UI (vs. CLI-only)
- [ ] Visual message flow debugger

### 17. Internationalization
- [ ] Verify all zh-CN translations are complete and accurate
- [ ] Add more language translations for documentation
- [ ] Ensure all user-facing strings are i18n-ready
- [ ] Add locale-aware date/time formatting

### 18. Code Quality
- [ ] Enable stricter TypeScript compiler options where possible
- [ ] Reduce `any` type usage across the codebase
- [ ] Add ESLint rules for common anti-patterns
- [ ] Standardize error types across all modules
- [ ] Add code complexity metrics to CI

### 19. Deployment
- [ ] Create Helm chart for Kubernetes deployment
- [ ] Add Terraform module for cloud provisioning
- [ ] Create one-click deployment for DigitalOcean/Railway/Render
- [ ] Improve Fly.io deployment configuration
- [ ] Add automated rollback on failed deployments

---

*Last updated: 2026-03-07*
