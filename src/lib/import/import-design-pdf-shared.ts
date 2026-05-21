import {
  buildDesignPdfSystemPrompt,
  buildDesignPdfUserMessage,
  type ImportPromptSettings,
} from "@/lib/import/design-pdf-prompt";
import { designImportToEstimateRequest } from "@/lib/import/parse-design-import";
import type { DesignPdfImportResult } from "@/lib/import/design-pdf-types";
import {
  extractJsonFromModelText,
  parseDesignPdfPayload,
} from "@/lib/import/parse-design-import";

export const MAX_PDF_BYTES = 32 * 1024 * 1024;

export type ImportDesignPdfOptions = {
  pdfBuffer: Buffer;
  fileName: string;
  userPrompt: string;
  settings: ImportPromptSettings;
};

export function assertPdfSize(pdfBuffer: Buffer): void {
  if (pdfBuffer.length > MAX_PDF_BYTES) {
    throw new Error(
      `PDF too large (${(pdfBuffer.length / 1024 / 1024).toFixed(1)} MB). Max 32 MB.`,
    );
  }
}

export function assertApiKey(apiKey: string): void {
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add your API key to web/.env (see web/.env.example).",
    );
  }
}

export function buildImportMessages(
  options: ImportDesignPdfOptions,
): { system: string; user: string } {
  return {
    system: buildDesignPdfSystemPrompt(),
    user: buildDesignPdfUserMessage(
      options.userPrompt,
      options.settings,
      options.fileName,
    ),
  };
}

export function parseModelJsonToEstimate(
  text: string,
  options: ImportDesignPdfOptions,
  model: string,
  usage?: { input_tokens: number; output_tokens: number },
): DesignPdfImportResult {
  const raw = extractJsonFromModelText(text);
  const payload = parseDesignPdfPayload(raw);
  const result = designImportToEstimateRequest(payload, {
    measurement_unit: options.settings.measurement_unit,
    measurement_basis: options.settings.measurement_basis,
    system: options.settings.system,
    finish: options.settings.finish,
    project_name:
      options.settings.project_name?.trim() || payload.project_name.trim(),
  });
  result.model = model;
  if (usage) result.usage = usage;
  if (result.import_notes) {
    result.warnings.unshift(`Import notes: ${result.import_notes}`);
  }
  return result;
}
