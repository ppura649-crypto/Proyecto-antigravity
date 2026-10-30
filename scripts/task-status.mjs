// Durable progress for agent-run work. The workspace only reads these records; it never starts a task.
// beginTask({ root, id, label, project?, format?, stage }) returns update(), done() and error(). A five-second heartbeat
// lets a reader distinguish active work from a process that disappeared. Counters are recorded work,
// never estimates. Atomic replacement keeps polling readers away from partial JSON.
import { mkdirSync, readFileSync, writeFileSync, renameSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export function beginTask({ root = process.cwd(), id, label, project, format, stage = "Starting", heartbeatMs = 5000 }) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new Error("Invalid task id");
  const dir = join(root, "workspace", ".tasks");
  const path = join(dir, `${id}.json`);
  const runId = randomUUID();
  const startedAt = new Date().toISOString();
  let record = { id, runId, label, ...(project ? { project } : {}), ...(format ? { format } : {}), status: "running", stage, startedAt, updatedAt: startedAt };
  let finished = false;
  mkdirSync(dir, { recursive: true });
  function write(first = false) {
    if (!first) {
      try { if (JSON.parse(readFileSync(path, "utf8")).runId !== runId) return; } catch {}
    }
    record.updatedAt = new Date().toISOString();
    const temporary = `${path}.${runId}.tmp`;
    writeFileSync(temporary, JSON.stringify(record, null, 2) + "\n");
    renameSync(temporary, path);
  }
  write(true);
  const heartbeat = setInterval(() => { try { write(); } catch {} }, heartbeatMs);
  heartbeat.unref();
  const exit = () => finish("error", "Stopped before finishing");
  const interrupt = () => { finish("error", "Interrupted"); process.exit(130); };
  const terminate = () => { finish("error", "Interrupted"); process.exit(143); };
  process.once("exit", exit);
  process.once("SIGINT", interrupt);
  process.once("SIGTERM", terminate);
  function finish(status, finalStage) {
    if (finished) return;
    finished = true;
    clearInterval(heartbeat);
    process.removeListener("exit", exit);
    process.removeListener("SIGINT", interrupt);
    process.removeListener("SIGTERM", terminate);
    record = { ...record, status, stage: finalStage ?? record.stage, finishedAt: new Date().toISOString() };
    try { write(); } catch {}
  }
  return {
    update({ stage: nextStage, completed, total } = {}) {
      if (finished) return;
      if (typeof nextStage === "string") record.stage = nextStage;
      if (Number.isFinite(completed) && completed >= 0) record.completed = completed;
      if (Number.isFinite(total) && total >= 0) record.total = total;
      write();
    },
    done(stage = "Finished") { finish("done", stage); },
    error(stage = "Could not finish") { finish("error", stage); },
  };
}
