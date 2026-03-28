import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/server/auth";
import { previewCsvImport } from "@/lib/server/imports";

export async function POST(request: Request) {
  try {
    await requireSessionUser("admin");

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing CSV file" }, { status: 400 });
    }

    const preview = await previewCsvImport(Buffer.from(await file.arrayBuffer()));
    return NextResponse.json(preview);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to preview CSV" },
      { status: 400 },
    );
  }
}
