import { getImportAiConfig } from "@/lib/import/import-ai-config";
import type { ImportDesignPdfOptions } from "@/lib/import/import-design-pdf-shared";
import { runAnthropicDesignPdfImport } from "@/lib/import/providers/import-anthropic";
import { importDesignPdfWithGemini } from "@/lib/import/providers/import-gemini";
import { importDesignPdfWithOpenAiCompatible } from "@/lib/import/providers/import-openai-compatible";
import type { DesignPdfImportResult } from "@/lib/import/design-pdf-types";

export { getImportAiConfig, getImportAiConfigLabel } from "@/lib/import/import-ai-config";

/** Model from env (ANTHROPIC_MODEL). */
export function getConfiguredImportModel(): string {
  return getImportAiConfig().model;
}

export async function importDesignPdfWithAi(
  options: ImportDesignPdfOptions,
): Promise<DesignPdfImportResult> {
  const config = getImportAiConfig();

  switch (config.provider) {
    case "gemini":
      return importDesignPdfWithGemini(config, options);
    case "openai-compatible":
      return importDesignPdfWithOpenAiCompatible(config, options);
    case "anthropic":
      return runAnthropicDesignPdfImport(config, options);
    default:
      return runAnthropicDesignPdfImport(config, options);
  }
}
