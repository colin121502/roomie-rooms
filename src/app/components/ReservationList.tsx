export default function ReservationList() {
  const items = [
    { id: "r1", room: "Harris 101", when: "2025-09-10 10:00", duration: 60 },
    { id: "r2", room: "Library 2F-A", when: "2025-09-12 14:30", duration: 90 },
  ];

  return (
    <div id="reservations">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Room</th>
            <th className="py-2">When</th>
            <th className="py-2">Duration</th>
            <th className="py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map(r => (
            <tr key={r.id} className="border-b">
              <td className="py-2">{r.room}</td>
              <td className="py-2">{r.when}</td>
              <td className="py-2">{r.duration} min</td>
              <td className="py-2">
                <button
                  className="rounded border px-2 py-1"
                  hx-delete={`/api/reservations/${r.id}`}
                  hx-target="closest tr"
                  hx-swap="outerHTML"
                >
                  Cancel
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div id="toast" className="mt-2 text-xs text-gray-600" hx-swap-oob="true"></div>
    </div>
  );
}