import { spawn, type ChildProcess } from "node:child_process";

let serverProcess: ChildProcess | null = null;

export async function setup(): Promise<void> {
  serverProcess = spawn("pnpm", ["dev", "-p", "3099"], {
    cwd: "/root/vantagepay/apps/web",
    stdio: "pipe",
    env: { ...process.env, PORT: "3099" },
  });

  if (serverProcess.pid) {
    process.env.__TEST_SERVER_PID = String(serverProcess.pid);
  }

  // Wait for the Next.js dev server to be ready
  for (let i = 0; i < 90; i++) {
    try {
      const res = await fetch("http://localhost:3099/api/card", {
        headers: { "x-wallet-address": "health" },
      });
      if (res.status < 500) return;
    } catch {
      // Connection refused, server not ready yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Next.js dev server failed to start within 90s");
}

export async function teardown(): Promise<void> {
  const pid = process.env.__TEST_SERVER_PID;
  if (pid) {
    try {
      process.kill(-Number(pid), "SIGTERM");
    } catch {
      // Process already gone
    }
  }
}