import { Type } from "@sinclair/typebox";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import type { OpenClawConfig } from "../../config/config.js";
import type { AnyAgentTool } from "./common.js";
import { jsonResult, readNumberParam, readStringArrayParam, readStringParam } from "./common.js";

const execAsync = promisify(exec);

const DEFAULT_PROCESS_LIMIT = 10;
const MAX_PROCESS_LIMIT = 100;

const SystemStatsSchema = Type.Object({
  // Reserved for future filters; no required params for now.
});

const SystemProcessesSchema = Type.Object({
  limit: Type.Optional(
    Type.Number({
      description: "Maximum number of processes to return (1-100).",
      minimum: 1,
      maximum: MAX_PROCESS_LIMIT,
    }),
  ),
});

const SystemNetworkInfoSchema = Type.Object({
  // No parameters; always returns basic host + interface info.
});

const SecurityOpenPortsSchema = Type.Object({
  // No parameters; returns listening TCP/UDP ports and owning PIDs (where available).
});

const SecuritySuspiciousProcessesSchema = Type.Object({
  patterns: Type.Optional(
    Type.Array(Type.String(), {
      description:
        "Override default suspicious name patterns (defaults: ['nc','ncat','telnet','tftp']).",
    }),
  ),
});

const SecurityFixSensitivePermsSchema = Type.Object({
  paths: Type.Optional(
    Type.Array(Type.String(), {
      description:
        "Relative or absolute file paths to check and harden (chmod 600 for overly-permissive files). Defaults to ['config.json','.credentials_vault.enc'] in the current working directory.",
    }),
  ),
});

const DockerPruneSchema = Type.Object({
  dryRun: Type.Optional(
    Type.Boolean({
      description:
        "If true, only reports what would be pruned (via docker system df) without deleting anything.",
    }),
  ),
});

const EnsureServiceSchema = Type.Object({
  name: Type.String({
    description: "Systemd service name to ensure running (e.g. 'mosquitto').",
  }),
  restart: Type.Optional(
    Type.Boolean({
      description:
        "If true, attempts `systemctl restart <name>` when the service is not active. When false, only reports status.",
    }),
  ),
});

const CodebaseScanSchema = Type.Object({
  rootDir: Type.String({
    description:
      "Absolute or relative root directory to scan for duplicates and backup/old files (e.g. '/home/avalii/alii').",
  }),
  includeExtensions: Type.Optional(
    Type.Array(Type.String(), {
      description:
        "File extensions to include (e.g. ['.py','.sh','.json','.txt']). Defaults to ['.py','.sh','.json','.txt'].",
    }),
  ),
});

const CodebaseArchiveBackupsSchema = Type.Object({
  rootDir: Type.String({
    description:
      "Root directory to search for backup/old files (e.g. '/home/avalii/Alii').",
  }),
  archiveDir: Type.String({
    description:
      "Directory where archived files will be moved (must be writable). A timestamp will be prefixed to filenames.",
  }),
  olderThanDays: Type.Optional(
    Type.Number({
      description:
        "Only archive backup/old files last modified strictly more than this many days ago. Defaults to 7.",
      minimum: 1,
    }),
  ),
});

const CodebaseNormalizePythonSchema = Type.Object({
  rootDir: Type.String({
    description:
      "Root directory to search for .py files to normalize (whitespace/blank lines).",
  }),
  checkSyntax: Type.Optional(
    Type.Boolean({
      description:
        "If true (default), uses `python3 -m py_compile` to guard against corrupting files. When false, skips syntax checks.",
    }),
  ),
  dryRun: Type.Optional(
    Type.Boolean({
      description:
        "If true, reports which files would be changed but does not modify anything.",
    }),
  ),
});

const ClusterAutoscaleSuggestSchema = Type.Object({
  deploymentName: Type.Optional(
    Type.String({
      description:
        "Kubernetes deployment name for Alii Gateway pods (default: 'alii-AliiServe'). Used only in messages; suggestion does not mutate cluster.",
    }),
  ),
  minReplicas: Type.Optional(
    Type.Number({
      description: "Minimum replicas (default 10).",
      minimum: 1,
    }),
  ),
  maxReplicas: Type.Optional(
    Type.Number({
      description: "Maximum replicas (default 50).",
      minimum: 1,
    }),
  ),
});

