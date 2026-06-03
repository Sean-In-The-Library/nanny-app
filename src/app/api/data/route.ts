import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/apiAuth";
import { readAppData, writeAppData } from "@/lib/storage";
import type { AppData } from "@/lib/types";

export async function GET() {
  const session = await requireApiSession();
  if (session.response) {
    return session.response;
  }

  const data = await readAppData();
  return NextResponse.json(filterDataForUser(data, session.user.role));
}

export async function PUT(request: Request) {
  const session = await requireApiSession();
  if (session.response) {
    return session.response;
  }

  const body = (await request.json().catch(() => null)) as AppData | null;

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Request body must be app data." },
      { status: 400 },
    );
  }

  const dataToSave =
    session.user.role === "nanny"
      ? {
          ...body,
          adminItems: (await readAppData()).adminItems,
        }
      : body;

  const data = await writeAppData(dataToSave);
  return NextResponse.json(data);
}

function filterDataForUser(data: AppData, role: "parent" | "nanny"): AppData {
  if (role === "parent") {
    return data;
  }

  return {
    ...data,
    adminItems: [],
  };
}
