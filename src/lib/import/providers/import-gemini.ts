import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ImportAiConfig } from "@/lib/import/import-ai-config";
import {
  assertApiKey,
  assertPdfSize,
  buildImportMessages,
  parseModelJsonToEstimate,
  type ImportDesignPdfOptions,
} from "@/lib/import/import-design-pdf-shared";
import type { DesignPdfImportResult } from "@/lib/import/design-pdf-types";

function geminiErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Gemini import failed";
}

export async function importDesignPdfWithGemini(
  config: ImportAiConfig,
  options: ImportDesignPdfOptions,
): Promise<DesignPdfImportResult> {
  assertApiKey(config.apiKey);
  assertPdfSize(options.pdfBuffer);

  const { system, user } = buildImportMessages(options);
  const genAI = new GoogleGenerativeAI(config.apiKey);
  const model = genAI.getGenerativeModel({
    model: config.model,
    systemInstruction: system,
  });

  let response;
  try {
    response = await model.generateContent([
      {
        inlineData: {
          mimeType: "application/pdf",
          data: options.pdfBuffer.toString("base64"),
        },
      },
      { text: user },
    ]);
  } catch (err) {
    throw new Error(geminiErrorMessage(err));
  }

  const text = response.response.text();
  if (!text?.trim()) {
    throw new Error("Empty response from Gemini");
  }

  const usageMeta = response.response.usageMetadata;
  return parseModelJsonToEstimate(text, options, config.model, usageMeta
    ? {
        input_tokens: usageMeta.promptTokenCount ?? 0,
        output_tokens: usageMeta.candidatesTokenCount ?? 0,
      }
    : undefined);
}
