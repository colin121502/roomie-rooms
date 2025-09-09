export default function Home() {
  return (
    <section className="grid gap-6 md:grid-cols-2 p-8 max-w-6xl mx-auto">
      {/* Left side: intro */}
      <div>
        <h1 className="text-4xl font-bold">Roomie Rooms</h1>
        <h2 className="text-xl text-gray-600 mt-2">
          Campus Study Room Reservations
        </h2>

        <p className="mt-6 text-lg">
          Students can easily reserve campus study rooms. Staff can manage
          schedules, set blackout dates, track attendance, and export reports
          for analysis.
        </p>

        <ul className="mt-6 list-disc pl-6 space-y-2">
          <li>📅 Book and cancel reservations</li>
          <li>🔑 Staff manage schedules and blackout dates</li>
          <li>✅ Track attendance and no-shows</li>
          <li>📊 Export data to CSV</li>
        </ul>

        <div className="mt-8">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            Get Started
          </button>
        </div>
      </div>

      {/* Right side: Quick Links */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold">Quick Links</h2>
        <ul className="list-disc pl-5 text-sm space-y-2">
          <li>View your reservations</li>
          <li>See available rooms</li>
          <li>Contact staff</li>
        </ul>
      </div>
    </section>
  );
}
