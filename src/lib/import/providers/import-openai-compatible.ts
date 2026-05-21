import OpenAI from "openai";
import type { ImportAiConfig } from "@/lib/import/import-ai-config";
import {
  assertApiKey,
  assertPdfSize,
  buildImportMessages,
  parseModelJsonToEstimate,
  type ImportDesignPdfOptions,
} from "@/lib/import/import-design-pdf-shared";
import type { DesignPdfImportResult } from "@/lib/import/design-pdf-types";

function openAiErrorMessage(err: unknown): string {
  if (err instanceof OpenAI.APIError) {
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "OpenAI-compatible import failed";
}

export async function importDesignPdfWithOpenAiCompatible(
  config: ImportAiConfig,
  options: ImportDesignPdfOptions,
): Promise<DesignPdfImportResult> {
  assertApiKey(config.apiKey);
  assertPdfSize(options.pdfBuffer);

  if (!config.baseURL) {
    throw new Error("ANTHROPIC_BASE_URL is required for OpenAI-compatible providers");
  }

  const { system, user } = buildImportMessages(options);
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });

  const pdfBase64 = options.pdfBuffer.toString("base64");
  let completion;
  try {
    completion = await client.chat.completions.create({
      model: config.model,
      max_tokens: 16_384,
      temperature: 0,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: [
            {
              type: "file",
              file: {
                filename: options.fileName,
                file_data: `data:application/pdf;base64,${pdfBase64}`,
              },
            } as OpenAI.Chat.Completions.ChatCompletionContentPart,
            { type: "text", text: user },
          ],
        },
      ],
    });
  } catch (err) {
    const msg = openAiErrorMessage(err);
    if (msg.includes("file") || msg.includes("unsupported") || msg.includes("400")) {
      throw new Error(
        `${msg} — This endpoint may not accept PDF. Use Gemini (googleapis.com base URL + gemini model) or Anthropic Claude without ANTHROPIC_BASE_URL.`,
      );
    }
    throw new Error(msg);
  }

  const text = completion.choices[0]?.message?.content;
  if (!text || typeof text !== "string") {
    throw new Error("No text response from model");
  }

  return parseModelJsonToEstimate(text, options, config.model, completion.usage
    ? {
        input_tokens: completion.usage.prompt_tokens ?? 0,
        output_tokens: completion.usage.completion_tokens ?? 0,
      }
    : undefined);
}
