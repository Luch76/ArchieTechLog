import type { BookingsVM } from "@/application/view-models/bookings.vm";

export function BookingsView(props: BookingsVM) {
  return <ul data-vid="aor8ja9">{props.bookings.map((b) => <li data-vid="bomi51n" key={b.id}>{b.status}</li>)}</ul>;
}
