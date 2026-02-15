import InvoiceList from "./InvoiceList";

export default function DashboardPage() {
  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-5">Invoices Dashboard</h1>
      <InvoiceList />
    </div>
  );
}
