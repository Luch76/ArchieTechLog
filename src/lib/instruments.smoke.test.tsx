import { describe, expect, test } from "bun:test"
import { renderToString } from "react-dom/server"
import { Stepper } from "@/lib/stepper"
import { Schedule } from "@/lib/schedule"
import { Timeline } from "@/lib/timeline"
import { Board } from "@/lib/board"
import { Queue } from "@/lib/queue"
import { Map } from "@/lib/map"
import { Scene } from "@/lib/scene"

// Server render of every instrument with two fixture rows: the static HTML must be non-empty and carry the
// instrument's own data-slot. Map and Scene are client-only: they render their tinted fallback box.
interface Task { id: string; title: string; status: string; startsAt: string; endsAt: string; receivedAt: string }
const rows: Task[] = [
  { id: "a", title: "Kickoff", status: "Open", startsAt: "2026-10-01T09:00:00Z", endsAt: "2026-10-01T10:00:00Z", receivedAt: "2026-10-01T08:00:00Z" },
  { id: "b", title: "Review", status: "Done", startsAt: "2026-10-02T09:00:00Z", endsAt: "2026-10-03T10:00:00Z", receivedAt: "2026-10-01T12:00:00Z" },
]

describe("instruments render to static HTML", () => {
  test("Stepper", () => {
    const html = renderToString(<Stepper data-vid="dk4fk75" steps={["Draft", "Review"]} current={1} />)
    expect(html.length).toBeGreaterThan(0)
    expect(html).toContain('data-slot="stepper"')
    expect(html).toContain("Review")
  })
  test("Schedule", () => {
    const html = renderToString(<Schedule data-vid="vmjgd0u" rows={rows} start="startsAt" end="endsAt" date="2026-10-01" today="2026-10-01" />)
    expect(html).toContain('data-slot="schedule"')
    expect(html).toContain("Kickoff")
  })
  test("Timeline", () => {
    const html = renderToString(<Timeline data-vid="f2z7d7y" rows={rows} start="startsAt" end="endsAt" lane="status" />)
    expect(html).toContain('data-slot="timeline"')
    expect(html).toContain("Review")
  })
  test("Board", () => {
    const html = renderToString(<Board data-vid="5bn6gy3" rows={rows} groupBy="status" columns={["Open", "Done"]} />)
    expect(html).toContain('data-slot="board"')
    expect(html).toContain("Kickoff")
  })
  test("Queue", () => {
    const html = renderToString(<Queue data-vid="m31adj7" rows={rows} stage="status" at="receivedAt" now="2026-10-02T00:00:00Z" renderDetail={(r: Task) => <p data-vid="uce4rwt">{r.title}</p>} />)
    expect(html).toContain('data-slot="queue"')
    expect(html).toContain("Kickoff")
  })
  test("Map renders its client fallback", () => {
    const html = renderToString(<Map data-vid="kw2dl26" markers={[{ lat: 1, lng: 2, label: "A" }, { lat: 3, lng: 4, label: "B" }]} />)
    expect(html).toContain('data-slot="map"')
  })
  test("Scene renders its client fallback", () => {
    const html = renderToString(<Scene data-vid="d941bqe">{() => null}</Scene>)
    expect(html).toContain('data-slot="scene"')
  })
})
