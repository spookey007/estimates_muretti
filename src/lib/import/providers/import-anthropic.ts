import Anthropic from "@anthropic-ai/sdk";
import type { ImportAiConfig } from "@/lib/import/import-ai-config";
import {
  assertApiKey,
  assertPdfSize,
  buildImportMessages,
  parseModelJsonToEstimate,
  type ImportDesignPdfOptions,
} from "@/lib/import/import-design-pdf-shared";
import type { DesignPdfImportResult } from "@/lib/import/design-pdf-types";

function anthropicErrorMessage(err: unknown): string {
  if (err instanceof Anthropic.APIError) {
    const body = err.error;
    const detail =
      body && typeof body === "object" && "error" in body
        ? (body as { error?: { message?: string } }).error?.message
        : undefined;
    return detail ?? err.message;
  }
  if (err instanceof Error) return err.message;
  return "Anthropic import failed";
}

export async function runAnthropicDesignPdfImport(
  config: ImportAiConfig,
  options: ImportDesignPdfOptions,
): Promise<DesignPdfImportResult> {
  assertApiKey(config.apiKey);
  assertPdfSize(options.pdfBuffer);

  const { system, user } = buildImportMessages(options);
  const client = new Anthropic({ apiKey: config.apiKey });
  const base64 = options.pdfBuffer.toString("base64");

  let message;
  try {
    message = await client.messages.create({
      model: config.model,
      max_tokens: 16_384,
      temperature: 0,
      system,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64,
              },
            },
            { type: "text", text: user },
          ],
        },
      ],
    });
  } catch (err) {
    throw new Error(anthropicErrorMessage(err));
  }

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  return parseModelJsonToEstimate(textBlock.text, options, config.model, {
    input_tokens: message.usage.input_tokens,
    output_tokens: message.usage.output_tokens,
  });
}
