import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, validateSessionToken } from "./auth";
import type { AuthenticatedUser } from "./types";

type ApiSessionResult =
  | { user: AuthenticatedUser; response?: never }
  | { user?: never; response: NextResponse };

export async function requireApiSession(): Promise<ApiSessionResult> {
  const cookieStore = await cookies();
  const user = await validateSessionToken(cookieStore.get(SESSION_COOKIE)?.value);

  if (!user) {
    return {
      response: NextResponse.json(
        { error: "Sign in before accessing family data." },
        { status: 401 },
      ),
    };
  }

  return { user };
}
