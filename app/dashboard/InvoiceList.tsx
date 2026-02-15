"use client";
import { useState } from "react";

export default function SheetViewer() {
  const [sheetInput, setSheetInput] = useState("");
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const extractSheetId = (input: string) => {
    if (input.includes("docs.google.com")) {
      const match = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
      return match ? match[1] : "";
    }
    return input;
  };

  const fetchSheet = async () => {
    if (!sheetInput) return;
    const sheetId = extractSheetId(sheetInput);
    if (!sheetId) {
      alert("Invalid Google Sheet link");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/sheets?sheetId=${sheetId}`);
      if (!res.ok) throw new Error("Failed to fetch sheet");

      const data = await res.json();
      setRows(data.data || []); // <-- use 'data' instead of 'invoices'
      setLoaded(true);
    } catch (err) {
      console.error(err);
      alert("Error loading sheet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 font-sans text-gray-900">
      <div className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-black">
          Sheet Viewer & PDF
        </h1>

        <div className="mb-6 flex">
          <input
            type="text"
            placeholder="Paste Google Sheet link or ID"
            value={sheetInput}
            onChange={(e) => setSheetInput(e.target.value)}
            className="border border-gray-300 p-3 mr-2 rounded w-full text-base text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <button
            onClick={fetchSheet}
            className="px-5 py-3 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition"
          >
            {loading ? "Loading..." : "Load"}
          </button>
        </div>

        {loaded && rows.length === 0 && (
          <p className="text-center text-gray-700 text-base">
            No data found.
          </p>
        )}

        {rows.length > 0 && (
          <table className="w-full border-collapse border border-gray-300 mt-4">
            <thead>
              <tr>
                {Object.keys(rows[0]).map((header) => (
                  <th key={header} className="border border-gray-300 p-2 text-left">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((value, j) => (
                    <td key={j} className="border border-gray-300 p-2">
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
