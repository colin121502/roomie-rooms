"use client";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default function Home() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <h1 className="text-4xl font-bold">Welcome to Roomie Rooms</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Roomie Rooms makes it simple for students to reserve study rooms on campus.
          Schedule time that works for you, manage your reservations, and stay focused
          on what matters most — your success.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mt-6">
          <a href="/book" className="btn">Book a Room</a>
          <a href="/reservations" className="btn-outline">My Reservations</a>
          <a href="/login" className="btn-outline">Login / Signup</a>
        </div>
      </section>

      {/* What It Offers */}
      <section className="grid gap-8 md:grid-cols-3 text-center">
        <div className="card p-6">
          <h2 className="font-semibold text-lg mb-2">📅 Easy Booking</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Quickly reserve study rooms with just a few clicks.
          </p>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-lg mb-2">🔄 Manage Reservations</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Review your schedule, update or cancel reservations anytime.
          </p>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-lg mb-2">✅ Student Friendly</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Designed with students in mind — simple, fast, and accessible.
          </p>
        </div>
      </section>
    </div>
  );
}