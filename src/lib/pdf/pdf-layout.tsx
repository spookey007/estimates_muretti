import { Text, View } from "@react-pdf/renderer";
import { pageBase as s } from "./pdf-brand";

export function PdfHeader({
  docTitle,
  docSub,
}: {
  docTitle: string;
  docSub?: string;
}) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 18 }}>
      <View>
        <Text style={s.brand}>MURETTI</Text>
        <Text style={s.brandSub}>Closet systems</Text>
      </View>
      <View>
        <Text style={s.docTitle}>{docTitle}</Text>
        {docSub ? <Text style={s.docSub}>{docSub}</Text> : null}
        <Text style={s.docSub}>SCENIKA list 10/2023</Text>
      </View>
    </View>
  );
}

export function PdfFooter({ note }: { note?: string }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>
        {note ?? "Muretti Estimate - indicative pricing, EUR excl. VAT"}
      </Text>
      <Text
        style={s.pageNum}
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages}`
        }
      />
    </View>
  );
}

export function PdfTable({
  widths,
  rows,
  monoFirstCol,
}: {
  widths: string[];
  rows: string[][];
  monoFirstCol?: boolean;
}) {
  const [head, ...body] = rows;
  return (
    <View>
      <View style={s.tableHead}>
        {head.map((cell, i) => (
          <Text key={i} style={[s.th, { width: widths[i] }]}>
            {cell}
          </Text>
        ))}
      </View>
      {body.map((row, ri) => (
        <View key={ri} style={[s.tr, ri % 2 === 1 ? s.trStripe : {}]}>
          {row.map((cell, i) => (
            <Text
              key={i}
              style={[
                i === 0 && monoFirstCol ? s.tdMono : s.td,
                { width: widths[i] },
              ]}
            >
              {cell}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}
