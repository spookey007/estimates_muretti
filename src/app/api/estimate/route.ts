import { buildEstimate } from "@/lib/engine/price";
import { parseCsvRequest } from "@/lib/parsers/parse-request";
import type { EstimateRequest } from "@/lib/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
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
    } else {
      return NextResponse.json(
        { error: "Upload a CSV file (multipart/form-data with field file)" },
        { status: 400 },
      );
    }

    const result = buildEstimate(request);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Estimate failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
