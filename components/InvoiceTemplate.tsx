import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 30 },
  header: { fontSize: 20, marginBottom: 20 },
  row: { display: "flex", flexDirection: "row", marginBottom: 5 },
  col: { flex: 1 },
});

interface InvoiceProps {
  invoice: any;
}

export function InvoiceTemplate({ invoice }: InvoiceProps) {
  const total =
    Number(invoice["Qty"] || 0) * Number(invoice["Price"] || 0);

  return (
    <Document>
      <Page style={styles.page}>
        <Text style={styles.header}>Invoice: {invoice["Invoice No"]}</Text>
        <Text>Client: {invoice["Client Name"]}</Text>
        <Text>Email: {invoice["Email"]}</Text>

        <View style={{ marginTop: 20 }}>
          <View style={styles.row}>
            <Text style={styles.col}>Service</Text>
            <Text style={styles.col}>Qty</Text>
            <Text style={styles.col}>Price</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.col}>{invoice["Service"]}</Text>
            <Text style={styles.col}>{invoice["Qty"]}</Text>
            <Text style={styles.col}>{invoice["Price"]}</Text>
          </View>
        </View>

        <Text style={{ marginTop: 20 }}>Total: ${total}</Text>
      </Page>
    </Document>
  );
}