const ClusterAutoscaleApplySchema = Type.Object({
  deploymentName: Type.String({
    description:
      "Kubernetes deployment name to scale (e.g. 'alii-AliiServe').",
  }),
  replicas: Type.Number({
    description: "Desired replica count.",
    minimum: 1,
  }),
  namespace: Type.Optional(
    Type.String({
      description: "Kubernetes namespace. If omitted, uses kubectl default.",
    }),
  ),
});

export function createOpsTools(_options?: {
  config?: OpenClawConfig;
}): AnyAgentTool[] {
  const tools: AnyAgentTool[] = [];

  tools.push(createSystemStatsTool());
  tools.push(createSystemProcessesTool());
  tools.push(createSystemNetworkInfoTool());
  tools.push(createSecurityOpenPortsTool());
  tools.push(createSecuritySuspiciousProcessesTool());
  tools.push(createSecurityFixSensitivePermsTool());
  tools.push(createCodebaseScanTool());
  tools.push(createCodebaseArchiveBackupsTool());
  tools.push(createCodebaseNormalizePythonTool());
  tools.push(createClusterAutoscaleSuggestTool());
  tools.push(createClusterAutoscaleApplyTool());
  tools.push(createDockerPruneTool());
  tools.push(createEnsureServiceTool());

  return tools;
}

function createSystemStatsTool(): AnyAgentTool {
  return {
    label: "System Stats",
    name: "system_stats",
    description: "Returns a snapshot of CPU, memory, and disk usage on the host running the Gateway.",
    parameters: SystemStatsSchema,
    execute: async () => {
      const load = os.loadavg();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const memPercent = totalMem > 0 ? (usedMem / totalMem) * 100 : 0;

      // Best-effort disk stats using `df` on the root filesystem.
      let disk: {
        totalBytes?: number;
        usedBytes?: number;
        usedPercent?: number;
      } = {};
      try {
        const { stdout } = await execAsync("df -kP /");
        const lines = stdout.trim().split("\n");
        if (lines.length >= 2) {
          const parts = lines[1].split(/\s+/);
          if (parts.length >= 5) {
            const totalKb = Number.parseInt(parts[1] ?? "", 10);
            const usedKb = Number.parseInt(parts[2] ?? "", 10);
            if (Number.isFinite(totalKb) && totalKb > 0 && Number.isFinite(usedKb)) {
              const totalBytes = totalKb * 1024;
              const usedBytes = usedKb * 1024;
              disk = {
                totalBytes,
                usedBytes,
                usedPercent: (usedBytes / totalBytes) * 100,
              };
            }
          }
        }
      } catch {
        // Ignore disk errors and return partial stats.
      }

      return jsonResult({
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        uptimeSeconds: os.uptime(),
        loadAverage: {
          "1min": load[0],
          "5min": load[1],
          "15min": load[2],
        },
        memory: {
          totalBytes: totalMem,
          usedBytes: usedMem,
          freeBytes: freeMem,
          usedPercent: memPercent,
        },
        disk,
      });
    },
  };
}

