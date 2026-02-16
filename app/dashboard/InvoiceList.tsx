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
      setRows(data.data || []);
      setLoaded(true);
    } catch (err) {
      console.error(err);
      alert("Error loading sheet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 px-4 font-sans text-gray-900">
      <div className="w-full max-w-4xl bg-white p-10 rounded-3xl shadow-2xl">

        {/* Title */}
        <h1 className="text-3xl font-bold mb-8 text-center text-green-700">
          Invoice Viewer
        </h1>

        {/* Input Section */}
        <div className="mb-8 flex gap-3">
          <input
            type="text"
            placeholder="Paste Google Sheet link or ID"
            value={sheetInput}
            onChange={(e) => setSheetInput(e.target.value)}
            className="border border-green-300 p-3 rounded-xl w-full text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={fetchSheet}
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition duration-200 shadow-md"
          >
            {loading ? "Loading..." : "Load"}
          </button>
        </div>

        {/* No Data Message */}
        {loaded && rows.length === 0 && (
          <p className="text-center text-gray-600 text-base">
            No data found.
          </p>
        )}

        {/* Invoice Content */}
        {rows.length > 0 && (
          <>
            {/* Invoice Header */}
            <div className="mb-6 flex justify-between">
              {/* From Section */}
              <div className="text-gray-700">
                <h3 className="font-semibold text-lg mb-1">From:</h3>
                <p>Your Company</p>
                <p>123 Business St.</p>
                <p>email@company.com</p>
              </div>

              {/* To Section */}
              <div className="text-gray-700 text-right">
                <h3 className="font-semibold text-lg mb-1">To:</h3>
                <p>Client Name</p>
                <p>456 Client Rd.</p>
                <p>client@email.com</p>
                <p className="mt-2">Invoice #: 001</p>
                <p>Date: 2026-02-16</p>
              </div>
            </div>

            {/* Green Styled Table */}
            <div className="overflow-x-auto rounded-2xl border border-green-200 shadow-sm">
              <table className="min-w-full text-sm text-left">

                {/* Header */}
                <thead className="bg-green-100 text-green-800 uppercase text-xs tracking-wider">
                  <tr>
                    {Object.keys(rows[0]).map((header) => (
                      <th
                        key={header}
                        className="px-6 py-4 font-semibold border-b border-green-200"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Body */}
                <tbody className="divide-y divide-green-100">
                  {rows.map((row, i) => (
                    <tr
                      key={i}
                      className="hover:bg-green-50 transition duration-150"
                    >
                      {Object.values(row).map((value, j) => (
                        <td
                          key={j}
                          className="px-6 py-4 text-gray-800 whitespace-nowrap"
                        >
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>

            {/* Footer Buttons */}
            <div className="mt-6 flex justify-between items-center">
              {/* Left: Download PDF */}
              <button
                className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition duration-200 shadow-md"
                onClick={() => alert("Download PDF clicked")}
              >
                Download PDF
              </button>

              {/* Right: Edit Invoice */}
              <button
                className="px-6 py-3 bg-gray-100 text-green-700 font-semibold rounded-xl hover:bg-gray-200 transition duration-200 shadow-md"
                onClick={() => alert("Edit Invoice clicked")}
              >
                Edit Invoice
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
