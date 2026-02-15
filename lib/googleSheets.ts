import { google } from "googleapis";
import path from "path";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(process.cwd(), process.env.SERVICE_ACCOUNT_FILE!),
  scopes: SCOPES,
});

const sheets = google.sheets({ version: "v4", auth });

export async function getInvoices() {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID!;
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Sheet1!A:G",
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) return [];

  const headers = rows[0];
  return rows.slice(1).map((row) =>
    headers.reduce((acc, key, i) => {
      acc[key] = row[i];
      return acc;
    }, {} as Record<string, string>)
  );
}
