import { readFileSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";

export async function GET() {
  const path = join(
    process.cwd(),
    "..",
    "templates",
    "muretti-estimate-template.csv",
  );
  let csv: string;
  try {
    csv = readFileSync(path, "utf-8");
  } catch {
    csv = readFileSync(
      join(process.cwd(), "public", "muretti-estimate-template.csv"),
      "utf-8",
    );
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="muretti-estimate-template.csv"',
    },
  });
}
