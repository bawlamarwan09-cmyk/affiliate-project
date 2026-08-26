import path from "node:path";

export const uploadDirectory = path.resolve(
  process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads"),
);

export const uploadFilenamePattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|png|webp|gif)$/i;
