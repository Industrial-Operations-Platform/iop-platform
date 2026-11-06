const { spawnSync } = require("node:child_process");
const http = require("node:http");
const { root } = require("./cli.cjs");
const project = "iop-railway-check-" + process.pid;
const base = ["compose", "-f", "compose.railway-check.yaml", "-p", project];
function docker(args, capture = false) {
  const result = spawnSync("docker", [...base, ...args], { cwd: root, encoding: "utf8", stdio: capture ? "pipe" : "inherit", timeout: 180000 });
  if (result.status !== 0) throw new Error("Synthetic Railway container check failed; no real installation was targeted.");
  return result.stdout;
}
async function main() {
  try {
    docker(["up", "-d", "--wait", "database"]);
    docker(["run", "--rm", "setup"]);
    const output = docker(["run", "--rm", "setup", "node", "scripts/railway/admin.cjs"], true);
    const password = output.match(/Initial password \(shown once\): ([A-Za-z0-9_-]+)/)?.[1];
    if (!password) throw new Error("Synthetic initial access was not issued.");
    docker(["up", "-d", "--wait", "app"]);
    const headers = { Host: "railway.test.example", "X-Forwarded-Proto": "https", Origin: "https://railway.test.example", "X-IOP-Demo": "1", "Content-Type": "application/json" };
    const origin = "http://127.0.0.1:18080";
    // Node fetch intentionally replaces Host; http.request can model the Railway proxy accurately.
    const call = (path, options = {}) => new Promise((resolve, reject) => {
      const req = http.request(origin + path, { method: options.method ?? "GET", headers: { ...headers, ...options.headers } }, res => {
        const parts = [];
        res.on("data", chunk => parts.push(chunk));
        res.on("end", () => resolve(new Response(Buffer.concat(parts), { status: res.statusCode, headers: res.headers })));
        res.on("error", reject);
      });
      req.setTimeout(10000, () => req.destroy(new Error("Synthetic request timed out.")));
      req.on("error", reject); req.end(options.body);
    });
    const web = await call("/"), anonymous = await call("/api/v1/users");
    if (!web.ok || anonymous.status !== 401) throw new Error(`Combined web/API or anonymous access verification failed (web ${web.status}, API ${anonymous.status}).`);
    if ((await call("/api/v1/demo/context", { headers: { "X-Forwarded-Proto": "http" } })).status !== 403) throw new Error("HTTP API access was not denied.");
    const login = await call("/api/v1/auth/login", { method: "POST", body: JSON.stringify({ username: "admin", password }) });
    const cookie = login.headers.get("set-cookie");
    if (!login.ok || !cookie?.includes("; Secure") || !cookie.includes("HttpOnly")) throw new Error("Remote login or secure cookies failed.");
    const context = await call("/api/v1/demo/context", { headers: { Cookie: cookie.split(";")[0] } });
    if (!(await context.json()).mustChangePassword) throw new Error("The initial password change was not enforced.");
    const user = docker(["exec", "-T", "app", "node", "-p", "require('node:fs').readFileSync('/proc/1/status','utf8').match(/^Uid:\\s+(\\d+)/m)[1]"], true).trim();
    if (user !== "1000") throw new Error("The image is not running as the non-root Node user.");
    console.log("Synthetic Railway image passed: migrations, combined web/API, secure login, required password change and non-root runtime.");
  } finally {
    // Only this process's synthetic Compose project is removed, including its test volume.
    docker(["down", "--volumes", "--remove-orphans"]);
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
