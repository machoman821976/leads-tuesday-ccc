import { spawn } from "node:child_process";
import open from "open";

const port = process.env.PORT || "3000";
const url = `http://localhost:${port}`;

const child = spawn("next", ["dev"], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

async function waitForServer() {
  while (true) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) return;
    } catch {
      // server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
}

waitForServer().then(() => open(url));

child.on("exit", (code) => process.exit(code ?? 0));
