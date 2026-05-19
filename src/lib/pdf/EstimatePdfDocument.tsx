import type { EstimateResponse } from "@/lib/types";

import {

  Document,

  Page,

  StyleSheet,

  Text,

  View,

} from "@react-pdf/renderer";

import {

  formatDimensions,

  formatMoney,

  projectMeta,

  roleLabel,

} from "./format";



const c = {

  ink: "#1c1917",

  body: "#44403c",

  muted: "#78716c",

  rule: "#d6d3d1",

  ruleDark: "#a8a29e",

  headerBg: "#292524",

  stripe: "#fafaf9",

  paper: "#ffffff",

  accent: "#6b5c4d",

};



const styles = StyleSheet.create({

  page: {

    fontFamily: "Helvetica",

    fontSize: 9,

    color: c.body,

    paddingTop: 48,

    paddingBottom: 56,

    paddingHorizontal: 48,

    backgroundColor: c.paper,

  },

  topRule: {

    position: "absolute",

    top: 0,

    left: 0,

    right: 0,

    height: 6,

    backgroundColor: c.accent,

  },

  headerRow: {

    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "flex-start",

    marginBottom: 20,

  },

  brand: {

    fontSize: 20,

    fontFamily: "Helvetica-Bold",

    color: c.ink,

    letterSpacing: 1.2,

  },

  brandSub: {

    fontSize: 8,

    color: c.muted,

    marginTop: 4,

    letterSpacing: 0.3,

  },

  docTitle: {

    fontSize: 11,

    fontFamily: "Helvetica-Bold",

    color: c.ink,

    textAlign: "right",

  },

  docSub: {

    fontSize: 8,

    color: c.muted,

    textAlign: "right",

    marginTop: 3,

  },

  metaGrid: {

    flexDirection: "row",

    marginBottom: 16,

    gap: 24,

  },

  metaCol: {

    flex: 1,

  },

  metaLabel: {

    fontSize: 7,

    color: c.muted,

    textTransform: "uppercase",

    letterSpacing: 0.8,

    marginBottom: 4,

  },

  metaValue: {

    fontSize: 10,

    color: c.ink,

    fontFamily: "Helvetica-Bold",

  },

  metaValueSm: {

    fontSize: 9,

    color: c.body,

    marginTop: 2,

  },

  specBar: {

    flexDirection: "row",

    borderTopWidth: 1,

    borderBottomWidth: 1,

    borderColor: c.rule,

    paddingVertical: 8,

    paddingHorizontal: 4,

    marginBottom: 18,

    gap: 20,

  },

  specItem: {

    flexDirection: "row",

    gap: 6,

  },

  specKey: {

    fontSize: 7,

    color: c.muted,

    textTransform: "uppercase",

  },

  specVal: {

    fontSize: 8,

    color: c.ink,

  },

  tableHead: {

    flexDirection: "row",

    backgroundColor: c.headerBg,

    paddingVertical: 7,

    paddingHorizontal: 6,

  },

  th: {

    fontSize: 7,

    color: "#fafaf9",

    fontFamily: "Helvetica-Bold",

    textTransform: "uppercase",

    letterSpacing: 0.5,

  },

  row: {

    flexDirection: "row",

    borderBottomWidth: 1,

    borderBottomColor: c.rule,

    paddingVertical: 8,

    paddingHorizontal: 6,

    minHeight: 32,

  },

  rowStripe: {

    backgroundColor: c.stripe,

  },

  cellLine: { width: "6%" },

  cellDesc: { width: "30%" },

  cellDim: { width: "16%" },

  cellCode: { width: "14%" },

  cellQty: { width: "6%", textAlign: "right" },

  cellUnit: { width: "12%", textAlign: "right" },

  cellTotal: { width: "12%", textAlign: "right" },

  descMain: {

    fontSize: 9,

    color: c.ink,

    fontFamily: "Helvetica-Bold",

  },

  descSub: {

    fontSize: 7.5,

    color: c.muted,

    marginTop: 2,

  },

  dimText: { fontSize: 8, color: c.body },

  codeText: {

    fontSize: 8,

    color: c.body,

    fontFamily: "Courier",

  },

  money: { fontSize: 9, color: c.ink },

  totalsWrap: {

    flexDirection: "row",

    justifyContent: "flex-end",

    marginTop: 14,

  },

  totalsBox: {

    width: 220,

    borderTopWidth: 2,

    borderTopColor: c.ink,

    paddingTop: 10,

  },

  totalRow: {

    flexDirection: "row",

    justifyContent: "space-between",

    marginBottom: 5,

  },

  totalLabel: { fontSize: 9, color: c.body },

  totalGrandLabel: {

    fontSize: 10,

    fontFamily: "Helvetica-Bold",

    color: c.ink,

    marginTop: 6,

  },

  totalGrandValue: {

    fontSize: 12,

    fontFamily: "Helvetica-Bold",

    color: c.ink,

    marginTop: 6,

  },

  vatNote: {

    fontSize: 7.5,

    color: c.muted,

    marginTop: 6,

    textAlign: "right",

  },

  notesBox: {

    marginTop: 20,

    padding: 10,

    borderWidth: 1,

    borderColor: c.rule,

  },

  notesTitle: {

    fontSize: 8,

    fontFamily: "Helvetica-Bold",

    color: c.ink,

    marginBottom: 6,

  },

  noteLine: {

    fontSize: 7.5,

    color: c.body,

    marginBottom: 3,

    lineHeight: 1.4,

  },

  footer: {

    position: "absolute",

    bottom: 28,

    left: 48,

    right: 48,

    borderTopWidth: 1,

    borderTopColor: c.rule,

    paddingTop: 8,

    flexDirection: "row",

    justifyContent: "space-between",

  },

  footerText: {

    fontSize: 7,

    color: c.muted,

    maxWidth: "70%",

    lineHeight: 1.35,

  },

  pageNum: {

    fontSize: 7,

    color: c.muted,

  },

});



