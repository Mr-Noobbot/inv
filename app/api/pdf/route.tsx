// /app/api/pdf/route.tsx
import { NextResponse } from "next/server";
import { pdf, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 20 },
  headerRow: { flexDirection: "row", marginBottom: 5 },
  row: { flexDirection: "row", marginBottom: 2 },
  cell: { marginRight: 10, fontSize: 10 },
  headerCell: { marginRight: 10, fontSize: 12, fontWeight: "bold" },
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = body.data as Record<string, string>[] || [];

    if (data.length === 0)
      return NextResponse.json({ error: "No data provided for PDF" });

    const headers = Object.keys(data[0]);

    const doc = (
      <Document>
        <Page size="A4" style={styles.page}>
          {/* Table Headers */}
          <View style={styles.headerRow}>
            {headers.map((header) => (
              <Text key={header} style={styles.headerCell}>
                {header}
              </Text>
            ))}
          </View>

          {/* Table Rows */}
          {data.map((row, i) => (
            <View key={i} style={styles.row}>
              {headers.map((header) => (
                <Text key={header} style={styles.cell}>
                  {row[header]}
                </Text>
              ))}
            </View>
          ))}
        </Page>
      </Document>
    );

    const buffer = await pdf(doc).toBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=data.pdf",
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to generate PDF" });
  }
}
