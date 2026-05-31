import { NextResponse } from "next/server";
import {
  createSessionToken,
  getExpectedPassword,
  isUserName,
  sessionCookieOptions,
  SESSION_COOKIE,
  USERS,
} from "@/lib/auth";
import { loginSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success || !isUserName(parsed.data.user)) {
    return NextResponse.json(
      { error: "Choose a user and enter the password." },
      { status: 400 },
    );
  }

  const { user, password } = parsed.data;
  const expectedPassword = getExpectedPassword(user);

  if (!expectedPassword) {
    return NextResponse.json(
      { error: `Missing ${user} password environment variable.` },
      { status: 500 },
    );
  }

  if (!safePasswordEquals(password, expectedPassword)) {
    return NextResponse.json(
      { error: "That password did not work." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ user: USERS[user] });
  response.cookies.set(
    SESSION_COOKIE,
    await createSessionToken(user),
    sessionCookieOptions(),
  );
  return response;
}

function safePasswordEquals(a: string, b: string) {
  if (a.length !== b.length) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return mismatch === 0;
}