function TableHeader() {

  return (

    <View style={styles.tableHead}>

      <Text style={[styles.th, styles.cellLine]}>#</Text>

      <Text style={[styles.th, styles.cellDesc]}>Description</Text>

      <Text style={[styles.th, styles.cellDim]}>Size</Text>

      <Text style={[styles.th, styles.cellCode]}>Code</Text>

      <Text style={[styles.th, styles.cellQty]}>Qty</Text>

      <Text style={[styles.th, styles.cellUnit]}>Unit</Text>

      <Text style={[styles.th, styles.cellTotal]}>Amount</Text>

    </View>

  );

}



export function EstimatePdfDocument({ data }: { data: EstimateResponse }) {

  const meta = projectMeta(data);

  const currency = data.currency || "EUR";



  return (

    <Document

      title={`Estimate ${meta.quoteRef}`}

      author="Muretti"

      subject={data.project_name}

    >

      <Page size="A4" style={styles.page}>

        <View style={styles.topRule} fixed />



        <View style={styles.headerRow} fixed>

          <View>

            <Text style={styles.brand}>MURETTI</Text>

            <Text style={styles.brandSub}>Closet systems  indicative estimate</Text>

          </View>

          <View>

            <Text style={styles.docTitle}>Estimate</Text>

            <Text style={styles.docSub}>{meta.quoteRef}</Text>

            <Text style={styles.docSub}>{meta.date}</Text>

          </View>

        </View>



        <View style={styles.metaGrid}>

          <View style={styles.metaCol}>

            <Text style={styles.metaLabel}>Project</Text>

            <Text style={styles.metaValue}>{data.project_name}</Text>

          </View>

          <View style={styles.metaCol}>

            <Text style={styles.metaLabel}>Reference</Text>

            <Text style={styles.metaValue}>{meta.quoteRef}</Text>

            <Text style={styles.metaValueSm}>List: {meta.list}</Text>

          </View>

        </View>



        <View style={styles.specBar}>

          <View style={styles.specItem}>

            <Text style={styles.specKey}>System</Text>

            <Text style={styles.specVal}>{meta.system}</Text>

          </View>

          <View style={styles.specItem}>

            <Text style={styles.specKey}>Finish</Text>

            <Text style={styles.specVal}>{meta.finish}</Text>

          </View>

          <View style={styles.specItem}>

            <Text style={styles.specKey}>Measurements</Text>

            <Text style={styles.specVal}>{meta.basis}</Text>

          </View>

          <View style={styles.specItem}>

            <Text style={styles.specKey}>Confidence</Text>

            <Text style={styles.specVal}>{data.overall_confidence}</Text>

          </View>

        </View>



        <TableHeader />



        {data.lines.map((line, i) => (

          <View

            key={line.line_id}

            style={[styles.row, i % 2 === 1 ? styles.rowStripe : {}]}

            wrap={false}

          >

            <Text style={[styles.dimText, styles.cellLine]}>{line.line_id}</Text>

            <View style={styles.cellDesc}>

              <Text style={styles.descMain}>{roleLabel(line.role)}</Text>

              <Text style={styles.descSub}>
                {[line.room, line.description].filter(Boolean).join(" | ")}
                {line.accuracy === "snapped" ? " | catalog size applied" : ""}
              </Text>

            </View>

            <Text style={[styles.dimText, styles.cellDim]}>

              {formatDimensions(line)}

            </Text>

            <Text style={[styles.codeText, styles.cellCode]}>{line.code}</Text>

            <Text style={[styles.money, styles.cellQty]}>{line.quantity}</Text>

            <Text style={[styles.money, styles.cellUnit]}>

              {formatMoney(line.unit_price, currency)}

            </Text>

            <Text style={[styles.money, styles.cellTotal]}>

              {formatMoney(line.line_total, currency)}

            </Text>

          </View>

        ))}



        <View style={styles.totalsWrap}>

          <View style={styles.totalsBox}>

            <View style={styles.totalRow}>

              <Text style={styles.totalLabel}>Structural</Text>

              <Text style={styles.totalLabel}>

                {formatMoney(data.subtotals.structural ?? 0, currency)}

              </Text>

            </View>

            <View style={styles.totalRow}>

              <Text style={styles.totalLabel}>Equipment</Text>

              <Text style={styles.totalLabel}>

                {formatMoney(data.subtotals.equipment ?? 0, currency)}

              </Text>

            </View>

            <View style={styles.totalRow}>

              <Text style={styles.totalGrandLabel}>Total net</Text>

              <Text style={styles.totalGrandValue}>

                {formatMoney(data.total_net, currency)}

              </Text>

            </View>

            <Text style={styles.vatNote}>Prices exclude VAT  SCENIKA supplier list</Text>

          </View>

        </View>



        {data.warnings.length > 0 && (

          <View style={styles.notesBox}>

            <Text style={styles.notesTitle}>Sizing notes</Text>

            {data.warnings.slice(0, 12).map((w, i) => (

              <Text key={i} style={styles.noteLine}>

                {w}

              </Text>

            ))}

            {data.warnings.length > 12 && (

              <Text style={styles.noteLine}>

                + {data.warnings.length - 12} additional notes on file

              </Text>

            )}

          </View>

        )}



        <View style={styles.footer} fixed>

          <Text style={styles.footerText}>{data.disclaimer}</Text>

          <Text

            style={styles.pageNum}

            render={({ pageNumber, totalPages }) =>

              `Page ${pageNumber} of ${totalPages}`

            }

          />

        </View>

      </Page>

    </Document>

  );

}

