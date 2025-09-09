import ReservationForm from "../components/ReservationForm";
import ReservationList from "../components/ReservationList";

export default function ReservationsPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">New Reservation</h2>
        <ReservationForm />
      </div>
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">My Reservations</h2>
        <ReservationList />
      </div>
    </div>
  );
}