import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-10">
      <h1 className="text-4xl font-bold mb-5">Invoice MVP</h1>
      <p className="mb-5 text-center">
        Welcome! Click below to view your invoices dashboard.
      </p>
      <Link
        href="/dashboard"
        className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
