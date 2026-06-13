import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth.response) return auth.response;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only images are allowed" }, { status: 400 });
    }

    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "Image is too large. Max 8MB." }, { status: 400 });
    }

    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const fileName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(uploadDir, fileName);

    await mkdir(uploadDir, { recursive: true });
    await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

    const url = `/uploads/${fileName}`;

    if (auth.user?.id && auth.user.id !== "admin") {
      await query(
        `INSERT INTO media_assets (owner_id, url, file_name, mime_type, size_bytes)
         VALUES ($1, $2, $3, $4, $5)`,
        [auth.user.id, url, fileName, file.type, file.size]
      ).catch(() => null);
    }

    return NextResponse.json({ url, fileName });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
