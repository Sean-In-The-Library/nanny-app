import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, validateSessionToken } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const user = await validateSessionToken(cookieStore.get(SESSION_COOKIE)?.value);

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}

