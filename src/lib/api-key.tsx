export function getApiKey(): string | null {
  try {
    // First try to get from environment variable (server-side)
    if (process.env.LANGSMITH_API_KEY) {
      return process.env.LANGSMITH_API_KEY;
    }
    
    // Then try localStorage (client-side fallback)
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("lg:chat:apiKey") ?? null;
    }
  } catch {
    // no-op
  }

  return null;
}
