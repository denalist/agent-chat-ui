import { Client } from "@langchain/langgraph-sdk";

function normalizeApiUrl(apiUrl: string): string {
  if (!apiUrl) {
    return apiUrl;
  }

  if (/^https?:\/\//i.test(apiUrl)) {
    return apiUrl;
  }

  if (typeof window !== "undefined") {
    return new URL(apiUrl, window.location.origin).toString();
  }

  return apiUrl;
}

export function createClient(apiUrl: string, apiKey?: string) {
  return new Client({
    apiKey,
    apiUrl: normalizeApiUrl(apiUrl),
  });
}
