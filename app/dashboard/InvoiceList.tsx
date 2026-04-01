"use client";
import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function SheetViewer() {
  const [sheetInput, setSheetInput] = useState("");
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [fromData, setFromData] = useState({
    company: "Your Company",
    address: "123 Business St.",
    email: "email@company.com",
  });

  const [toData, setToData] = useState({
    name: "Client Name",
    address: "456 Client Rd.",
    email: "client@email.com",
    date: "2026-02-16",
  });

  const [subTotal, setSubTotal] = useState(0);
  const [total, setTotal] = useState(0);
  const tax = 0;

  const [payByDate, setPayByDate] = useState("2026-03-01");
  const [paymentMethodDetails, setPaymentMethodDetails] = useState("");
  const [signature, setSignature] = useState("");

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
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert("Error loading sheet");
    } finally {
      setLoading(false);
    }
  };

  const handleCellChange = (rowIndex: number, key: string, value: string) => {
    const updatedRows = [...rows];
    updatedRows[rowIndex][key] = value;
    setRows(updatedRows);
  };

  const handleAddAll = () => {
    if (!rows.length) return;
    const lastColumnKey = Object.keys(rows[0]).slice(-1)[0];
    if (!lastColumnKey) return;
    let subtotalCalc = 0;
    rows.forEach((row) => {
      let val = row[lastColumnKey] as string;
      if (!val) return;
      val = val.replace(/\$/g, "").replace(/,/g, "");
      const num = parseFloat(val);
      if (!isNaN(num)) subtotalCalc += num;
    });
    setSubTotal(subtotalCalc);
    setTotal(subtotalCalc);
  };

  const addRow = () => {
    if (!rows.length) return;
    const newRow: Record<string, string> = {};
    Object.keys(rows[0]).forEach((key) => (newRow[key] = ""));
    setRows([...rows, newRow]);
  };

  const deleteRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const addColumn = () => {
    if (!rows.length) return;
    const newColumnKey = `Column ${Object.keys(rows[0]).length + 1}`;
    setRows(rows.map((row) => ({ ...row, [newColumnKey]: "" })));
  };

  const deleteColumn = (key: string) => {
    setRows(
      rows.map((row) => {
        const copy = { ...row };
        delete copy[key];
        return copy;
      })
    );
  };

  const downloadPDF = () => {
    if (!rows.length) return;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = 210;
    const margin = 15;
    let currentY = 20;

    doc.setFontSize(24);
    doc.setTextColor(22, 163, 74);
    doc.text("INVOICE", pageWidth / 2, currentY, { align: "center" });
    currentY += 15;

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `From:\n${fromData.company}\n${fromData.address}\n${fromData.email}`,
      margin,
      currentY
    );
    doc.text(
      `To:\n${toData.name}\n${toData.address}\n${toData.email}\nDate: ${toData.date}`,
      pageWidth / 2 + margin / 2,
      currentY
    );
    currentY += 35;

    const headers = [Object.keys(rows[0])];
    const data = rows.map((row) => Object.values(row));
    autoTable(doc, {
      startY: currentY,
      head: headers,
      body: data,
      theme: "grid",
      headStyles: { fillColor: [220, 252, 231], textColor: [22, 131, 61] },
      styles: { textColor: [22, 131, 61], fontSize: 10 },
      margin: { left: margin, right: margin },
      tableWidth: pageWidth - margin * 2,
    });

    currentY = (doc as any).lastAutoTable?.finalY || currentY + 10;

    doc.setFontSize(12);
    doc.text(`Subtotal: $${subTotal.toFixed(2)}`, pageWidth - margin - 50, currentY + 10);
    doc.text(`Tax (${tax}%): $0.00`, pageWidth - margin - 50, currentY + 18);
    doc.setFontSize(14);
    doc.setTextColor(22, 163, 74);
    doc.text(`Total: $${total.toFixed(2)}`, pageWidth - margin - 50, currentY + 28);

    const boxHeight = 70;
    doc.setDrawColor(74, 222, 128);
    doc.rect(margin, currentY + 40, pageWidth - 2 * margin, boxHeight);
    let innerY = currentY + 46;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Pay By Date: ${payByDate}`, margin + 5, innerY);
    innerY += 10;
    const paymentText = doc.splitTextToSize(
      `Payment Method Details:\n${paymentMethodDetails}`,
      pageWidth - 2 * margin - 10
    );
    doc.text(paymentText, margin + 5, innerY);
    innerY += paymentText.length * 6 + 5;
    doc.setDrawColor(74, 222, 128);
    doc.line(margin + 5, innerY, pageWidth - margin - 5, innerY);
    innerY += 5;
    doc.setFont("times", "italic");
    doc.text(`Signature: ${signature || "_________________"}`, margin + 5, innerY);

    doc.save(`invoice.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">

      {/* ── Top nav bar ── */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-green-600 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 3h10M2 7h7M2 11h5" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
          <span className="font-semibold text-gray-800 text-base">InvoiceKit</span>
        </div>
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          Google Sheets → PDF
        </span>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">

        {/* ── Step 1: Load sheet ── */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
              1
            </span>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Connect your Google Sheet
            </h2>
          </div>
          <p className="text-sm text-gray-500 ml-8 mb-3">
            Open your Google Sheet → click <strong>Share</strong> → set to{" "}
            <em>Anyone with link can view</em> → paste the URL below.
          </p>
          <div className="ml-8 flex gap-2">
            <input
              type="text"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={sheetInput}
              onChange={(e) => setSheetInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchSheet()}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent placeholder-gray-400 bg-white"
            />
            <button
              onClick={fetchSheet}
              disabled={loading}
              className="px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeDasharray="30 70" />
                  </svg>
                  Loading…
                </>
              ) : (
                "Load Sheet"
              )}
            </button>
          </div>
          {loaded && rows.length === 0 && (
            <p className="ml-8 mt-3 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
              ⚠️ Sheet loaded but no data found. Check that row 1 contains column headers.
            </p>
          )}
        </section>

        {/* ── Invoice ── */}
        {rows.length > 0 && (
          <div>
            {/* Step 2 hint */}
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                2
              </span>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Review &amp; customise your invoice
              </h2>
            </div>
            <p className="text-sm text-gray-500 ml-8 mb-6">
              Click <strong>Edit Invoice</strong> to update sender/client details, add or remove rows,
              and edit any cell. Hit <strong>Calculate Total</strong> to sum the last column. When
              ready, click <strong>Download PDF</strong>.
            </p>

            {/* Invoice card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

              {/* Invoice banner */}
              <div className="bg-green-600 px-8 py-6 flex justify-between items-start">
                <div>
                  <p className="text-green-100 text-xs uppercase tracking-widest font-medium mb-1">
                    Invoice
                  </p>
                  <h1 className="text-white text-3xl font-bold tracking-tight">
                    {fromData.company}
                  </h1>
                  <p className="text-green-100 text-sm mt-1">
                    {fromData.address} · {fromData.email}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-green-100 text-xs uppercase tracking-widest font-medium mb-1">
                    Date issued
                  </p>
                  <p className="text-white font-semibold">{toData.date}</p>
                </div>
              </div>

              {/* From / To */}
              <div className="grid grid-cols-2 border-b border-gray-100">
                <div className="px-8 py-5 border-r border-gray-100">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-3">From</p>
                  {isEditing ? (
                    <div className="space-y-2">
                      <input className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="Company name" value={fromData.company} onChange={(e) => setFromData({ ...fromData, company: e.target.value })} />
                      <input className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="Address" value={fromData.address} onChange={(e) => setFromData({ ...fromData, address: e.target.value })} />
                      <input className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="Email" value={fromData.email} onChange={(e) => setFromData({ ...fromData, email: e.target.value })} />
                    </div>
                  ) : (
                    <div className="space-y-0.5 text-sm text-gray-700">
                      <p className="font-semibold text-gray-900">{fromData.company}</p>
                      <p>{fromData.address}</p>
                      <p className="text-green-700">{fromData.email}</p>
                    </div>
                  )}
                </div>
                <div className="px-8 py-5">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-3">Billed to</p>
                  {isEditing ? (
                    <div className="space-y-2">
                      <input className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="Client name" value={toData.name} onChange={(e) => setToData({ ...toData, name: e.target.value })} />
                      <input className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="Address" value={toData.address} onChange={(e) => setToData({ ...toData, address: e.target.value })} />
                      <input className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="Email" value={toData.email} onChange={(e) => setToData({ ...toData, email: e.target.value })} />
                      <input type="date" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400" value={toData.date} onChange={(e) => setToData({ ...toData, date: e.target.value })} />
                    </div>
                  ) : (
                    <div className="space-y-0.5 text-sm text-gray-700">
                      <p className="font-semibold text-gray-900">{toData.name}</p>
                      <p>{toData.address}</p>
                      <p className="text-green-700">{toData.email}</p>
                      <p className="text-gray-500">Date: {toData.date}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Edit mode toolbar */}
              {isEditing && (
                <div className="bg-green-50 border-b border-green-100 px-8 py-3 flex items-center gap-3">
                  <span className="text-xs text-green-700 font-medium mr-2">✏️ Editing mode</span>
                  <button onClick={addRow} className="text-xs px-3 py-1.5 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 font-medium transition-colors">
                    + Add row
                  </button>
                  <button onClick={addColumn} className="text-xs px-3 py-1.5 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 font-medium transition-colors">
                    + Add column
                  </button>
                  <span className="text-xs text-gray-400 ml-auto">Click any cell to edit its value</span>
                </div>
              )}

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {Object.keys(rows[0]).map((header, idx) => (
                        <th key={header} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                className="text-xs border border-gray-200 rounded px-2 py-1 font-normal normal-case tracking-normal focus:outline-none focus:ring-1 focus:ring-green-400"
                                value={header}
                                onChange={(e) => {
                                  const newKey = e.target.value || `Column ${idx + 1}`;
                                  setRows(
                                    rows.map((row) => {
                                      const copy = { ...row };
                                      copy[newKey] = copy[header];
                                      if (newKey !== header) delete copy[header];
                                      return copy;
                                    })
                                  );
                                }}
                              />
                              <button
                                className="text-gray-300 hover:text-red-500 transition-colors"
                                title="Delete column"
                                onClick={() => deleteColumn(header)}
                              >
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                  <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            header
                          )}
                        </th>
                      ))}
                      {isEditing && <th className="px-5 py-3 w-16" />}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        {Object.entries(row).map(([key, value], j) => (
                          <td key={j} className="px-5 py-3 text-gray-700 whitespace-nowrap">
                            {isEditing ? (
                              <input
                                className="w-full min-w-[80px] border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                                value={value}
                                onChange={(e) => handleCellChange(i, key, e.target.value)}
                              />
                            ) : (
                              value
                            )}
                          </td>
                        ))}
                        {isEditing && (
                          <td className="px-5 py-3 text-center">
                            <button
                              onClick={() => deleteRow(i)}
                              className="text-gray-300 hover:text-red-500 transition-colors"
                              title="Delete row"
                            >
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M2 4h10M5 4V3a1 1 0 011-1h2a1 1 0 011 1v1M6 7v3M8 7v3M3 4l.8 7a1 1 0 001 .9h4.4a1 1 0 001-.9L11 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="px-8 py-5 flex justify-end border-t border-gray-100">
                <div className="w-64">
                  <div className="flex justify-between items-center py-1.5 text-sm text-gray-500">
                    <span>Subtotal</span>
                    <span>${subTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 text-sm text-gray-500">
                    <span>Tax (0%)</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between items-center py-2 text-base font-bold text-green-700 border-t border-gray-200 mt-1">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={handleAddAll}
                    className="mt-3 w-full text-xs px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg hover:bg-green-100 font-medium transition-colors"
                  >
                    ↻ Calculate total from last column
                  </button>
                </div>
              </div>

              {/* Payment & Signature */}
              <div className="border-t border-gray-100 px-8 py-6 bg-gray-50">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-4">
                  Payment details
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Pay by date
                    </label>
                    <input
                      type="date"
                      value={payByDate}
                      onChange={(e) => setPayByDate(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Payment method / details
                    </label>
                    <textarea
                      value={paymentMethodDetails}
                      onChange={(e) => setPaymentMethodDetails(e.target.value)}
                      placeholder="e.g. Bank transfer to Account #12345…"
                      rows={3}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Authorised signature
                    </label>
                    <input
                      value={signature}
                      onChange={(e) => setSignature(e.target.value)}
                      placeholder="Type your name to sign"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white italic focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                    <div className="mt-1.5 border-b border-gray-300 mx-1" />
                    <p className="text-xs text-gray-400 mt-1">Appears as signature line in PDF</p>
                  </div>
                </div>
              </div>

              {/* Footer actions */}
              <div className="px-8 py-5 border-t border-gray-200 flex items-center justify-between bg-white">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                      isEditing
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {isEditing ? "✓ Save changes" : "✏️ Edit invoice"}
                  </button>
                  {isEditing && (
                    <span className="text-xs text-gray-400">Changes are saved locally</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right mr-2 hidden sm:block">
                    <p className="text-xs text-gray-400">Ready to export?</p>
                    <p className="text-xs text-gray-500 font-medium">Make sure total is calculated</p>
                  </div>
                  <button
                    onClick={downloadPDF}
                    className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 1v7m0 0L4.5 5.5M7 8l2.5-2.5M2 10v1a2 2 0 002 2h6a2 2 0 002-2v-1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Download PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Step 3 tip */}
            <p className="text-xs text-gray-400 text-center mt-4">
              💡 Tip: Click <strong>Calculate total from last column</strong> before downloading to make sure the total is correct.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}