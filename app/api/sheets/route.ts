// /app/api/sheets/route.tsx
import { NextResponse } from "next/server";
import Papa from "papaparse";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sheetInput = url.searchParams.get("sheetId");

  if (!sheetInput) return NextResponse.json({ data: [] });

  // Extract Sheet ID from full URL or plain ID
  const sheetIdMatch = sheetInput.includes("docs.google.com")
    ? sheetInput.match(/\/d\/([a-zA-Z0-9-_]+)/)
    : [null, sheetInput];

  const sheetId = sheetIdMatch ? sheetIdMatch[1] : null;
  if (!sheetId) return NextResponse.json({ data: [] });

  // Optional: support specific sheet tab (gid)
  const gidMatch = sheetInput.match(/gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : "0";

  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;

  try {
    const res = await fetch(csvUrl, { cache: "no-store" });
    if (!res.ok) throw new Error("Cannot fetch sheet");

    const csvText = await res.text();

    // Parse CSV without automatic headers
    const parsed = Papa.parse(csvText, { header: false });
    const rows = parsed.data as string[][];

    // Keep only rows that have at least one cell
    const filteredRows = rows.filter((row) => Array.isArray(row) && row.length > 0);

    if (filteredRows.length === 0) return NextResponse.json({ data: [] });

    // First row = headers (dynamic), fallback Column1, Column2, etc.
    const headers = filteredRows[0].map((h, i) =>
      h && h.toString().trim() !== "" ? h.toString().trim() : `Column${i + 1}`
    );

    // Map rows dynamically
    const data = filteredRows.slice(1).map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] !== undefined ? row[index].toString().trim() : "";
      });
      return obj;
    });

    return NextResponse.json({ data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({
      data: [],
      error: "Cannot read sheet. Make sure it is public (Anyone with link → Viewer).",
    });
  }
}
