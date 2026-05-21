export type ImportAiProvider = "gemini" | "openai-compatible" | "anthropic";

export interface ImportAiConfig {
  apiKey: string;
  model: string;
  baseURL: string;
  provider: ImportAiProvider;
}

const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-6";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

function detectProvider(
  model: string,
  apiKey: string,
  baseURL: string,
): ImportAiProvider {
  const m = model.toLowerCase();
  const url = baseURL.toLowerCase();

  if (url.includes("generativelanguage.googleapis.com") || m.startsWith("gemini")) {
    return "gemini";
  }
  if (apiKey.startsWith("AIza")) {
    return "gemini";
  }
  if (baseURL.length > 0) {
    return "openai-compatible";
  }
  if (m.startsWith("claude") || m.startsWith("anthropic")) {
    return "anthropic";
  }
  return "anthropic";
}

/** Reads AI_* env vars (ANTHROPIC_* names kept for backward compatibility). */
export function getImportAiConfig(): ImportAiConfig {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim() ?? "";
  const baseURL = process.env.ANTHROPIC_BASE_URL?.trim() ?? "";
  const model =
    process.env.ANTHROPIC_MODEL?.trim() ||
    (baseURL.includes("googleapis.com") ? DEFAULT_GEMINI_MODEL : DEFAULT_ANTHROPIC_MODEL);

  return {
    apiKey,
    model,
    baseURL,
    provider: detectProvider(model, apiKey, baseURL),
  };
}

export function getImportAiConfigLabel(config: ImportAiConfig): string {
  const via =
    config.provider === "gemini"
      ? "Google Gemini"
      : config.provider === "openai-compatible"
        ? "OpenAI-compatible API"
        : "Anthropic";
  return `${config.model} (${via})`;
}
