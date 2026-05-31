"use client";

import { Baby, HeartHandshake, Loader2, Lock, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { ActionButton } from "../ActionButton";
import type { UserName } from "@/lib/types";

const users: UserName[] = ["Tina", "Sean", "Faith"];

export function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<UserName>("Tina");
  const [email, setEmail] = useState("tinakharrington@gmail.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const nextPath = searchParams.get("next") ?? "/";
  const mode = useMemo(() => {
    if (user === "Faith") {
      return {
        title: "Faith's workday check-in",
        subtitle: "A calm view for notes, chores, supplies, and child status.",
        className: "border-[#9fd8a8] bg-[#edf8ed]",
        icon: Baby,
      };
    }

    if (user === "Tina") {
      return {
        title: "Tina command login",
        subtitle: "Voice-first parent access for turning quick thoughts into clear action.",
        className: "border-[#f5bf7d] bg-[#fff3df]",
        icon: HeartHandshake,
      };
    }

    return {
      title: "Sean parent login",
      subtitle: "Parent access for care notes, logistics, and dashboard updates.",
      className: "border-[#9cd2ef] bg-[#e8f6fc]",
      icon: ShieldCheck,
    };
  }, [user]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, email, password }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Login failed.");
      }
      router.push(nextPath);
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Login failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  const Icon = mode.icon;

  return (
    <main className="min-h-screen bg-[#f7f2e8] px-4 py-6 text-[#172033]">
      <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[1fr_0.85fr]">
        <section className={`rounded-3xl border p-5 shadow-sm ${mode.className}`}>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#2f83c5] shadow-sm">
              <Icon size={24} aria-hidden />
            </div>
            <div>
              <p className="text-sm font-black text-[#536076]">Family Nanny Hub</p>
              <h1 className="text-2xl font-black leading-tight">{mode.title}</h1>
            </div>
          </div>

          <p className="mb-6 max-w-xl text-base font-semibold leading-7 text-[#536076]">
            {mode.subtitle}
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            {users.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  setUser(name);
                  setEmail(name === "Tina" ? "tinakharrington@gmail.com" : "");
                  setError(null);
                }}
                className={`min-h-16 rounded-2xl border px-3 text-left font-black shadow-sm transition ${
                  user === name
                    ? "border-[#2f83c5] bg-white text-[#172033] ring-4 ring-[#9cd2ef]"
                    : "border-white/60 bg-white/65 text-[#536076] hover:bg-white"
                }`}
              >
                {name}
                <span className="block text-xs font-bold text-[#667085]">
                  {name === "Faith" ? "Nanny" : "Parent"}
                </span>
              </button>
            ))}
          </div>
        </section>

        <form
          onSubmit={submit}
          className="rounded-3xl border border-[#e8d7bd] bg-[#fffaf0] p-5 shadow-sm"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2f83c5] text-white">
              <Lock size={20} aria-hidden />
            </div>
            <div>
              <h2 className="text-xl font-black">Private access</h2>
              <p className="text-sm font-semibold text-[#667085]">
                {user === "Tina"
                  ? "Tina's email is prefilled."
                  : "Password gate for the selected user."}
              </p>
            </div>
          </div>

          {user === "Tina" ? (
            <label className="mb-4 block">
              <span className="mb-1 block text-sm font-black text-[#314057]">
                Email
              </span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                className="h-12 w-full rounded-2xl border border-[#dfd1bd] bg-white px-4 text-base font-semibold outline-none ring-[#2f83c5] focus:ring-4"
              />
            </label>
          ) : null}

          <label className="block">
            <span className="mb-1 block text-sm font-black text-[#314057]">
              Password
            </span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="current-password"
              className="h-12 w-full rounded-2xl border border-[#dfd1bd] bg-white px-4 text-base font-semibold outline-none ring-[#2f83c5] focus:ring-4"
            />
          </label>

          {error ? (
            <p className="mt-4 rounded-xl bg-[#fff0ee] px-3 py-2 text-sm font-bold text-[#b42318]">
              {error}
            </p>
          ) : null}

          <ActionButton
            className="mt-5 w-full"
            disabled={loading || password.trim().length === 0}
            type="submit"
          >
            {loading ? <Loader2 className="animate-spin" size={16} aria-hidden /> : null}
            Sign In
          </ActionButton>

          {user === "Faith" ? (
            <div className="mt-5 rounded-2xl border border-[#b8ddb9] bg-[#edf8ed] p-4">
              <h3 className="font-black text-[#245b2d]">Faith view</h3>
              <p className="mt-1 text-sm font-semibold leading-6 text-[#3a6b42]">
                This login is intentionally simpler and will become the nanny-facing
                workflow later.
              </p>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-[#f5bf7d] bg-[#fff3df] p-4">
              <h3 className="font-black text-[#7a4b12]">Parent view</h3>
              <p className="mt-1 text-sm font-semibold leading-6 text-[#7a4b12]">
                Parent access opens the dashboard with dictation, quick requests,
                and approvals before items go to Faith.
              </p>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}

