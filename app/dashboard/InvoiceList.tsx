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

  // Tax is always 0
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

    // Total = subtotal (tax is always 0)
    setSubTotal(subtotalCalc);
    setTotal(subtotalCalc);
  };

  const downloadPDF = () => {
    if (!rows.length) return;

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = 210;
    const margin = 15;
    let currentY = 20;

    // Heading
    doc.setFontSize(24);
    doc.setTextColor(22, 163, 74);
    doc.text("INVOICE", pageWidth / 2, currentY, { align: "center" });
    currentY += 15;

    // From / To
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`From:\n${fromData.company}\n${fromData.address}\n${fromData.email}`, margin, currentY);
    doc.text(
      `To:\n${toData.name}\n${toData.address}\n${toData.email}\nDate: ${toData.date}`,
      pageWidth / 2 + margin / 2,
      currentY
    );
    currentY += 35;

    // Table
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

    currentY = doc.lastAutoTable?.finalY || currentY + 10;

    // Subtotal / Tax / Total
    doc.setFontSize(12);
    doc.text(`Subtotal: $${subTotal.toFixed(2)}`, pageWidth - margin - 50, currentY + 10);
    doc.text(`Tax (${tax}%): $0.00`, pageWidth - margin - 50, currentY + 18); // Always 0
    doc.setFontSize(14);
    doc.setTextColor(22, 163, 74);
    doc.text(`Total: $${total.toFixed(2)}`, pageWidth - margin - 50, currentY + 28);
    currentY += 40;

    // Payment Box
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    const boxHeight = 70;
    doc.setDrawColor(74, 222, 128);
    doc.rect(margin, currentY, pageWidth - 2 * margin, boxHeight);

    let innerY = currentY + 6;

    // Pay By Date
    doc.text(`Pay By Date: ${payByDate}`, margin + 5, innerY);
    innerY += 10;

    // Payment Method Details
    const paymentText = doc.splitTextToSize(`Payment Method Details:\n${paymentMethodDetails}`, pageWidth - 2 * margin - 10);
    doc.text(paymentText, margin + 5, innerY);
    innerY += paymentText.length * 6 + 5;

    // Horizontal line
    doc.setDrawColor(74, 222, 128);
    doc.line(margin + 5, innerY, pageWidth - margin - 5, innerY);
    innerY += 5;

    // Signature below
    doc.setFont("times", "italic");
    doc.text(`Signature: ${signature || "_________________"}`, margin + 5, innerY);

    doc.save(`invoice.pdf`);
  };

  return (
    <div style={{ backgroundColor: "#f0fdf4" }} className="min-h-screen flex flex-col items-center px-4 py-10 font-sans text-gray-900">
      {/* Sheet Input */}
      <div style={{ maxWidth: "600px" }} className="w-full mb-10">
        <h1 style={{ color: "#15803d" }} className="text-2xl font-bold mb-4 text-center">
          Sheet Viewer & PDF
        </h1>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Paste Google Sheet link or ID"
            value={sheetInput}
            onChange={(e) => setSheetInput(e.target.value)}
            style={{ borderColor: "#86efac" }}
            className="border p-3 rounded-xl w-full text-base placeholder-gray-400 focus:outline-none"
          />
          <button
            onClick={fetchSheet}
            style={{ backgroundColor: "#16a34a", color: "#ffffff" }}
            className="px-6 py-3 font-semibold rounded-xl hover:bg-green-700 transition duration-200"
          >
            {loading ? "Loading..." : "Load"}
          </button>
        </div>
        {loaded && rows.length === 0 && (
          <p className="text-center text-gray-600 text-base mt-4">No data found.</p>
        )}
      </div>

      {/* Invoice */}
{rows.length > 0 && (
  <div style={{ backgroundColor: "#ffffff", border: "2px solid #4ade80" }} className="rounded-lg p-10 w-full max-w-4xl">
    
    {/* INVOICE Heading */}
    <div className="text-center mb-6">
      <h1 style={{ color: "#15803d" }} className="text-3xl font-bold tracking-wide">
        INVOICE
      </h1>
    </div>

    {/* From / To */}
    <div className="mb-6 flex justify-between gap-4">
      <div className="w-1/2 text-gray-700">
        <h3 className="font-semibold text-lg mb-2">From:</h3>
        {isEditing ? (
          <>
            <input className="w-full mb-1 p-1 border rounded" value={fromData.company} onChange={(e) => setFromData({ ...fromData, company: e.target.value })} />
            <input className="w-full mb-1 p-1 border rounded" value={fromData.address} onChange={(e) => setFromData({ ...fromData, address: e.target.value })} />
            <input className="w-full mb-1 p-1 border rounded" value={fromData.email} onChange={(e) => setFromData({ ...fromData, email: e.target.value })} />
          </>
        ) : (
          <>
            <p>{fromData.company}</p>
            <p>{fromData.address}</p>
            <p>{fromData.email}</p>
          </>
        )}
      </div>

      <div className="w-1/2 text-gray-700 text-right">
        <h3 className="font-semibold text-lg mb-2">To:</h3>
        {isEditing ? (
          <>
            <input className="w-full mb-1 p-1 border rounded text-right" value={toData.name} onChange={(e) => setToData({ ...toData, name: e.target.value })} />
            <input className="w-full mb-1 p-1 border rounded text-right" value={toData.address} onChange={(e) => setToData({ ...toData, address: e.target.value })} />
            <input className="w-full mb-1 p-1 border rounded text-right" value={toData.email} onChange={(e) => setToData({ ...toData, email: e.target.value })} />
            <input className="w-full mb-1 p-1 border rounded text-right" value={toData.date} onChange={(e) => setToData({ ...toData, date: e.target.value })} />
          </>
        ) : (
          <>
            <p>{toData.name}</p>
            <p>{toData.address}</p>
            <p>{toData.email}</p>
            <p>Date: {toData.date}</p>
          </>
        )}
      </div>
    </div>

    {/* Table */}
    <div style={{ border: "2px solid #4ade80" }} className="overflow-x-auto rounded-lg shadow-sm mb-6">
      <table className="min-w-full text-sm text-left border-collapse">
        <thead style={{ backgroundColor: "#dcfce7", color: "#15803d" }} className="uppercase text-xs tracking-wider">
          <tr>
            {Object.keys(rows[0]).map((header) => (
              <th key={header} style={{ border: "1px solid #86efac", padding: "12px" }}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ backgroundColor: "#f0fdf4" }}>
              {Object.entries(row).map(([key, value], j) => (
                <td key={j} style={{ border: "1px solid #86efac", padding: "12px", color: "#15803d" }}>
                  {isEditing ? (
                    <input className="w-full p-1 border rounded" value={value} onChange={(e) => handleCellChange(i, key, e.target.value)} />
                  ) : (
                    value
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Subtotal / Tax / Total */}
    <div className="flex justify-end gap-6 mb-6">
      <div className="w-1/3 text-right space-y-2">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>${subTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax (0%):</span>
          <span>$0.00</span>
        </div>
        <div className="flex justify-between font-bold" style={{ color: "#15803d" }}>
          <span>Total:</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <button className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition" onClick={handleAddAll}>
          Add All
        </button>
      </div>
    </div>

    {/* Payment Section stays SAME */}
          {/* Subtotal / Tax / Total */}
          <div className="flex justify-end gap-6 mb-6">
            <div className="w-1/3 text-right space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (0%):</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between font-bold" style={{ color: "#15803d" }}>
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <button className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition" onClick={handleAddAll}>Add All</button>
            </div>
          </div>

          {/* Payment Section Frontend */}
          <div className="mt-10 w-full flex justify-start">
            <div className="w-full max-w-md border-2 border-green-300 rounded-lg p-6 text-gray-700">
              {/* Pay By Date */}
              <div className="mb-4">
                <label className="font-semibold block mb-1">Pay By Date:</label>
                <input
                  type="date"
                  value={payByDate}
                  onChange={(e) => setPayByDate(e.target.value)}
                  className="border p-2 rounded w-full"
                />
              </div>

              <hr className="border-green-300 mb-4" />

              {/* Payment Method Details */}
              <div className="mb-4">
                <label className="font-semibold block mb-1">Payment Method Details:</label>
                <textarea
                  value={paymentMethodDetails}
                  onChange={(e) => setPaymentMethodDetails(e.target.value)}
                  className="border p-2 rounded w-full h-32"
                  placeholder="Enter payment details here"
                />
              </div>

              <hr className="border-green-300 mb-4" />

              {/* Signature */}
              <div className="mb-4">
                <label className="font-semibold block mb-1">Signature:</label>
                <input
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  className="border p-2 rounded italic w-full"
                  placeholder="Sign here"
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="mt-8 flex justify-between items-center">
            <button onClick={downloadPDF} className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition duration-200">
              Download PDF
            </button>
            <button
              className={`px-6 py-3 font-semibold rounded-xl transition duration-200 ${isEditing ? "bg-gray-100 text-green-700 hover:bg-gray-200" : "bg-green-600 text-white hover:bg-green-700"}`}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? "Save" : "Edit Invoice"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}