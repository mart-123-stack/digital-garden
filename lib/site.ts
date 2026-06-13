export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function absoluteUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl()}${normalizedPath}`;
}
