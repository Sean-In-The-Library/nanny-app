import { NextResponse } from "next/server";
import { readAppData, writeAppData } from "@/lib/storage";
import type { AppData } from "@/lib/types";

export async function GET() {
  const data = await readAppData();
  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const body = (await request.json().catch(() => null)) as AppData | null;

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Request body must be app data." },
      { status: 400 },
    );
  }

  const data = await writeAppData(body);
  return NextResponse.json(data);
}

