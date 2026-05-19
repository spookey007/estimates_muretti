import { Document, Page, Text, View } from "@react-pdf/renderer";
import {
  fullTemplateCsv,
  ITEM_COLUMNS,
  SAMPLE_ROWS,
  SETTINGS_ROWS,
  TEMPLATE_FILENAME,
} from "./column-guide-content";
import { pageBase as s } from "./pdf-brand";
import { PdfFooter, PdfHeader, PdfTable } from "./pdf-layout";

const mono = { fontFamily: "Courier", fontSize: 7.5, color: "#44403c", lineHeight: 1.35 };

export function ColumnGuidePdfDocument() {
  const templateText = fullTemplateCsv();

  return (
    <Document
      title="CSV Column Guide"
      author="Muretti"
      subject="muretti-estimate-template.csv"
    >
      <Page size="A4" style={s.page}>
        <View style={s.topRule} fixed />
        <PdfHeader docTitle="CSV Column Guide" docSub={TEMPLATE_FILENAME} />
        <PdfFooter note="Column reference for muretti-estimate-template.csv" />

        <Text style={s.paragraph}>
          This guide matches the downloadable CSV template line for line. Edit the
          file in Excel, then upload it on the Muretti portal.
        </Text>

        <Text style={s.sectionTitle}>Template file (exact copy)</Text>
        <View style={s.callout}>
          <Text style={mono}>{templateText}</Text>
        </View>

        <Text style={s.sectionTitle}>Settings rows (rows 1-5)</Text>
        <Text style={s.paragraph}>
          No header row. Column A = setting name, column B = value. Use these five
          rows exactly as named.
        </Text>
        <PdfTable
          monoFirstCol
          widths={["26%", "24%", "50%"]}
          rows={[
            ["Setting", "Sample value", "Allowed / notes"],
            ...SETTINGS_ROWS.map((r) => [r.name, r.example, r.description]),
          ]}
        />

        <Text style={s.sectionTitle}>measurement_basis</Text>
        <PdfTable
          widths={["22%", "78%"]}
          rows={[
            ["Value", "Effect"],
            ["finished", "Sizes used as entered"],
            ["panel", "Sizes from drawing"],
            ["opening", "Adds 10 mm to height and width before pricing"],
          ]}
        />

      </Page>

      <Page size="A4" style={s.page}>
        <View style={s.topRule} fixed />
        <PdfHeader docTitle="CSV Column Guide" docSub="Item columns" />
        <PdfFooter note="Column reference for muretti-estimate-template.csv" />

        <Text style={s.sectionTitle}>Item table (row 6 = header)</Text>
        <Text style={s.paragraph}>
          Row 6 must be this header exactly (same spelling and order):
        </Text>
        <View style={s.callout}>
          <Text style={mono}>{ITEM_COLUMNS.join(",")}</Text>
        </View>

        <PdfTable
          monoFirstCol
          widths={["22%", "10%", "68%"]}
          rows={[
            ["Column", "Req", "Description"],
            ["line_id", "Yes", "Line reference (L1, L2, ...)"],
            ["room", "No", "Room or area"],
            ["role", "Yes", "Part type - see roles table below"],
            ["quantity", "Yes", "Number of pieces"],
            ["height_mm", "*", "Height (alias h)"],
            ["width_mm", "*", "Width (alias l)"],
            ["depth_mm", "No", "Depth (alias d)"],
            ["side", "No", "corner_upright only: left or right"],
            ["depth_type", "No", "shelf only: 510 or 414"],
            ["notes", "No", "Optional; shown on estimate PDF"],
          ]}
        />
        <Text style={[s.paragraph, { fontSize: 8 }]}>* Required for some roles.</Text>

        <Text style={s.sectionTitle}>Sample item rows (rows 7-8 in template)</Text>
        <View style={s.callout}>
          <Text style={[mono, { marginBottom: 4 }]}>{ITEM_COLUMNS.join(",")}</Text>
          {SAMPLE_ROWS.map((r) => (
            <Text key={r.line_id} style={mono}>
              {[
                r.line_id,
                r.room,
                r.role,
                r.quantity,
                r.height_mm,
                r.width_mm,
                r.depth_mm,
                r.side,
                r.depth_type,
                r.notes,
              ].join(",")}
            </Text>
          ))}
        </View>

        <Text style={[s.paragraph, { marginTop: 8 }]}>
          L1: upright H 2187, qty 2 - code 1PC11F0, EUR 84 each. L2: back panel
          2187 x 640, qty 1 - code 1PN15F0, EUR 143. Add more rows by copying row 7
          or 8 and changing values.
        </Text>

      </Page>

      <Page size="A4" style={s.page}>
        <View style={s.topRule} fixed />
        <PdfHeader docTitle="CSV Column Guide" docSub="Roles and catalog sizes" />
        <PdfFooter note="Column reference for muretti-estimate-template.csv" />

        <Text style={s.sectionTitle}>Roles (role column)</Text>
        <PdfTable
          monoFirstCol
          widths={["24%", "76%"]}
          rows={[
            ["role", "Required fields"],
            ["upright", "height_mm"],
            ["corner_upright", "height_mm, side"],
            ["back_panel", "height_mm, width_mm"],
            ["linear_filler", "height_mm, width_mm (with_panels only)"],
            ["mirror", "height_mm, width_mm"],
            ["shelf", "width_mm; depth_type"],
            ["footboard", "width_mm"],
          ]}
        />

        <Text style={s.sectionTitle}>Standard catalog sizes (mm)</Text>
        <Text style={s.paragraph}>
          If your size is not listed, the next larger standard size is used.
        </Text>
        <PdfTable
          widths={["32%", "68%"]}
          rows={[
            ["Product", "Standard sizes"],
            ["Back panel H (with panels)", "2187, 2411, 2571, 2891"],
            ["Back panel L (with panels)", "480, 640, 800, 900"],
            ["Filler L (without panels)", "461, 621, 781, 881"],
            ["Shelf L", "483, 643, 803, 903"],
            ["Footboard length", "100-1000, 1001-1800, 1801-3000"],
          ]}
        />

        <Text style={s.sectionTitle}>Workflow</Text>
        <Text style={s.bullet}>1. Download {TEMPLATE_FILENAME} from the portal</Text>
        <Text style={s.bullet}>2. Edit settings (rows 1-5) and add item rows from row 7 onward</Text>
        <Text style={s.bullet}>3. Upload CSV and calculate estimate</Text>
        <Text style={s.bullet}>4. Download estimate PDF when ready</Text>
      </Page>
    </Document>
  );
}
