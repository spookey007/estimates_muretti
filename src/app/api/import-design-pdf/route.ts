import {
  getImportAiConfigLabel,
  importDesignPdfWithAi,
} from "@/lib/import/import-design-pdf-ai";
import { getImportAiConfig } from "@/lib/import/import-ai-config";
import { buildEstimate } from "@/lib/engine/price";
import { NextResponse } from "next/server";
import { withSecureApi } from "@/lib/api/secure-route";
import {
  importGetRateLimit,
  importPostRateLimit,
} from "@/lib/security/rate-limit-config";
import { getMaxPdfBytes } from "@/lib/security/import-limits";

export const runtime = "nodejs";
export const maxDuration = 120;

export const GET = withSecureApi(
  async () => {
    const config = getImportAiConfig();
    return NextResponse.json({
      model: config.model,
      provider: config.provider,
      provider_label: getImportAiConfigLabel(config),
      ...(process.env.NODE_ENV !== "production"
        ? { api_key_set: Boolean(config.apiKey) }
        : {}),
    });
  },
  {
    requireCsrf: false,
    rateLimit: importGetRateLimit.limit,
    windowSec: importGetRateLimit.windowSec,
  },
);

function pickEnum<T extends string>(
  value: FormDataEntryValue | null,
  allowed: readonly T[],
  fallback: T,
): T {
  if (!value || typeof value !== "string") return fallback;
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export const POST = withSecureApi(
  async (req) => {
    try {
      const form = await req.formData();
      const file = form.get("file");
      if (!file || typeof file === "string") {
        return NextResponse.json({ error: "Missing PDF file" }, { status: 400 });
      }

      const upload = file as File;
      const name = upload.name.toLowerCase();
      if (!name.endsWith(".pdf")) {
        return NextResponse.json(
          { error: "Only PDF design files are accepted" },
          { status: 400 },
        );
      }

      const maxBytes = getMaxPdfBytes();
      if (upload.size > maxBytes) {
        return NextResponse.json(
          {
            error: `PDF too large (max ${Math.round(maxBytes / (1024 * 1024))} MB)`,
          },
          { status: 413 },
        );
      }

      const userPrompt = String(form.get("prompt") ?? "");
      const buffer = Buffer.from(await upload.arrayBuffer());
      if (buffer.length > maxBytes) {
        return NextResponse.json({ error: "PDF too large" }, { status: 413 });
      }

      const settings = {
        project_name: String(form.get("project_name") || "").trim() || undefined,
        measurement_unit: pickEnum(
          form.get("measurement_unit"),
          ["mm", "cm", "in"] as const,
          "mm",
        ),
        measurement_basis: pickEnum(
          form.get("measurement_basis"),
          ["finished", "panel", "opening"] as const,
          "finished",
        ),
        system: pickEnum(
          form.get("system"),
          ["with_panels", "without_panels"] as const,
          "with_panels",
        ),
        finish: pickEnum(
          form.get("finish"),
          ["melamine", "lacquered"] as const,
          "melamine",
        ),
      };

      const importResult = await importDesignPdfWithAi({
        pdfBuffer: buffer,
        fileName: upload.name,
        userPrompt,
        settings,
      });

      let estimate;
      try {
        estimate = buildEstimate(importResult.request);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Pricing failed";
        return NextResponse.json(
          {
            error: `Lines imported but pricing failed: ${msg}`,
            request: importResult.request,
            warnings: importResult.warnings,
            closets: importResult.closets,
            model: importResult.model,
            usage: importResult.usage,
          },
          { status: 422 },
        );
      }

      const aiConfig = getImportAiConfig();
      return NextResponse.json({
        request: importResult.request,
        estimate,
        warnings: importResult.warnings,
        import_notes: importResult.import_notes,
        closets: importResult.closets,
        model: importResult.model,
        provider: aiConfig.provider,
        provider_label: getImportAiConfigLabel(aiConfig),
        usage: importResult.usage,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Import failed";
      const status = message.includes("ANTHROPIC_API_KEY is not set")
        ? 503
        : 400;
      return NextResponse.json({ error: message }, { status });
    }
  },
  {
    rateLimit: importPostRateLimit.limit,
    windowSec: importPostRateLimit.windowSec,
  },
);
