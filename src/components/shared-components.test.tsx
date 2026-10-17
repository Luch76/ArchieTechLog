import { describe, expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import { createInstance } from "i18next"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { MemoryRouter } from "react-router"
import en from "@/i18n/locales/en.json"
import es from "@/i18n/locales/es.json"
import { PageHead } from "./page-head"
import { StatusChip } from "./status-chip"
import { STATUS_TONES } from "./status-chip.policy"
import { EmptyState } from "./empty-state"
import { ThemeControl } from "./theme-control"
import { ThemeProvider } from "./theme-provider"
import { hasDefaultCaption, resolveSystem, THEME_VALUES } from "./theme-control.policy"

async function render(node: React.ReactNode, lng: "en" | "es" = "en", catalogs: Record<string, object> = { en, es }) {
  const i18n = createInstance()
  await i18n.use(initReactI18next).init({
    lng,
    fallbackLng: "en",
    resources: Object.fromEntries(Object.entries(catalogs).map(([k, v]) => [k, { translation: v }])),
    interpolation: { escapeValue: false },
  })
  // ThemeProvider reads localStorage in its initializer; give it an empty one on the server.
  ;(globalThis as { localStorage?: unknown }).localStorage ??= { getItem: () => null, setItem: () => {} }
  return renderToStaticMarkup(
    <I18nextProvider data-vid="ct4jwbk" i18n={i18n}>
      <MemoryRouter data-vid="lpvul3t">
        <ThemeProvider data-vid="bmccegm" defaultTheme="system" storageKey="archie-ui-theme">{node}</ThemeProvider>
      </MemoryRouter>
    </I18nextProvider>,
  )
}

describe("PageHead", () => {
  test("one h1 with the title; wayfinding, status, support, meta and actions around it", async () => {
    const html = await render(
      <PageHead data-vid="e3q4cq7"
        title="Invoice 1042"
        description="Waiting on the client"
        meta="Due 3 Nov"
        back={{ label: "Invoices", href: "/invoices" }}
        status={<StatusChip data-vid="0cz3oyn" tone="pending" label="Sent" />}
        actions={<button data-vid="ftt67xf">Approve</button>}
        tabs={<div data-vid="zx2ihmx" data-testid="tabs" />}
      />,
    )
    expect(html.match(/<h1\b/g)?.length).toBe(1)
    expect(html).toContain("Invoice 1042")
    expect(html).toContain('href="/invoices"')
    expect(html).toContain("Approve")
    expect(html).toMatch(/^<header\b/)
    expect(html).toContain("w-full") // HEAD.8: full content width
  })

  test("optional parts are omitted, not rendered empty", async () => {
    const html = await render(<PageHead data-vid="x9dcjp1" title="Clients" />)
    expect(html).not.toContain("<a ")
    expect(html).not.toContain("page-head-actions")
    expect(html).not.toContain("<p")
  })
})

describe("StatusChip", () => {
  test("the text says the state and the tone is exposed; it is not a button", async () => {
    for (const tone of STATUS_TONES) {
      const html = await render(<StatusChip data-vid="k6s73lz" tone={tone} label="Delivered" />)
      expect(html).toContain("Delivered")
      expect(html).toContain(`data-tone="${tone}"`)
      expect(html).not.toContain("<button")
    }
  })

  test("same label and tone render the same chip anywhere (TBL.10)", async () => {
    expect(await render(<StatusChip data-vid="ta4nn3h" tone="ok" label="Paid" />)).toBe(await render(<StatusChip data-vid="4ukogni" tone="ok" label="Paid" />))
  })

  test("defaults to neutral", async () => {
    expect(await render(<StatusChip data-vid="sk2l80g" label="Draft" />)).toContain('data-tone="neutral"')
  })
})

describe("EmptyState", () => {
  test("renders the sentence, support line and the add action once", async () => {
    const html = await render(<EmptyState data-vid="92pp0cq" title="No clients yet." description="Clients appear here." action={<button data-vid="gxa5zpl">Add client</button>} />)
    expect(html).toContain("No clients yet.")
    expect(html).toContain("Clients appear here.")
    expect(html.match(/Add client/g)?.length).toBe(1)
  })

  test("without an action there is no actions slot", async () => {
    const html = await render(<EmptyState data-vid="fsz4twa" title="Nothing here." description="Invoices appear here when a client pays." />)
    expect(html).not.toContain("empty-content")
  })
})

describe("ThemeControl", () => {
  test("segmented-icons: radiogroup, three named radios, caption naming the choice", async () => {
    const html = await render(<ThemeControl data-vid="tbcpypy" />)
    expect(html).toContain('role="radiogroup"')
    expect(html).toContain('aria-label="Theme"')
    expect(html.match(/role="radio"/g)?.length).toBe(3)
    for (const name of ["Light", "Dark", "System"]) expect(html).toContain(`aria-label="${name}"`)
    expect(html).toContain('aria-checked="true"') // default "system"
    expect(html).toContain("System · following your device (Light)") // SSR snapshot: no window, light
    expect(html).toContain("aria-describedby=")
  })

  test("controlled value drives the selection and the caption", async () => {
    const html = await render(<ThemeControl data-vid="lkewiax" value="dark" />)
    expect(html).toContain(">Dark</p>")
    expect(html).not.toContain("following your device")
  })

  test("segmented-labels shows visible text and no default caption", async () => {
    const html = await render(<ThemeControl data-vid="itkhjnz" variant="segmented-labels" />)
    expect(html).toContain("<span>Light</span>")
    expect(html).not.toContain("theme-control-caption")
  })

  test("preview-cards: three cards with a label under each thumbnail, radiogroup", async () => {
    const html = await render(<ThemeControl data-vid="3e7pml7" variant="preview-cards" />)
    expect(html).toContain('role="radiogroup"')
    expect(html.match(/role="radio"/g)?.length).toBe(3)
    expect(html).toContain("theme-control-caption")
  })

  test("es: translated labels and caption", async () => {
    const html = await render(<ThemeControl data-vid="qscekjy" />, "es")
    expect(html).toContain('aria-label="Tema"')
    expect(html).toContain("Sistema · sigue tu dispositivo (Claro)")
  })

  test("a catalog without themeControl.* falls back to English, never raw keys", async () => {
    const html = await render(<ThemeControl data-vid="0mytqyo" />, "es", { en: { a: 1 }, es: { a: 1 } })
    expect(html).toContain('aria-label="Theme"')
    expect(html).not.toMatch(/themeControl\./)
  })

  test("policy: exactly light, dark, system; captions by variant; system resolution", () => {
    expect([...THEME_VALUES]).toEqual(["light", "dark", "system"])
    expect(hasDefaultCaption("segmented-icons")).toBe(true)
    expect(hasDefaultCaption("preview-cards")).toBe(true)
    expect(hasDefaultCaption("select")).toBe(false)
    expect(resolveSystem(true)).toBe("dark")
    expect(resolveSystem(false)).toBe("light")
  })

  test("catalogs ship the same themeControl keys", () => {
    const keys = (o: object, p = ""): string[] =>
      Object.entries(o).flatMap(([k, v]) => (typeof v === "object" ? keys(v, `${p}${k}.`) : [`${p}${k}`])).sort()
    expect(keys(es.themeControl)).toEqual(keys(en.themeControl))
  })
})
