export default function Home() {
  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold text-center">Roomie Rooms</h1>
      <h2 className="text-xl text-gray-600 text-center mt-2">
        Campus Study Room Reservations
      </h2>

      <p className="mt-6 text-lg">
        Roomie Rooms lets students easily reserve study rooms on campus. Staff
        can manage schedules, set blackout dates, track attendance, and export
        reports for analysis.
      </p>

      <ul className="mt-6 list-disc pl-6 space-y-2">
        <li>📅 Students can book and cancel reservations</li>
        <li>🔑 Staff manage schedules and blackout dates</li>
        <li>✅ Track attendance and no-shows</li>
        <li>📊 Export data to CSV for reporting</li>
      </ul>

      <div className="mt-8 text-center">
        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
          Get Started
        </button>
      </div>
    </main>
  );
}
