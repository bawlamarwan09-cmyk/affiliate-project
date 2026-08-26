import assert from "node:assert/strict";

const base = process.env.API_TEST_URL || "http://localhost:4000/api";

function client() {
  let cookie = "";
  return {
    async raw(path, method = "GET", body) {
      const response = await fetch(`${base}${path}`, {
        method,
        headers: {
          ...(body instanceof FormData ? {} : { "content-type": "application/json" }),
          ...(cookie ? { cookie } : {}),
        },
        body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
      });
      const setCookie = response.headers.get("set-cookie");
      if (setCookie) cookie = setCookie.split(";")[0];
      let payload = null;
      if (response.status !== 204) payload = await response.json();
      return { response, payload };
    },
    async request(path, method = "GET", body) {
      const { response, payload } = await this.raw(path, method, body);
      if (!response.ok) {
        throw new Error(`${method} ${path} -> ${response.status}: ${JSON.stringify(payload)}`);
      }
      return payload?.data ?? payload;
    },
  };
}

async function expectStatus(clientInstance, status, path, method = "GET", body) {
  const result = await clientInstance.raw(path, method, body);
  assert.equal(result.response.status, status, `${method} ${path} returned ${result.response.status}`);
  return result.payload;
}

const unauthenticated = client();
await expectStatus(unauthenticated, 401, "/auth/session");

const owner = client();
const ownerLogin = await owner.request("/auth/login", "POST", {
  email: "admin@example.com",
  password: "LocalTestPass123",
});
assert.equal(ownerLogin.admin.role, "OWNER", "The permission fixture must be an OWNER");
assert.equal((await owner.request("/auth/session")).admin.role, "OWNER");

const suffix = Date.now().toString(36);
const createdAdminIds = [];
const cleanupErrors = [];
let testError;

try {
  const adminAccount = await owner.request("/admin/admins", "POST", {
    name: `Permission Admin ${suffix}`,
    email: `permission-admin-${suffix}@example.com`,
    password: "TemporaryPass123",
    role: "ADMIN",
    active: true,
  });
  createdAdminIds.push(adminAccount.id);

  const editorAccount = await owner.request("/admin/admins", "POST", {
    name: `Permission Editor ${suffix}`,
    email: `permission-editor-${suffix}@example.com`,
    password: "TemporaryPass123",
    role: "EDITOR",
    active: true,
  });
  createdAdminIds.push(editorAccount.id);

  const admin = client();
  await admin.request("/auth/login", "POST", {
    email: adminAccount.email,
    password: "TemporaryPass123",
  });
  assert.equal((await admin.request("/auth/session")).admin.role, "ADMIN");
  await admin.request("/admin/overview");
  await admin.request("/admin/settings");
  await admin.request("/admin/admins");
  await admin.request("/admin/subscribers");

  const managedEditor = await admin.request("/admin/admins", "POST", {
    name: `Managed Editor ${suffix}`,
    email: `managed-editor-${suffix}@example.com`,
    password: "TemporaryPass123",
    role: "EDITOR",
    active: true,
  });
  createdAdminIds.push(managedEditor.id);

  await expectStatus(admin, 403, "/admin/admins", "POST", {
    name: `Forbidden Owner ${suffix}`,
    email: `forbidden-owner-${suffix}@example.com`,
    password: "TemporaryPass123",
    role: "OWNER",
    active: true,
  });
  await expectStatus(admin, 403, `/admin/admins/${ownerLogin.admin.id}`, "PATCH", {
    email: ownerLogin.admin.email,
    name: ownerLogin.admin.name,
    role: "OWNER",
    active: true,
  });
  await expectStatus(admin, 403, `/admin/admins/${ownerLogin.admin.id}/toggle`, "POST", { active: false });
  await expectStatus(admin, 403, `/admin/admins/${ownerLogin.admin.id}`, "DELETE");

  await owner.request(`/admin/admins/${adminAccount.id}`, "PATCH", {
    email: adminAccount.email,
    name: adminAccount.name,
    role: "EDITOR",
    active: true,
  });
  assert.equal((await admin.request("/auth/session")).admin.role, "EDITOR");
  await expectStatus(admin, 403, "/admin/settings");

  const editor = client();
  await editor.request("/auth/login", "POST", {
    email: editorAccount.email,
    password: "TemporaryPass123",
  });
  assert.equal((await editor.request("/auth/session")).admin.role, "EDITOR");
  await editor.request("/admin/overview");
  await editor.request("/admin/options");
  await editor.request("/admin/seo-audit");
  await editor.request("/admin/products");
  await expectStatus(editor, 400, "/admin/upload", "POST", new FormData());
  await expectStatus(editor, 403, "/admin/settings");
  await expectStatus(editor, 403, "/admin/admins");
  await expectStatus(editor, 403, "/admin/contact-messages");
  await expectStatus(editor, 403, "/admin/subscribers");

  await owner.request(`/admin/admins/${editorAccount.id}/toggle`, "POST", { active: false });
  await expectStatus(editor, 401, "/auth/session");

  await admin.request("/auth/logout", "POST");
  await expectStatus(admin, 401, "/auth/session");
} catch (error) {
  testError = error;
} finally {
  for (const id of createdAdminIds.slice().reverse()) {
    try {
      await owner.request(`/admin/admins/${id}`, "DELETE");
    } catch (error) {
      cleanupErrors.push(error);
    }
  }
}

if (testError || cleanupErrors.length) {
  throw new AggregateError(
    [testError, ...cleanupErrors].filter(Boolean),
    "The admin permission suite or its cleanup failed",
  );
}

console.log("Admin permission boundaries passed and temporary accounts were removed.");
