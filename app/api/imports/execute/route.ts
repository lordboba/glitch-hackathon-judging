import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/server/auth";
import { executeCsvImport } from "@/lib/server/imports";

export async function POST(request: Request) {
  try {
    const admin = await requireSessionUser("admin");
    const formData = await request.formData();
    const file = formData.get("file");
    const eventId = String(formData.get("eventId") || "");
    const rawMapping = String(formData.get("mapping") || "{}");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing CSV file" }, { status: 400 });
    }

    const result = await executeCsvImport({
      eventId,
      uploadedByUserId: admin.id,
      fileBuffer: Buffer.from(await file.arrayBuffer()),
      mapping: JSON.parse(rawMapping),
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to import CSV" },
      { status: 400 },
    );
  }
}
