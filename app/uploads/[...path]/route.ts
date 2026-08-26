const uploadFilenamePattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|png|webp|gif)$/i;

function apiOrigin() {
  const configured = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
  return new URL(configured, "http://localhost:4000").origin;
}

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const filename = path.length === 1 ? path[0] : "";
  if (!uploadFilenamePattern.test(filename)) return new Response("Not found", { status: 404 });

  let upstream: Response;
  try {
    upstream = await fetch(`${apiOrigin()}/uploads/${encodeURIComponent(filename)}`, { cache: "no-store" });
  } catch {
    return new Response("Image service unavailable", { status: 503 });
  }
  if (!upstream.ok || !upstream.body) return new Response("Not found", { status: 404 });

  const headers = new Headers({
    "Cache-Control": upstream.headers.get("cache-control") || "public, max-age=31536000, immutable",
    "Content-Type": upstream.headers.get("content-type") || "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
  });
  const contentLength = upstream.headers.get("content-length");
  if (contentLength) headers.set("Content-Length", contentLength);

  return new Response(upstream.body, { status: 200, headers });
}
