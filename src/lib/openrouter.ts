type OpenRouterMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function callOpenRouterJson<T>({
  messages,
  fallbackModel = process.env.OPENROUTER_MODEL ?? "openai/gpt-4.1-mini",
  maxTokens = 1200,
}: {
  messages: OpenRouterMessage[];
  fallbackModel?: string;
  maxTokens?: number;
}): Promise<T> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  const requestBody = JSON.stringify({
    model: fallbackModel,
    messages,
    temperature: 0.2,
    max_tokens: maxTokens,
    response_format: { type: "json_object" },
  });

  const response = await fetchWithRetry("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.APP_PUBLIC_URL ?? "http://localhost:3000",
      "X-Title": "Family Nanny Hub",
    },
    body: requestBody,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const detail =
      payload?.error?.message ?? `OpenRouter request failed (${response.status}).`;
    throw new Error(detail);
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("OpenRouter returned an empty response.");
  }

  return parseJsonContent<T>(content);
}

async function fetchWithRetry(url: string, init: RequestInit) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      return await fetch(url, init);
    } catch (error) {
      lastError = error;
      if (attempt === 2) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("OpenRouter request failed.");
}

function parseJsonContent<T>(content: string): T {
  try {
    return JSON.parse(content) as T;
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("AI response was not valid JSON.");
    }
    return JSON.parse(match[0]) as T;
  }
}
