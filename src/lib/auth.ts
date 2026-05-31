import type { AuthenticatedUser, UserName } from "./types";

export const SESSION_COOKIE = "family_nanny_session";

export const USERS: Record<UserName, AuthenticatedUser> = {
  Sean: {
    name: "Sean",
    email: "sean@example.local",
    role: "parent",
  },
  Tina: {
    name: "Tina",
    email: "tina@example.local",
    role: "parent",
  },
  Faith: {
    name: "Faith",
    email: "faith@example.local",
    role: "nanny",
  },
};

type SessionPayload = {
  user: UserName;
  email: string;
  exp: number;
};

const SESSION_DAYS = 14;

export function isUserName(value: unknown): value is UserName {
  return value === "Sean" || value === "Tina" || value === "Faith";
}

export function passwordEnvKey(user: UserName) {
  return `APP_PASSWORD_${user.toUpperCase()}`;
}

export function getExpectedPassword(user: UserName) {
  return process.env[passwordEnvKey(user)];
}

export async function createSessionToken(user: UserName) {
  const profile = USERS[user];
  const payload: SessionPayload = {
    user,
    email: profile.email,
    exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  };
  const encodedPayload = encodeJson(payload);
  const signature = await sign(encodedPayload);
  if (!signature) {
    throw new Error("APP_SESSION_SECRET or app password env vars must be configured.");
  }

  return `${encodedPayload}.${signature}`;
}

export async function validateSessionToken(token?: string) {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = await sign(encodedPayload);
  if (!expectedSignature || !safeEqual(signature, expectedSignature)) {
    return null;
  }

  const payload = decodeJson<SessionPayload>(encodedPayload);
  if (!payload || !isUserName(payload.user) || Date.now() > payload.exp) {
    return null;
  }

  return USERS[payload.user];
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  };
}

export function expiredSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}

function getSessionSecret() {
  const explicitSecret = process.env.APP_SESSION_SECRET?.trim();
  if (explicitSecret) {
    return explicitSecret;
  }

  const passwordBackedSecret = (["Sean", "Tina", "Faith"] as UserName[])
    .map((user) => getExpectedPassword(user)?.trim())
    .filter(Boolean)
    .join("|");

  if (passwordBackedSecret) {
    return passwordBackedSecret;
  }

  return process.env.NODE_ENV === "production"
    ? null
    : "development-only-change-this-session-secret-before-vercel";
}

async function sign(value: string) {
  const secret = getSessionSecret();
  if (!secret) {
    return null;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );
  return bytesToBase64Url(new Uint8Array(signature));
}

function encodeJson(value: unknown) {
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(value)));
}

function decodeJson<T>(value: string): T | null {
  try {
    const bytes = base64UrlToBytes(value);
    const text = new TextDecoder().decode(bytes);
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return mismatch === 0;
}
