import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const contentTypes: Record<string, string> = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

function uploadPath(filename: string) {
  return path.join(process.cwd(), "public", "uploads", path.basename(filename));
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  const { filename } = await context.params;
  const extension = path.extname(filename).toLowerCase();

  if (!contentTypes[extension]) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
  }

  try {
    const filePath = uploadPath(filename);
    const info = await stat(filePath);
    if (!info.isFile()) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const file = await readFile(filePath);

    return new NextResponse(file, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(info.size),
        "Content-Type": contentTypes[extension]
      }
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
