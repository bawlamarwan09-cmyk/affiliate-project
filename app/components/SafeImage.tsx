import Image from "next/image";

type Props = { src: string; alt: string; width: number; height: number; sizes?: string; priority?: boolean; className?: string };
const optimizedHosts = new Set(["images.unsplash.com", "placehold.co", "res.cloudinary.com"]);
const imageApi = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api").replace(/\/$/, "");
const responsiveWidths = [320, 384, 430, 640, 750, 828, 1080, 1200, 1440];

function uploadUrl(src: string, width: number) {
  const filename = src.slice("/uploads/".length);
  return `${imageApi}/image/${encodeURIComponent(filename)}?w=${width}&q=72`;
}

export function SafeImage({ src, alt, width, height, sizes, priority = false, className }: Props) {
  let optimized = src.startsWith("/");
  try { optimized = optimized || optimizedHosts.has(new URL(src).hostname); } catch {}
  const runtimeUpload = src.startsWith("/uploads/") && !src.toLowerCase().endsWith(".gif");
  if (runtimeUpload) {
    const candidates = responsiveWidths.filter(candidate => candidate < width);
    if (!candidates.includes(width)) candidates.push(width);
    return <img src={uploadUrl(src, width)} srcSet={candidates.map(candidate => `${uploadUrl(src, candidate)} ${candidate}w`).join(", ")} alt={alt} width={width} height={height} sizes={sizes} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} decoding="async" className={className} />;
  }
  return <Image src={src} alt={alt} width={width} height={height} sizes={sizes} priority={priority} className={className} quality={72} unoptimized={src.startsWith("/brand/") || !optimized} />;
}
