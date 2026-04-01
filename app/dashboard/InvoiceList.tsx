"use client";
import { useState } from "react";

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

  // ── PDF: open a styled print window that mirrors the UI exactly ──
  const downloadPDF = () => {
    if (!rows.length) return;

    const columns = Object.keys(rows[0]);

    const tableRows = rows
      .map(
        (row) =>
          `<tr>${columns
            .map(
              (col) =>
                `<td>${row[col] ?? ""}</td>`
            )
            .join("")}</tr>`
      )
      .join("");

    const tableHeaders = columns
      .map((col) => `<th>${col}</th>`)
      .join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice – ${fromData.company}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      color: #111827;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      width: 794px;
      margin: 0 auto;
      background: #fff;
    }

    /* ── Banner ── */
    .banner {
      background: #16a34a;
      color: #fff;
      padding: 32px 40px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-radius: 12px 12px 0 0;
    }
    .banner-label {
      font-size: 10px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #bbf7d0;
      margin-bottom: 4px;
    }
    .banner-company {
      font-size: 26px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .banner-sub {
      font-size: 12px;
      color: #bbf7d0;
      margin-top: 4px;
    }
    .banner-right {
      text-align: right;
    }
    .banner-right .banner-label { text-align: right; }
    .banner-right .date {
      font-size: 14px;
      font-weight: 600;
    }

    /* ── From / To ── */
    .parties {
      display: grid;
      grid-template-columns: 1fr 1fr;
      border-bottom: 1px solid #e5e7eb;
    }
    .party {
      padding: 20px 40px;
    }
    .party:first-child {
      border-right: 1px solid #e5e7eb;
    }
    .party-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #9ca3af;
      font-weight: 500;
      margin-bottom: 10px;
    }
    .party-name {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 2px;
    }
    .party-line {
      font-size: 12px;
      color: #4b5563;
      line-height: 1.6;
    }
    .party-email { color: #16a34a; }

    /* ── Table ── */
    .table-wrap {
      padding: 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12.5px;
    }
    thead tr {
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      padding: 10px 20px;
      text-align: left;
      font-size: 10.5px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: #6b7280;
    }
    tbody tr {
      border-bottom: 1px solid #f3f4f6;
    }
    tbody tr:last-child {
      border-bottom: none;
    }
    td {
      padding: 11px 20px;
      color: #374151;
    }

    /* ── Totals ── */
    .totals-wrap {
      display: flex;
      justify-content: flex-end;
      padding: 16px 40px 20px;
      border-top: 1px solid #f3f4f6;
    }
    .totals {
      width: 240px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      font-size: 12.5px;
      color: #6b7280;
    }
    .totals-grand {
      display: flex;
      justify-content: space-between;
      padding: 10px 0 6px;
      border-top: 1px solid #d1d5db;
      margin-top: 4px;
      font-size: 14px;
      font-weight: 700;
      color: #15803d;
    }

    /* ── Payment section ── */
    .payment {
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      padding: 24px 40px;
      display: grid;
      grid-template-columns: 1fr 2fr 1fr;
      gap: 24px;
      border-radius: 0 0 12px 12px;
    }
    .payment-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #9ca3af;
      font-weight: 500;
      margin-bottom: 6px;
    }
    .payment-value {
      font-size: 12.5px;
      color: #374151;
      line-height: 1.6;
    }
    .sig-line {
      border-bottom: 1.5px solid #d1d5db;
      margin-top: 16px;
    }
    .sig-text {
      font-style: italic;
      font-size: 13px;
      color: #374151;
      margin-top: 4px;
    }
    .sig-hint {
      font-size: 10px;
      color: #9ca3af;
      margin-top: 2px;
    }

    /* ── Section divider label ── */
    .section-title {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #9ca3af;
      font-weight: 500;
      padding: 14px 40px 0;
    }

    /* ── Print ── */
    @media print {
      html, body { margin: 0; padding: 0; }
      .page { width: 100%; }
      .banner { border-radius: 0; }
      .payment { border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="page">

    <div class="banner">
      <div>
        <div class="banner-label">Invoice</div>
        <div class="banner-company">${fromData.company}</div>
        <div class="banner-sub">${fromData.address} &nbsp;·&nbsp; ${fromData.email}</div>
      </div>
      <div class="banner-right">
        <div class="banner-label">Date issued</div>
        <div class="date">${toData.date}</div>
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <div class="party-label">From</div>
        <div class="party-name">${fromData.company}</div>
        <div class="party-line">${fromData.address}</div>
        <div class="party-line party-email">${fromData.email}</div>
      </div>
      <div class="party">
        <div class="party-label">Billed to</div>
        <div class="party-name">${toData.name}</div>
        <div class="party-line">${toData.address}</div>
        <div class="party-line party-email">${toData.email}</div>
        <div class="party-line" style="color:#6b7280;margin-top:2px;">Date: ${toData.date}</div>
      </div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>${tableHeaders}</tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>

    <div class="totals-wrap">
      <div class="totals">
        <div class="totals-row"><span>Subtotal</span><span>$${subTotal.toFixed(2)}</span></div>
        <div class="totals-row"><span>Tax (${tax}%)</span><span>$0.00</span></div>
        <div class="totals-grand"><span>Total</span><span>$${total.toFixed(2)}</span></div>
      </div>
    </div>

    <div class="payment">
      <div>
        <div class="payment-label">Pay by date</div>
        <div class="payment-value">${payByDate}</div>
      </div>
      <div>
        <div class="payment-label">Payment method / details</div>
        <div class="payment-value">${paymentMethodDetails || "—"}</div>
      </div>
      <div>
        <div class="payment-label">Authorised signature</div>
        <div class="sig-line"></div>
        <div class="sig-text">${signature || "&nbsp;"}</div>
        <div class="sig-hint">Signature</div>
      </div>
    </div>

  </div>

  <script>
    window.onload = function () {
      window.print();
    };
  </script>
</body>
</html>`;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      alert("Please allow popups for this site to download the PDF.");
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
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

        {/* ── Step 1 ── */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Connect your Google Sheet</h2>
          </div>
          <p className="text-sm text-gray-500 ml-8 mb-3">
            Open your Google Sheet → click <strong>Share</strong> → set to <em>Anyone with link can view</em> → paste the URL below.
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
              ) : "Load Sheet"}
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
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Review &amp; customise your invoice</h2>
            </div>
            <p className="text-sm text-gray-500 ml-8 mb-6">
              Click <strong>Edit Invoice</strong> to update details, add or remove rows, and edit any cell. Hit <strong>Calculate Total</strong> to sum the last column. When ready, click <strong>Download PDF</strong>.
            </p>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

              {/* Invoice banner */}
              <div className="bg-green-600 px-8 py-6 flex justify-between items-start">
                <div>
                  <p className="text-green-100 text-xs uppercase tracking-widest font-medium mb-1">Invoice</p>
                  <h1 className="text-white text-3xl font-bold tracking-tight">{fromData.company}</h1>
                  <p className="text-green-100 text-sm mt-1">{fromData.address} · {fromData.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-green-100 text-xs uppercase tracking-widest font-medium mb-1">Date issued</p>
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

              {/* Edit toolbar */}
              {isEditing && (
                <div className="bg-green-50 border-b border-green-100 px-8 py-3 flex items-center gap-3">
                  <span className="text-xs text-green-700 font-medium mr-2">✏️ Editing mode</span>
                  <button onClick={addRow} className="text-xs px-3 py-1.5 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 font-medium transition-colors">+ Add row</button>
                  <button onClick={addColumn} className="text-xs px-3 py-1.5 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 font-medium transition-colors">+ Add column</button>
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
                                  setRows(rows.map((row) => {
                                    const copy = { ...row };
                                    copy[newKey] = copy[header];
                                    if (newKey !== header) delete copy[header];
                                    return copy;
                                  }));
                                }}
                              />
                              <button className="text-gray-300 hover:text-red-500 transition-colors" title="Delete column" onClick={() => deleteColumn(header)}>
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                              </button>
                            </div>
                          ) : header}
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
                            ) : value}
                          </td>
                        ))}
                        {isEditing && (
                          <td className="px-5 py-3 text-center">
                            <button onClick={() => deleteRow(i)} className="text-gray-300 hover:text-red-500 transition-colors" title="Delete row">
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
                    <span>Subtotal</span><span>${subTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 text-sm text-gray-500">
                    <span>Tax (0%)</span><span>$0.00</span>
                  </div>
                  <div className="flex justify-between items-center py-2 text-base font-bold text-green-700 border-t border-gray-200 mt-1">
                    <span>Total</span><span>${total.toFixed(2)}</span>
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
                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-4">Payment details</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Pay by date</label>
                    <input type="date" value={payByDate} onChange={(e) => setPayByDate(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Payment method / details</label>
                    <textarea value={paymentMethodDetails} onChange={(e) => setPaymentMethodDetails(e.target.value)} placeholder="e.g. Bank transfer to Account #12345…" rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Authorised signature</label>
                    <input value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Type your name to sign" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white italic focus:outline-none focus:ring-2 focus:ring-green-400" />
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
                    className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors ${isEditing ? "bg-green-600 text-white hover:bg-green-700" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                  >
                    {isEditing ? "✓ Save changes" : "✏️ Edit invoice"}
                  </button>
                  {isEditing && <span className="text-xs text-gray-400">Changes are saved locally</span>}
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

            <p className="text-xs text-gray-400 text-center mt-4">
              💡 Tip: Click <strong>Calculate total from last column</strong> before downloading to make sure the total is correct.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}