import assert from "node:assert/strict";
import { readFile, unlink } from "node:fs/promises";
import path from "node:path";

const base = process.env.API_TEST_URL || "http://localhost:4000/api";
let cookie = "";

async function raw(pathname, method = "GET", body) {
  const response = await fetch(`${base}${pathname}`, {
    method,
    headers: {
      ...(body instanceof FormData ? {} : { "content-type": "application/json" }),
      ...(cookie ? { cookie } : {}),
    },
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";")[0];
  return {
    response,
    payload: response.status === 204 ? null : await response.json(),
  };
}

const login = await raw("/auth/login", "POST", {
  email: "admin@example.com",
  password: "LocalTestPass123",
});
assert.equal(login.response.status, 200);

const disguised = new FormData();
disguised.append("file", new Blob(["not an image"], { type: "image/png" }), "fake.png");
assert.equal((await raw("/admin/upload", "POST", disguised)).response.status, 400);

// A minimal 1×1 transparent PNG. The uploaded file is removed in finally.
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);
const form = new FormData();
form.append("file", new Blob([png], { type: "image/png" }), "pixel.png");
let uploadedPath;

try {
  const uploaded = await raw("/admin/upload", "POST", form);
  assert.equal(uploaded.response.status, 201, JSON.stringify(uploaded.payload));
  const data = uploaded.payload.data;
  assert.equal(data.storage, "local");
  assert.match(data.url, /^\/uploads\/[0-9a-f-]+\.png$/);
  uploadedPath = path.resolve(process.cwd(), "public", data.url.slice(1));
  const relative = path.relative(path.resolve(process.cwd(), "public", "uploads"), uploadedPath);
  assert(relative && !relative.startsWith("..") && !path.isAbsolute(relative));
  assert.deepEqual(await readFile(uploadedPath), png);
} finally {
  if (uploadedPath) await unlink(uploadedPath);
}

console.log("Local image fallback accepted a genuine image, rejected disguised content, and cleaned up its fixture.");
