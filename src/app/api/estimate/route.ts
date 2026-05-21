import { buildEstimate } from "@/lib/engine/price";
import { parseCsvRequest } from "@/lib/parsers/parse-request";
import type { EstimateRequest } from "@/lib/types";
import { NextResponse } from "next/server";
import { withSecureApi } from "@/lib/api/secure-route";

export const runtime = "nodejs";

export const POST = withSecureApi(async (req) => {
  try {
    const contentType = req.headers.get("content-type") || "";
    let request: EstimateRequest;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!file || typeof file === "string") {
        return NextResponse.json(
          { error: "Missing file field in form" },
          { status: 400 },
        );
      }
      const text = await (file as File).text();
      const name = (file as File).name.toLowerCase();
      if (!name.endsWith(".csv")) {
        return NextResponse.json(
          { error: "Only CSV files are accepted. Use muretti-estimate-template.csv" },
          { status: 400 },
        );
      }
      const meta: Partial<EstimateRequest> = {
        project_name: String(form.get("project_name") || ""),
        measurement_unit:
          (form.get("measurement_unit") as EstimateRequest["measurement_unit"]) ||
          undefined,
        measurement_basis:
          (form.get("measurement_basis") as EstimateRequest["measurement_basis"]) ||
          undefined,
        system:
          (form.get("system") as EstimateRequest["system"]) || undefined,
        finish: (form.get("finish") as EstimateRequest["finish"]) || undefined,
        price_list_id: String(form.get("price_list_id") || "scenika-2023-10"),
      };
      request = parseCsvRequest(text, meta);
    } else if (contentType.includes("application/json")) {
      const body = (await req.json()) as EstimateRequest;
      if (!body.project_name || !body.lines?.length) {
        return NextResponse.json(
          { error: "JSON body must include project_name and lines[]" },
          { status: 400 },
        );
      }
      request = {
        schema_version: body.schema_version || "1.0",
        project_name: body.project_name,
        price_list_id: body.price_list_id || "scenika-2023-10",
        measurement_unit: body.measurement_unit || "mm",
        measurement_basis: body.measurement_basis || "finished",
        system: body.system || "with_panels",
        finish: body.finish || "melamine",
        currency_display: body.currency_display || "EUR",
        lines: body.lines,
      };
    } else {
      return NextResponse.json(
        {
          error:
            "Upload CSV (multipart file) or POST application/json EstimateRequest",
        },
        { status: 400 },
      );
    }

    const result = buildEstimate(request);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Estimate failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
});
