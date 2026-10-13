import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";

test("production dashboard proxy validates browser origins before forwarding", { timeout: 60000 }, async t => {
  const token = "a".repeat(64);
  const calls = [];
  const backend = createServer(async (req, res) => {
    calls.push({ path: req.url, origin: req.headers.origin, cookie: req.headers.cookie });
    res.setHeader("Content-Type", "application/json");
    // Reproduce the deployed backend's rejection of the dashboard origin.
    if (req.headers.origin) { res.writeHead(403).end('{"message":"Request origin could not be verified"}'); return; }
    if (req.headers["x-cms-request"] !== "1") { res.writeHead(403).end('{}'); return; }
    if (req.url === "/auth/login") {
      let body = "";
      for await (const chunk of req) body += chunk;
      assert.deepEqual(JSON.parse(body), { email: "test@example.com", password: "test-password" });
      res.setHeader("Set-Cookie", `iw_admin_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict`);
      res.end('{"user":{"id":1,"email":"test@example.com","role":"admin"}}');
    } else if (req.url === "/auth/logout") {
      res.setHeader("Set-Cookie", "iw_admin_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict");
      res.writeHead(204).end();
    } else if (req.url === "/api/books") {
      res.setHeader("Retry-After", "5");
      res.writeHead(503).end('{"message":"Database unavailable"}');
    } else res.end('{"user":{"id":1,"email":"test@example.com","role":"admin"}}');
  });
  backend.listen(0, "127.0.0.1");
  await once(backend, "listening");
  const backendUrl = `http://127.0.0.1:${backend.address().port}`;
  const reservation = createServer();
  reservation.listen(0, "127.0.0.1");
  await once(reservation, "listening");
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const origin = `http://127.0.0.1:${port}`;
  const next = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    env: { ...process.env, NODE_ENV: "production", API_INTERNAL_URL: backendUrl }, stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
  });
  let output = "";
  for (const stream of [next.stdout, next.stderr]) stream.on("data", chunk => { output = (output + chunk).slice(-4000); });
  const login = (extra = {}) => fetch(`${origin}/api/backend/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json", "X-CMS-Request": "1", Origin: origin, ...extra },
    body: JSON.stringify({ email: "test@example.com", password: "test-password" }),
  });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (next.exitCode !== null) throw new Error(output);
      try { if ((await fetch(`${origin}/login`)).ok) { ready = true; break; } } catch {}
      await delay(100);
    }
    assert.ok(ready, output);
    await t.test("same-origin sign-in works without downstream Origin and preserves cookies", async () => {
      const response = await login();
      assert.equal(response.status, 200);
      assert.equal((await response.json()).user.email, "test@example.com");
      assert.match(response.headers.get("set-cookie"), /HttpOnly; Secure; SameSite=Strict/);
      assert.equal(calls.at(-1).origin, undefined);
      const identity = await fetch(`${origin}/api/backend/auth/me`, { headers: { Cookie: `iw_admin_session=${token}` } });
      assert.equal(identity.status, 200);
      assert.equal(calls.at(-1).cookie, `iw_admin_session=${token}`);
      const logout = await fetch(`${origin}/api/backend/auth/logout`, { method: "POST", headers: { "X-CMS-Request": "1", Origin: origin, Cookie: `iw_admin_session=${token}` } });
      assert.equal(logout.status, 204);
      assert.match(logout.headers.get("set-cookie"), /Max-Age=0/);
    });
    await t.test("foreign origins and missing CSRF headers are rejected before forwarding", async () => {
      const count = calls.length;
      assert.equal((await login({ Origin: "https://attacker.example" })).status, 403);
      assert.equal((await login({ "X-CMS-Request": "" })).status, 403);
      assert.equal(calls.length, count);
      assert.equal((await fetch(`${origin}/api/backend/not-allowed`)).status, 404);
    });
    await t.test("upstream failures and transport failures return 503", async () => {
      const upstream = await fetch(`${origin}/api/backend/api/books`);
      assert.equal(upstream.status, 503);
      assert.equal((await upstream.json()).message, "Database unavailable");
      assert.equal(upstream.headers.get("retry-after"), "5");
      backend.closeAllConnections();
      await new Promise(resolve => backend.close(resolve));
      assert.equal((await login()).status, 503);
    });
    await t.test("responsive logo images do not create unused preload hints", async () => {
      const html = await (await fetch(`${origin}/login`)).text();
      assert.match(html, /<img[^>]*loading="lazy"[^>]*src="\/brand\/logo\.jpg"/);
      assert.doesNotMatch(html, /<link[^>]*(?:rel="preload"[^>]*href="\/brand\/logo\.jpg"|href="\/brand\/logo\.jpg"[^>]*rel="preload")/);
    });
  } finally {
    next.kill();
    await once(next, "exit");
    backend.closeAllConnections();
    if (backend.listening) await new Promise(resolve => backend.close(resolve));
  }
});
