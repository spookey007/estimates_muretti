import type { EstimateResponse } from "@/lib/types";
import { safeFilename } from "./format";

export async function downloadEstimatePdf(result: EstimateResponse): Promise<void> {
  const [{ pdf }, { EstimatePdfDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./EstimatePdfDocument"),
  ]);

  const blob = await pdf(<EstimatePdfDocument data={result} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = safeFilename(result.project_name, result.estimate_id);
  link.click();
  URL.revokeObjectURL(url);
}
