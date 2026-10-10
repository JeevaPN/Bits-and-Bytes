import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const lockPath = path.resolve(".cache/civicsync-dev.lock");
fs.mkdirSync(path.dirname(lockPath), { recursive: true });

function running(pid) {
  if (!Number.isInteger(pid) || pid < 1) return false;
  try { process.kill(pid, 0); return true; }
  catch (error) { return error.code !== "ESRCH"; }
}

function acquireLock() {
  try {
    const descriptor = fs.openSync(lockPath, "wx");
    fs.writeFileSync(descriptor, JSON.stringify({ pid: process.pid }));
    fs.closeSync(descriptor);
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    let owner;
    try { owner = JSON.parse(fs.readFileSync(lockPath, "utf8")); }
    catch { throw new Error("Another development server is starting. Wait for its startup to finish."); }
    if (running(owner.pid)) {
      throw new Error("CivicSync is already running. Use the existing dev server, or stop it with Ctrl+C before starting another. This prevents conflicting Webpack chunks.");
    }
    fs.unlinkSync(lockPath);
    acquireLock();
  }
}

try { acquireLock(); }
catch (error) { console.error(error.message); process.exit(1); }

function releaseLock() {
  try {
    const owner = JSON.parse(fs.readFileSync(lockPath, "utf8"));
    if (owner.pid === process.pid) fs.unlinkSync(lockPath);
  } catch { /* Another process must not have its lock removed. */ }
}
process.once("exit", releaseLock);

const child = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "dev", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: process.env,
});
let stopping = false;
function stop() {
  if (stopping || !child.pid) return;
  stopping = true;
  if (process.platform === "win32") {
    // Stop only the Next.js process tree launched by this wrapper.
    spawn("taskkill.exe", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
  } else {
    child.kill("SIGTERM");
  }
}
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
child.once("error", (error) => { console.error(error.message); process.exitCode = 1; });
child.once("close", (code) => { process.exitCode = stopping ? 0 : (code ?? 1); });