function createSystemProcessesTool(): AnyAgentTool {
  return {
    label: "System Processes",
    name: "system_processes",
    description:
      "Lists the top N processes by CPU usage on the host running the Gateway (Linux ps-based implementation).",
    parameters: SystemProcessesSchema,
    execute: async (_toolCallId, params) => {
      const limitParam = readNumberParam(params as Record<string, unknown>, "limit", {
        label: "limit",
      });
      const limitRaw =
        typeof limitParam === "number" && Number.isFinite(limitParam) ? limitParam : DEFAULT_PROCESS_LIMIT;
      const limit = Math.min(Math.max(1, limitRaw), MAX_PROCESS_LIMIT);

      try {
        // ps aux --sort=-%cpu
        const { stdout } = await execAsync("ps aux --sort=-%cpu");
        const lines = stdout.trim().split("\n");
        const header = lines.shift() ?? "";
        const results = [];
        for (const line of lines.slice(0, limit)) {
          const parts = line.trim().split(/\s+/, 11);
          if (parts.length < 11) {
            continue;
          }
          const [user, pid, cpu, mem, vsz, rss, tty, stat, start, time, command] = parts;
          results.push({
            user,
            pid: Number.parseInt(pid, 10) || pid,
            cpuPercent: Number.parseFloat(cpu),
            memPercent: Number.parseFloat(mem),
            vsz,
            rss,
            tty,
            stat,
            start,
            time,
            command,
          });
        }
        return jsonResult({
          header,
          limit,
          processes: results,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({
          error: "system_processes_failed",
          message,
        });
      }
    },
  };
}

function createSystemNetworkInfoTool(): AnyAgentTool {
  return {
    label: "System Network Info",
    name: "system_network_info",
    description: "Returns hostname, primary IP (best-effort), and network interfaces for the host.",
    parameters: SystemNetworkInfoSchema,
    execute: async () => {
      const hostname = os.hostname();
      const interfaces = os.networkInterfaces();
      const ifaceSummaries: Array<{
        name: string;
        addresses: Array<{
          address: string;
          family: string;
          internal: boolean;
        }>;
      }> = [];
      let primaryIp: string | undefined;

      for (const [name, addrs] of Object.entries(interfaces)) {
        if (!addrs || addrs.length === 0) {
          continue;
        }
        const normalized = addrs
          .filter((addr) => addr.address && !addr.mac?.startsWith("00:00:00:00:00:00"))
          .map((addr) => ({
            address: addr.address,
            family: addr.family,
            internal: addr.internal,
          }));
        if (normalized.length === 0) {
          continue;
        }
        ifaceSummaries.push({
          name,
          addresses: normalized,
        });
        if (!primaryIp) {
          const candidate = normalized.find((addr) => !addr.internal && addr.family === "IPv4");
          primaryIp = candidate?.address ?? primaryIp;
        }
      }

      return jsonResult({
        hostname,
        primaryIp,
        interfaces: ifaceSummaries,
      });
    },
  };
}

function createSecurityOpenPortsTool(): AnyAgentTool {
  return {
    label: "Security: Open Ports",
    name: "security_open_ports",
    description:
      "Lists listening TCP/UDP ports on the host (Linux-only, uses `ss -tulpn`). Useful for quick exposure audits.",
    parameters: SecurityOpenPortsSchema,
    execute: async () => {
      try {
        const { stdout } = await execAsync("ss -tulpnH || ss -tulnH");
        const lines = stdout
          .trim()
          .split("\n")
          .filter((line) => line.trim().length > 0);
        const results: Array<{
          proto: string;
          localAddress: string;
          localPort: number | null;
          pid?: number;
          process?: string;
        }> = [];
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          if (parts.length < 5) {
            continue;
          }
          const proto = parts[0] ?? "";
          const local = parts[4] ?? "";
          let localAddress = local;
          let localPort: number | null = null;
          const lastColon = local.lastIndexOf(":");
          if (lastColon > 0 && lastColon < local.length - 1) {
            localAddress = local.slice(0, lastColon);
            const portStr = local.slice(lastColon + 1);
            const parsed = Number.parseInt(portStr, 10);
            localPort = Number.isFinite(parsed) ? parsed : null;
          }
          const processInfo = parts[parts.length - 1] ?? "";
          let pid: number | undefined;
          let processName: string | undefined;
          const match = processInfo.match(/pid=(\d+),?name="?([^"]*)"?/);
          if (match) {
            const parsedPid = Number.parseInt(match[1] ?? "", 10);
            if (Number.isFinite(parsedPid)) {
              pid = parsedPid;
            }
            processName = match[2] || undefined;
          }
          results.push({
            proto,
            localAddress,
            localPort,
            pid,
            process: processName,
          });
        }
        return jsonResult({
          results,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({
          error: "security_open_ports_failed",
          message,
        });
      }
    },
  };
}

function createSecuritySuspiciousProcessesTool(): AnyAgentTool {
  return {
    label: "Security: Suspicious Processes",
    name: "security_suspicious_processes",
    description:
      "Scans running processes for simple suspicious-name patterns (nc/ncat/telnet/tftp by default). Linux ps-based implementation.",
    parameters: SecuritySuspiciousProcessesSchema,
    execute: async (_toolCallId, params) => {
      const rawParams = params as Record<string, unknown>;
      const patterns =
        readStringArrayParam(rawParams, "patterns") ?? ["nc", "ncat", "telnet", "tftp"];
      try {
        const { stdout } = await execAsync("ps aux");
        const lines = stdout.trim().split("\n");
        const header = lines.shift() ?? "";
        const hits: Array<{
          pid: number | string;
          user: string;
          command: string;
          matchedPattern: string;
        }> = [];
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) {
            continue;
          }
          const parts = trimmed.split(/\s+/, 11);
          if (parts.length < 11) {
            continue;
          }
          const [user, pid, _cpu, _mem, _vsz, _rss, _tty, _stat, _start, _time, command] = parts;
          for (const pattern of patterns) {
            if (!pattern) {
              continue;
            }
            if (command.toLowerCase().includes(pattern.toLowerCase())) {
              hits.push({
                pid: Number.parseInt(pid, 10) || pid,
                user,
                command,
                matchedPattern: pattern,
              });
              break;
            }
          }
        }
        return jsonResult({
          header,
          patterns,
          matches: hits,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({
          error: "security_suspicious_processes_failed",
          message,
        });
      }
    },
  };
}

function createSecurityFixSensitivePermsTool(): AnyAgentTool {
  return {
    label: "Security: Fix Sensitive Permissions",
    name: "security_fix_sensitive_perms",
    description:
      "Checks selected files for overly-permissive modes (e.g. 777/666) and hardens them to 600. Returns a list of files adjusted.",
    parameters: SecurityFixSensitivePermsSchema,
    execute: async (_toolCallId, params) => {
      const rawParams = params as Record<string, unknown>;
      const paths =
        readStringArrayParam(rawParams, "paths") ?? ["config.json", ".credentials_vault.enc"];
      const cwd = process.cwd();
      const adjusted: Array<{ path: string; previousMode: string; newMode: string }> = [];
      const skipped: Array<{ path: string; reason: string }> = [];

      for (const relOrAbs of paths) {
        if (!relOrAbs) {
          continue;
        }
        let resolved = relOrAbs;
        if (!resolved.startsWith("/")) {
          resolved = `${cwd}/${resolved}`;
        }
        try {
          const stat = await fs.stat(resolved);
          const mode = (stat.mode & 0o777).toString(8);
          if (mode === "777" || mode === "666") {
            await fs.chmod(resolved, 0o600);
            adjusted.push({
              path: resolved,
              previousMode: mode,
              newMode: "600",
            });
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          skipped.push({ path: resolved, reason: message });
        }
      }

      return jsonResult({
        cwd,
        adjusted,
        skipped,
      });
    },
  };
}

function createDockerPruneTool(): AnyAgentTool {
  return {
    label: "Infra: Docker Prune",
    name: "infra_docker_prune",
    description:
      "Runs docker system df (and optionally docker system prune -f) to reclaim disk space. Intended for local/dev clusters.",
    parameters: DockerPruneSchema,
    execute: async (_toolCallId, params) => {
      const rawParams = params as Record<string, unknown>;
      const dryRun = Boolean(rawParams.dryRun);
      try {
        const { stdout: dfOut } = await execAsync("docker system df --format '{{json .}}' || docker system df");
        let pruneSummary: string | undefined;
        if (!dryRun) {
          const { stdout } = await execAsync("docker system prune -f");
          pruneSummary = stdout.trim();
        }
        return jsonResult({
          dryRun,
          df: dfOut.trim(),
          pruneSummary,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({
          error: "infra_docker_prune_failed",
          message,
        });
      }
    },
  };
}

function createEnsureServiceTool(): AnyAgentTool {
  return {
    label: "Infra: Ensure Service Running",
    name: "infra_ensure_service",
    description:
      "Checks a systemd service status and optionally restarts it if not active (uses `systemctl`).",
    parameters: EnsureServiceSchema,
    execute: async (_toolCallId, params) => {
      const rawParams = params as Record<string, unknown>;
      const name = readStringParam(rawParams, "name", { required: true, label: "service name" });
      const restart = Boolean(rawParams.restart);

      try {
        const { stdout, stderr } = await execAsync(`systemctl is-active ${name}`);
        const status = stdout.trim() || stderr.trim();
        const isActive = status === "active";

        let restartResult: string | undefined;
        if (!isActive && restart) {
          const { stdout: restartOut, stderr: restartErr } = await execAsync(
            `systemctl restart ${name} && systemctl is-active ${name}`,
          );
          restartResult = (restartOut || restartErr).trim();
        }

        return jsonResult({
          name,
          isActive,
          status,
          restartRequested: restart,
          restartResult,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({
          error: "infra_ensure_service_failed",
          name,
          message,
        });
      }
    },
  };
}

async function walkFiles(rootDir: string, opts?: { includeExtensions?: string[] }): Promise<string[]> {
  const results: string[] = [];
  const includeExtSet = new Set(
    (opts?.includeExtensions ?? [".py", ".sh", ".json", ".txt"]).map((ext) => ext.toLowerCase()),
  );

  async function walk(current: string) {
    let entries: any[];
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      entries = (await fs.readdir(current, { withFileTypes: true })) as unknown as any[];
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        const lower = entry.name.toLowerCase();
        if (
          lower === "node_modules" ||
          lower === ".git" ||
          lower === "dist" ||
          lower === "__pycache__" ||
          lower === "venv" ||
          lower === ".venv" ||
          lower === "deleted_archive"
        ) {
          continue;
        }
        await walk(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (includeExtSet.has(ext)) {
          results.push(fullPath);
        }
      }
    }
  }

  await walk(rootDir);
  return results;
}

function isBackupLikePath(p: string): boolean {
  const lower = p.toLowerCase();
  return (
    lower.includes(".bak") ||
    lower.includes("_backup") ||
    lower.includes("backup_") ||
    lower.includes("_old")
  );
}

function createCodebaseScanTool(): AnyAgentTool {
  return {
    label: "Codebase: Scan Duplicates & Backups",
    name: "codebase_scan_duplicates",
    description:
      "Scans a directory tree for potential duplicate files (by content hash) and backup/old files (by name pattern). Does not modify anything.",
    parameters: CodebaseScanSchema,
    execute: async (_toolCallId, params) => {
      const raw = params as Record<string, unknown>;
      const rootDir = readStringParam(raw, "rootDir", { required: true, label: "rootDir" });
      const includeExtensions =
        readStringArrayParam(raw, "includeExtensions") ?? [".py", ".sh", ".json", ".txt"];

      const absRoot = path.isAbsolute(rootDir) ? rootDir : path.resolve(process.cwd(), rootDir);
      const files = await walkFiles(absRoot, { includeExtensions });

      const hashToPath = new Map<string, string>();
      const duplicates: Array<{ path: string; original: string }> = [];
      const backups: string[] = [];

      for (const file of files) {
        if (isBackupLikePath(file)) {
          backups.push(file);
        }
        try {
          const buf = await fs.readFile(file);
          const hash = crypto.createHash("md5").update(buf).digest("hex");
          const existing = hashToPath.get(hash);
          if (existing && existing !== file) {
            duplicates.push({ path: file, original: existing });
          } else if (!existing) {
            hashToPath.set(hash, file);
          }
        } catch {
          // Ignore unreadable files.
        }
      }

      return jsonResult({
        rootDir: absRoot,
        scannedFiles: files.length,
        duplicateCount: duplicates.length,
        backupLikeCount: backups.length,
        duplicates,
        backupLikeFiles: backups,
      });
    },
  };
}

function createCodebaseArchiveBackupsTool(): AnyAgentTool {
  return {
    label: "Codebase: Archive Backups",
    name: "codebase_archive_backups",
    description:
      "Moves backup/old files (by name pattern) older than a threshold into an archive directory with a timestamped name.",
    parameters: CodebaseArchiveBackupsSchema,
    execute: async (_toolCallId, params) => {
      const raw = params as Record<string, unknown>;
      const rootDir = readStringParam(raw, "rootDir", { required: true, label: "rootDir" });
      const archiveDir = readStringParam(raw, "archiveDir", {
        required: true,
        label: "archiveDir",
      });
      const olderThanDaysParam = readNumberParam(raw, "olderThanDays", {
        label: "olderThanDays",
      });
      const olderThanDays = olderThanDaysParam && olderThanDaysParam > 0 ? olderThanDaysParam : 7;
      const olderThanSeconds = olderThanDays * 24 * 60 * 60;

      const absRoot = path.isAbsolute(rootDir) ? rootDir : path.resolve(process.cwd(), rootDir);
      const absArchive = path.isAbsolute(archiveDir)
        ? archiveDir
        : path.resolve(process.cwd(), archiveDir);

      await fs.mkdir(absArchive, { recursive: true });

      const now = Date.now() / 1000;
      const moved: Array<{ from: string; to: string }> = [];
      const skipped: Array<{ path: string; reason: string }> = [];

      const allFiles = await walkFiles(absRoot, { includeExtensions: [".py", ".sh", ".json", ".txt"] });
      for (const file of allFiles) {
        if (!isBackupLikePath(file)) {
          continue;
        }
        try {
          const stat = await fs.stat(file);
          const mtimeSec = stat.mtimeMs / 1000;
          if (now - mtimeSec <= olderThanSeconds) {
            continue;
          }
          const base = path.basename(file);
          const timestamp = new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14);
          const dest = path.join(absArchive, `${timestamp}_${base}`);
          await fs.rename(file, dest);
          moved.push({ from: file, to: dest });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          skipped.push({ path: file, reason: message });
        }
      }

      return jsonResult({
        rootDir: absRoot,
        archiveDir: absArchive,
        olderThanDays,
        movedCount: moved.length,
        moved,
        skipped,
      });
    },
  };
}

function normalizePythonContent(content: string): string {
  const lines = content.split("\n");
  const out: string[] = [];
  for (const line of lines) {
    const trimmedRight = line.replace(/\s+$/u, "");
    if (trimmedRight === "" && out.length > 0 && out[out.length - 1] === "") {
      continue;
    }
    out.push(trimmedRight);
  }
  return out.join("\n");
}

function createCodebaseNormalizePythonTool(): AnyAgentTool {
  return {
    label: "Codebase: Normalize Python",
    name: "codebase_normalize_python",
    description:
      "Normalizes .py files under a root directory (trailing whitespace + duplicate blank lines). Optionally guards changes with python3 -m py_compile and supports dry-run.",
    parameters: CodebaseNormalizePythonSchema,
    execute: async (_toolCallId, params) => {
      const raw = params as Record<string, unknown>;
      const rootDir = readStringParam(raw, "rootDir", { required: true, label: "rootDir" });
      const checkSyntax = raw.checkSyntax !== false;
      const dryRun = Boolean(raw.dryRun);

      const absRoot = path.isAbsolute(rootDir) ? rootDir : path.resolve(process.cwd(), rootDir);
      const pyFiles = await walkFiles(absRoot, { includeExtensions: [".py"] });

      const changed: string[] = [];
      const skipped: Array<{ path: string; reason: string }> = [];

      for (const file of pyFiles) {
        try {
          const original = await fs.readFile(file, "utf8");
          const normalized = normalizePythonContent(original);
          if (normalized === original) {
            continue;
          }
          if (checkSyntax) {
            const tmpPath = `${file}.aliinorm.tmp`;
            await fs.writeFile(tmpPath, normalized, "utf8");
            try {
              await execAsync(`python3 -m py_compile ${JSON.stringify(tmpPath)}`);
            } catch (err) {
              const message = err instanceof Error ? err.message : String(err);
              skipped.push({ path: file, reason: `syntax check failed: ${message}` });
              await fs.unlink(tmpPath).catch(() => {});
              continue;
            }
            await fs.unlink(tmpPath).catch(() => {});
          }
          if (!dryRun) {
            await fs.writeFile(file, normalized, "utf8");
          }
          changed.push(file);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          skipped.push({ path: file, reason: message });
        }
      }

      return jsonResult({
        rootDir: absRoot,
        dryRun,
        normalizedCount: changed.length,
        normalizedFiles: changed,
        skipped,
      });
    },
  };
}

function createClusterAutoscaleSuggestTool(): AnyAgentTool {
  return {
    label: "Cluster: Autoscale Suggest",
    name: "cluster_autoscale_suggest",
    description:
      "Reads current Alii pod count and CPU from kubectl and suggests a target replica count based on simple thresholds (similar to Moltbot autoscale.py). Does not mutate the cluster.",
    parameters: ClusterAutoscaleSuggestSchema,
    execute: async (_toolCallId, params) => {
      const raw = params as Record<string, unknown>;
      const deploymentName =
        readStringParam(raw, "deploymentName")?.trim() || "alii-AliiServe";
      const minReplicasParam = readNumberParam(raw, "minReplicas", { label: "minReplicas" });
      const maxReplicasParam = readNumberParam(raw, "maxReplicas", { label: "maxReplicas" });
      const minReplicas = minReplicasParam && minReplicasParam > 0 ? minReplicasParam : 10;
      const maxReplicas =
        maxReplicasParam && maxReplicasParam >= minReplicas ? maxReplicasParam : 50;

      try {
        const { stdout: podsOut } = await execAsync(
          `kubectl get pods | grep ${deploymentName} | grep Running | wc -l`,
        );
        const pods = Number.parseInt(podsOut.trim() || "0", 10) || 0;

        const { stdout: cpuOut } = await execAsync(
          `kubectl top pods 2>/dev/null | grep ${deploymentName} | head -1 | awk '{print $3}' | cut -d% -f1 || echo 0`,
        );
        const cpuPercent = Number.parseInt(cpuOut.trim() || "0", 10) || 0;

        let suggested = pods;
        let reason = "no_change";
        if (cpuPercent > 85 && pods < maxReplicas) {
          suggested = Math.min(maxReplicas, pods + 5);
          reason = "scale_up";
        } else if (cpuPercent < 40 && pods > minReplicas) {
          suggested = Math.max(minReplicas, pods - 3);
          reason = "scale_down";
        }

        return jsonResult({
          deploymentName,
          minReplicas,
          maxReplicas,
          currentReplicas: pods,
          currentCpuPercent: cpuPercent,
          suggestedReplicas: suggested,
          decision: reason,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({
          error: "cluster_autoscale_suggest_failed",
          message,
        });
      }
    },
  };
}

function createClusterAutoscaleApplyTool(): AnyAgentTool {
  return {
    label: "Cluster: Autoscale Apply",
    name: "cluster_autoscale_apply",
    description:
      "Scales a Kubernetes deployment to a specific replica count using kubectl scale.",
    parameters: ClusterAutoscaleApplySchema,
    execute: async (_toolCallId, params) => {
      const raw = params as Record<string, unknown>;
      const deploymentName = readStringParam(raw, "deploymentName", {
        required: true,
        label: "deploymentName",
      });
      const replicas = readNumberParam(raw, "replicas", {
        required: true,
        label: "replicas",
        integer: true,
      });
      const namespace = readStringParam(raw, "namespace");

      if (!replicas || replicas <= 0) {
        return jsonResult({
          error: "invalid_replicas",
          message: "replicas must be a positive integer",
        });
      }

      try {
        const nsArg = namespace && namespace.trim() ? `-n ${namespace.trim()}` : "";
        const cmd = `kubectl scale deployment ${deploymentName} ${nsArg} --replicas=${replicas}`;
        const { stdout, stderr } = await execAsync(cmd);
        return jsonResult({
          deploymentName,
          replicas,
          namespace: namespace || null,
          command: cmd,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({
          error: "cluster_autoscale_apply_failed",
          deploymentName,
          replicas,
          namespace: namespace || null,
          message,
        });
      }
    },
  };
}


