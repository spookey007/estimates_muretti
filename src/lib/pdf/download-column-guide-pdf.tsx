import { ColumnGuidePdfDocument } from "./ColumnGuidePdfDocument";

export async function downloadColumnGuidePdf(): Promise<void> {
  const { pdf } = await import("@react-pdf/renderer");
  const blob = await pdf(<ColumnGuidePdfDocument />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "Muretti-CSV-Column-Guide.pdf";
  link.click();
  URL.revokeObjectURL(url);
}
