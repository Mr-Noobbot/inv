import { NextResponse } from "next/server";
import { google } from "googleapis";
import path from "path";
import { pdf } from "@react-pdf/renderer";
import { InvoiceTemplate } from "@/components/InvoiceTemplate";

async function fetchInvoices(sheetId: string) {
  const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(process.cwd(), process.env.SERVICE_ACCOUNT_FILE!),
    scopes: SCOPES,
  });
  const sheets = google.sheets({ version: "v4", auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "Sheet1!A:G",
  });

  const rows = response.data.values || [];
  if (!rows.length) return [];

  const headers = rows[0];
  return rows.slice(1).map((row) =>
    headers.reduce((acc, key, i) => {
      acc[key] = row[i];
      return acc;
    }, {} as Record<string, string>)
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sheetId = url.searchParams.get("sheetId")!;
  const invoiceNo = url.searchParams.get("invoiceNo");

  const invoices = await fetchInvoices(sheetId);
  const invoice = invoices.find(inv => inv["Invoice No"] === invoiceNo) || invoices[0];

  const buffer = await pdf(<InvoiceTemplate invoice={invoice} />).toBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=invoice-${invoice["Invoice No"]}.pdf`,
    },
  });
}
