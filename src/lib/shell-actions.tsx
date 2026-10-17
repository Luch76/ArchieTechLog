import { useEffect, useRef, useState, type ReactElement, type ReactNode } from "react"
import { CreditCard, HelpCircle, Info, Languages, LogOut, Monitor, Moon, ShieldCheck, SlidersHorizontal, Sun, User, UserCircle } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Kbd } from "@/components/ui/kbd"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { formatDateTime } from "@/lib/format"
import { navigateTo } from "@/lib/host-navigation"
import { makeChrome, useChrome, type ChromeTranslator } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { useThemeMode } from "./theme-mode"
import {
  initialsOf,
  planIdentityMenu,
  roleTextOf,
  type IdentityLanguageSlot,
  type IdentityLegalLink,
  type IdentityLinkSlot,
  type IdentityRow,
  type ShellIdentityPersona,
} from "./shell-identity"
import { SHELL_POPOVER_PAD, shellPopoverWidth, applyShellHeaderOffset, clearShellHeaderOffset } from "./shell-layout"

export { SHELL_POPOVER_PAD, shellPopoverWidth, SHELL_HEADER_VAR, applyShellHeaderOffset, clearShellHeaderOffset } from "./shell-layout"
export { initialsOf, planIdentityMenu, roleTextOf, type ShellIdentityPersona } from "./shell-identity"

// What the shell's controls DO (ARCH-1939). The data is the shell's `actions` prop, computed by the build from the sitemap and the
// fixtures (src/steps/03c-shell-actions.ts): routes, fixture records, generated form screens, notification rows. Nothing here
// invents a row, a route or a shortcut; a control whose data is empty is not drawn by the shell (`has`).
//
// - useShellActions(actions) -> { has, palette, help, about }: what exists, and the open state of the three dialogs. It also
//   registers the keyboard shortcuts the Help dialog lists: Ctrl/Cmd+K only when the palette exists, `?` ALWAYS (Help is always drawn). State starts closed: hydration-safe, no window in render.
// - <ShellPalette>, <ShellHelp>, <ShellAbout>: dialogs; <ShellNotifications>: the content of the bell's popover;
//   <ShellNotificationsPopover> (ARCH-2085): the whole bell popover, bounded to the viewport (see below).
// - <ShellIdentityMenu> (ARCH-3018): the whole avatar menu (who you are, My account, Theme, Help, About, Sign out, legal links), one
//   component for every app so none of them draws it by hand. It reads only what the bag carries; see its doc.
// - useShellHeaderOffset() (ARCH-2085): the sticky header's height as --shell-header-h and scroll-padding-top on <html>.
// - Create, Profile and Sign out are plain links: `actions.create[i].href`, `actions.profile.href`, `actions.signOut.href`.

export interface ShellRoute { href: string; title: string; group?: string }
export interface ShellRecord { href: string; kind: string; label: string }
export interface ShellCreate { href: string; label?: string }
export interface ShellNotificationItem { title: string; body?: string; at?: string | number | Date }
export interface ShellNotificationsData { items?: readonly ShellNotificationItem[]; unread?: number; href?: string }
export interface ShellActions {
  routes?: readonly ShellRoute[]
  records?: readonly ShellRecord[]
  create?: readonly ShellCreate[]
  notifications?: ShellNotificationsData
  about?: { name?: string; description?: string }
  profile?: { href?: string }
  signOut?: { href?: string }
  // ARCH-3018: optional slots of the identity menu. Nothing builds them today; a row is drawn only when its slot is here (with an href).
  preferences?: IdentityLinkSlot
  billing?: IdentityLinkSlot
  language?: IdentityLanguageSlot
  admin?: IdentityLinkSlot
  /** The legal documents of the footer of the identity menu (Privacy, Terms, ...), in order. */
  legal?: readonly IdentityLegalLink[]
}
export type MaybeShellActions = ShellActions | null | undefined

export interface ShellHas {
  search: boolean
  create: boolean
  notifications: boolean
  help: boolean
  about: boolean
  profile: boolean
  signOut: boolean
}
export interface ShellShortcut { keys: string[]; also?: string; label: string }
export interface DialogState { open: boolean; setOpen: (open: boolean) => void }
export interface ShellDialogProps { actions?: MaybeShellActions; open: boolean; onOpenChange: (open: boolean) => void; /** Where the focus goes when the dialog closes (default: Radix's own). Called with the close-autofocus event. */ onCloseAutoFocus?: (e: Event) => void }

const englishT = makeChrome(null)
const list = <T,>(v: readonly T[] | null | undefined): readonly T[] => (Array.isArray(v) ? v : [])

/** Which controls have something behind them. */
export function hasShellActions(actions?: MaybeShellActions): ShellHas {
  const a: ShellActions = actions ?? {}
  return {
    search: list(a.routes).length + list(a.records).length > 0,
    create: list(a.create).length > 0,
    notifications: !!a.notifications && list(a.notifications.items).length > 0,
    help: true,
    about: !!a.about?.name,
    profile: !!a.profile?.href,
    signOut: !!a.signOut?.href,
  }
}

/** The unread count for the bell, or null when the fixtures do not say (the bell then shows no number). */
export function unreadCount(actions?: MaybeShellActions): number | null {
  const n = actions?.notifications?.unread
  return typeof n === "number" ? n : null
}

/** The shortcuts this module really registers, for the Help dialog. `t` is the chrome translator (useChrome()); without it the text is English. */
export function shortcutsOf(actions?: MaybeShellActions, t: ChromeTranslator = englishT): ShellShortcut[] {
  const has = hasShellActions(actions)
  return [
    ...(has.search ? [{ keys: ["Ctrl", "K"], also: t("kit.shell.shortcutSearchAlso"), label: t("kit.shell.shortcutSearch") }] : []),
    { keys: ["?"], label: t("kit.shell.shortcutHelp") },
    { keys: ["Esc"], label: t("kit.shell.shortcutClose") },
  ]
}

const typing = (t: EventTarget | null): boolean =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))

export function useShellActions(actions?: MaybeShellActions): {
  has: ShellHas
  palette: DialogState
  help: DialogState
  about: DialogState
} {
  const has = hasShellActions(actions)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (has.search && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen((o) => !o); return }
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey && !typing(e.target)) { e.preventDefault(); setHelpOpen(true) }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [has.search])
  return {
    has,
    palette: { open: paletteOpen, setOpen: setPaletteOpen },
    help: { open: helpOpen, setOpen: setHelpOpen },
    about: { open: aboutOpen, setOpen: setAboutOpen },
  }
}

/** Command palette over the surface's screens and fixture records; selecting one navigates to it. */
export function ShellPalette({ actions, open, onOpenChange, placeholder: placeholderProp }: ShellDialogProps & { placeholder?: string }) {
  const t = useChrome()
  const placeholder = placeholderProp ?? t("kit.shell.searchPlaceholder")
  const routes = list(actions?.routes)
  // Close before navigating: with a host router (ARCH-2212) the page does not reload, so an open palette would stay over the new screen.
  const select = (href: string) => { onOpenChange(false); navigateTo(href) }
  const byKind = new Map<string, ShellRecord[]>()
  for (const r of list(actions?.records)) byKind.set(r.kind, [...(byKind.get(r.kind) ?? []), r])
  return (
    <CommandDialog data-vid="r5a8fnl" open={open} onOpenChange={onOpenChange} title={t("kit.shell.searchTitle")} description={placeholder}>
      <Command data-vid="4z70sdq">
        <CommandInput data-vid="45mdfns" placeholder={placeholder} />
        <CommandList data-vid="1l3mhek">
          <CommandEmpty data-vid="0knsiaa">{t("kit.shell.nothingMatches")}</CommandEmpty>
          {routes.length ? (
            <CommandGroup data-vid="q8z3oy6" heading={t("kit.shell.screens")}>
              {routes.map((r) => (
                <CommandItem data-vid="bj1yyl3" key={r.href} value={`screen ${r.title} ${r.group ?? ""}`} onSelect={() => select(r.href)}>{r.title}</CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {[...byKind].map(([kind, rows]) => (
            <CommandGroup data-vid="wji2tp1" key={kind} heading={kind}>
              {rows.map((r) => (
                <CommandItem data-vid="awjnxki" key={r.href} value={`${kind} ${r.label}`} onSelect={() => select(r.href)}>{r.label}</CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}

/** The shortcuts dialog: only the shortcuts this module registers. */
export function ShellHelp({ actions, open, onOpenChange, onCloseAutoFocus }: ShellDialogProps) {
  const t = useChrome()
  return (
    <Dialog data-vid="4cv1xj4" open={open} onOpenChange={onOpenChange}>
      <DialogContent data-vid="bd6r66l" onCloseAutoFocus={onCloseAutoFocus}>
        <DialogHeader data-vid="br8ub9v">
          <DialogTitle data-vid="gbl2owj">{t("kit.shell.helpTitle")}</DialogTitle>
          <DialogDescription data-vid="i664gg4">{t("kit.shell.helpDescription")}</DialogDescription>
        </DialogHeader>
        <ul data-vid="2px97ms" className="flex flex-col gap-3">
          {shortcutsOf(actions, t).map((s) => (
            <li data-vid="ouxgkrv" key={s.label} className="flex items-center justify-between gap-4">
              <span data-vid="giasaa3" className="type-body">{s.label}{s.also ? <span data-vid="2bdgcs5" className="type-meta text-text-muted"> ({s.also})</span> : null}</span>
              <span data-vid="v7b3598" className="flex shrink-0 gap-1">{s.keys.map((k) => <Kbd data-vid="c9y405g" key={k}>{k}</Kbd>)}</span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}

/** The product's name and its own description. */
export function ShellAbout({ actions, open, onOpenChange, onCloseAutoFocus }: ShellDialogProps) {
  const t = useChrome()
  const a = actions?.about
  if (!a?.name) return null
  return (
    <Dialog data-vid="zlifxph" open={open} onOpenChange={onOpenChange}>
      <DialogContent data-vid="b94n4gh" onCloseAutoFocus={onCloseAutoFocus}>
        <DialogHeader data-vid="grmjisq">
          <DialogTitle data-vid="klah9tj">{t("kit.shell.aboutTitle", { name: a.name })}</DialogTitle>
          <DialogDescription data-vid="zphiib9">{a.description || a.name}</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

/** The bell's list: the fixture notifications, newest first, UTC times; a link to the notifications screen when there is one. */
export function ShellNotifications({ actions }: { actions?: MaybeShellActions }) {
  const t = useChrome()
  const n = actions?.notifications
  if (!n || !list(n.items).length) return null
  return (
    <div data-vid="tflr21d" className="flex flex-col gap-3">
      <p data-vid="31iqb9p" className="type-eyebrow text-text-muted">{t("kit.shell.notifications")}</p>
      <ul data-vid="g9djo3p" className="flex flex-col gap-3">
        {list(n.items).map((it, i) => (
          <li data-vid="nkbbe9i" key={i} className="flex flex-col gap-0.5">
            <span data-vid="3zf2aja" className="type-row-title">{it.title}</span>
            {it.body ? <span data-vid="suxftte" className="type-meta text-text-muted">{it.body}</span> : null}
            {it.at ? <span data-vid="sux29gv" className="type-caption text-text-muted">{formatDateTime(it.at)}</span> : null}
          </li>
        ))}
      </ul>
      {n.href ? <a data-vid="1u8n7bm" href={n.href} className="type-meta text-text-link underline">{t("kit.shell.viewAllNotifications")}</a> : null}
    </div>
  )
}

/**
 * The bell: `children` is the trigger element (the shell's bell button; it is wrapped with `asChild`), the popover holds the
 * fixture notifications. Not drawn when there are none. Aligned to the trigger's end, flipped and shifted by Radix so it stays
 * inside the viewport, `data-shell-popover="notifications"` on the content (the lint finds an open shell popover by it).
 */
export function ShellNotificationsPopover({
  actions,
  children,
  align = "end",
  side = "bottom",
  pad = SHELL_POPOVER_PAD,
}: {
  actions?: MaybeShellActions
  children: ReactNode
  align?: "start" | "center" | "end"
  side?: "top" | "right" | "bottom" | "left"
  pad?: number
}): ReactElement | null {
  if (!hasShellActions(actions).notifications) return null
  return (
    <Popover data-vid="b6nz4k8">
      <PopoverTrigger data-vid="8u80wej" asChild>{children}</PopoverTrigger>
      <PopoverContent data-vid="h4vdsah"
        data-shell-popover="notifications"
        align={align}
        side={side}
        collisionPadding={pad}
        style={{ width: shellPopoverWidth(pad), maxWidth: shellPopoverWidth(pad), maxHeight: "var(--radix-popover-content-available-height)", overflowY: "auto" }}
      >
        <ShellNotifications data-vid="s6a7c5d" actions={actions} />
      </PopoverContent>
    </Popover>
  )
}

// ARCH-3018 — the identity menu. Albert's reference (Archie's own account menu): the avatar, then a centred header (large avatar or
// initials, name, role, e-mail), icon rows, a separator, Sign out last, and the legal links as a quiet footer.
//
// - Every row is gated: Profile by `actions.profile.href`, Help by `has.help`, About by `has.about`, Sign out by `has.signOut`, Theme by
//   the design system having a dark mode (`useThemeMode().available`), the footer by `actions.legal`. Preferences, Billing, Language and
//   Admin exist only when the bag carries that slot. No name, role, e-mail, label or href is ever typed here.
// - Theme is the colour-mode store the shell already uses (`@/lib/theme-mode`): one radio group of three, the current value on the row.
// - Help and About open the shell's dialogs when it passes `onHelp` / `onAbout` (the dialogs are the shell's, rendered once at its root);
//   without them the menu renders its own <ShellHelp> / <ShellAbout> as siblings of the menu, so it is self-contained.
// - Sign out is NEUTRAL (PRO.5); `signOutVariant="destructive"` is the one switch if that rule ever flips.
// - `data-fidelity-mask` (gv2's IDENTITY_MASK, spread by the converted shell) lands on the trigger and on the menu: the identity area
//   legitimately differs between the prototype and the app.
// - The DOM keeps the slots gate 08x and the shells key on: `data-slot="persona-name"`, `persona-role`, `persona-email` in the header
//   and `data-slot="identity-menu-footer"` around the legal links (they come after Sign out and are not menu entries of the gate).
export interface ShellIdentityMenuProps {
  persona?: ShellIdentityPersona | null
  actions?: MaybeShellActions
  /** Overrides of what exists (the shell's `has` from useShellActions); merged over `hasShellActions(actions)`. */
  has?: Partial<ShellHas>
  /** The shell's Help dialog opener (`help.setOpen(true)`). Absent: the menu opens its own. */
  onHelp?: () => void
  /** The shell's About dialog opener (`about.setOpen(true)`). Absent: the menu opens its own. */
  onAbout?: () => void
  /** `default` is neutral (rule PRO.5); `destructive` paints the row red. */
  signOutVariant?: "default" | "destructive"
  align?: "start" | "center" | "end"
  side?: "top" | "right" | "bottom" | "left"
  /** Classes of the trigger button (the shell sizes its square slot). */
  className?: string
  "data-fidelity-mask"?: ""
}

const rowClass = "gap-2.5 px-2.5 py-2"
const ICONS = { profile: UserCircle, preferences: SlidersHorizontal, billing: CreditCard, language: Languages, help: HelpCircle, admin: ShieldCheck, about: Info } as const

function IdentityHeader({ persona }: { persona?: ShellIdentityPersona | null }) {
  const name = persona?.name?.trim() ?? ""
  const role = roleTextOf(persona)
  const email = persona?.email?.trim() ?? ""
  const initials = persona?.initials?.trim() || initialsOf(name)
  return (
    <div data-vid="433nyza" data-slot="identity-menu-header" className="flex flex-col items-center gap-1 px-3 pt-4 pb-3 text-center">
      <Avatar data-vid="9p2updk" className="mb-1 size-14">
        <AvatarFallback data-vid="zukqblb" className="text-lg font-medium">{initials || <User data-vid="sz6qwo3" aria-hidden className="size-6" />}</AvatarFallback>
      </Avatar>
      {name ? <p data-vid="h0s2qbh" data-slot="persona-name" className="type-row-title max-w-full truncate">{name}</p> : null}
      {role ? <p data-vid="005t0vw" data-slot="persona-role" className="type-meta max-w-full truncate text-text-muted">{role}</p> : null}
      {email ? <p data-vid="mqh68du" data-slot="persona-email" className="type-meta max-w-full truncate text-text-muted">{email}</p> : null}
    </div>
  )
}

function ThemeRow() {
  const t = useChrome()
  const { mode, setMode } = useThemeMode()
  const Current = mode === "dark" ? Moon : mode === "system" ? Monitor : Sun
  const names = { light: t("kit.shell.themeLight"), dark: t("kit.shell.themeDark"), system: t("kit.shell.themeSystem") }
  return (
    <DropdownMenuSub data-vid="nc46mc2">
      <DropdownMenuSubTrigger data-vid="c00hqmg" className={rowClass} data-slot="identity-menu-theme">
        <Current data-vid="9vjdxfx" aria-hidden className="size-4 text-text-muted" />
        <span data-vid="laonlk1">{t("kit.shell.theme")}</span>{" "}
        <span data-vid="k7s59s8" className="type-meta flex-1 text-right text-text-muted">{names[mode]}</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent data-vid="3zexcz2">
        <DropdownMenuRadioGroup data-vid="2odg9l2" value={mode} onValueChange={setMode} aria-label={t("kit.shell.theme")}>
          <DropdownMenuRadioItem data-vid="tdaojp4" value="light"><Sun data-vid="9gvf50x" aria-hidden className="size-4" />{names.light}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem data-vid="jhv4ff5" value="dark"><Moon data-vid="jheeeu4" aria-hidden className="size-4" />{names.dark}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem data-vid="m3ddhet" value="system"><Monitor data-vid="2pzeuey" aria-hidden className="size-4" />{names.system}</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}

/** The rows of the identity menu (inside a menu content): header, account rows, product rows, Sign out, legal footer. Exported for tests and for hosts that own the container. */
export function ShellIdentityMenuBody({
  persona,
  actions,
  has,
  darkAvailable,
  onHelp,
  onAbout,
  signOutVariant = "default",
}: Pick<ShellIdentityMenuProps, "persona" | "actions" | "onHelp" | "onAbout" | "signOutVariant"> & { has: ShellHas; darkAvailable: boolean }) {
  const t = useChrome()
  const plan = planIdentityMenu({ actions, has, darkAvailable })
  const row = (r: IdentityRow) => {
    switch (r.kind) {
      case "theme":
        return <ThemeRow data-vid="e6gxsf9" key="theme" />
      case "profile":
      case "preferences":
      case "billing":
      case "admin": {
        const Icon = ICONS[r.kind]
        const label = r.label || t(r.kind === "profile" ? "kit.shell.myAccount" : `kit.shell.${r.kind}`)
        return (
          <DropdownMenuItem data-vid="y0i5hpp" key={r.kind} asChild className={rowClass}>
            <a data-vid="nuad4xs" href={r.href}><Icon data-vid="tucfzng" aria-hidden className="text-text-muted" />{label}</a>
          </DropdownMenuItem>
        )
      }
      case "language":
        return (
          <DropdownMenuItem data-vid="1qvr10q" key="language" asChild className={rowClass}>
            {/* the name is "Language: English", not the two spans run together ("LanguageEnglish") */}
            <a data-vid="p81alhk" href={r.href} aria-label={r.value ? `${r.label || t("kit.shell.language")}: ${r.value}` : undefined}>
              <Languages data-vid="h2n4mr5" aria-hidden className="text-text-muted" />
              <span data-vid="vhqkl92">{r.label || t("kit.shell.language")}</span>
              {r.value ? <span data-vid="tgdlgjz" aria-hidden className="type-meta ml-auto text-text-muted">{r.value}</span> : null}
            </a>
          </DropdownMenuItem>
        )
      case "help":
        return (
          <DropdownMenuItem data-vid="k5qy3uc" key="help" className={rowClass} onSelect={onHelp}>
            <HelpCircle data-vid="zslwpb0" aria-hidden className="text-text-muted" />{t("kit.shell.help")}
          </DropdownMenuItem>
        )
      case "about":
        return (
          <DropdownMenuItem data-vid="70izm4a" key="about" className={rowClass} onSelect={onAbout}>
            <Info data-vid="w75kut6" aria-hidden className="text-text-muted" />{t("kit.shell.aboutTitle", { name: r.label ?? "" })}
          </DropdownMenuItem>
        )
      case "signOut":
        return (
          <DropdownMenuItem data-vid="qjitlrf" key="signOut" asChild variant={signOutVariant} className={rowClass}>
            <a data-vid="j3zhexo" href={r.href}><LogOut data-vid="ceabuhn" aria-hidden className={cn(signOutVariant === "default" && "text-text-muted")} />{t("kit.shell.signOut")}</a>
          </DropdownMenuItem>
        )
      default:
        return null
    }
  }
  return (
    <>
      <IdentityHeader data-vid="axda8rv" persona={persona} />
      {plan.account.length ? <><DropdownMenuSeparator data-vid="4hotmly" />{plan.account.map(row)}</> : null}
      {plan.product.length ? <><DropdownMenuSeparator data-vid="sap1mk7" />{plan.product.map(row)}</> : null}
      {plan.signOut ? <><DropdownMenuSeparator data-vid="dl1my0r" />{row(plan.signOut)}</> : null}
      {plan.legal.length ? (
        <DropdownMenuGroup data-vid="n1mjq7d" aria-label={t("kit.shell.legal")} data-slot="identity-menu-footer" className="flex flex-wrap justify-center gap-x-1 border-t border-border px-1 pt-1.5 pb-1 mt-1">
          {plan.legal.map((l) => (
            <DropdownMenuItem data-vid="9pbwmtf" key={`${l.href}|${l.label}`} asChild className="type-caption w-auto px-1.5 py-0.5 text-text-muted">
              <a data-vid="v0olsh5" href={l.href}>{l.label}</a>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      ) : null}
    </>
  )
}

/**
 * The identity menu: the avatar button (initials from `persona.name`) that opens the account menu. `<ShellIdentityMenu persona={persona} actions={actions} />`.
 * Not drawn as a control by itself: the shell decides where it sits (right-most of the utility group) and sizes it with `className`.
 */
export function ShellIdentityMenu({
  persona,
  actions,
  has: hasOverride,
  onHelp,
  onAbout,
  signOutVariant = "default",
  align = "end",
  side = "bottom",
  className,
  "data-fidelity-mask": mask,
}: ShellIdentityMenuProps): ReactElement {
  const t = useChrome()
  const { available } = useThemeMode()
  const [helpOpen, setHelpOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  // A dialog opened from a menu item: the menu is non-modal (a modal one can leave `pointer-events: none` on <body> when a dialog opens as it
  // closes), the callback runs after the menu has closed (a tick later, never inside onSelect), and the menu's close-autofocus is skipped so it
  // does not steal the focus the dialog just took. A dialog this component owns gives the focus back to the trigger when it closes.
  const dialogNext = useRef(false)
  const later = (open: () => void) => () => { dialogNext.current = true; setTimeout(open, 0) }
  const focusTrigger = (e: Event) => { e.preventDefault(); triggerRef.current?.focus() }
  const has: ShellHas = { ...hasShellActions(actions), ...hasOverride }
  const name = persona?.name?.trim() ?? ""
  const initials = persona?.initials?.trim() || initialsOf(name)
  const maskProps = mask === undefined ? {} : { "data-fidelity-mask": mask }
  return (
    <>
      <DropdownMenu data-vid="dcnll5c" modal={false}>
        <DropdownMenuTrigger data-vid="e8d7vwo" asChild>
          <button data-vid="c2glk2e"
            ref={triggerRef}
            type="button"
            aria-label={name ? `${t("kit.shell.account")}: ${name}` : t("kit.shell.account")}
            data-slot="identity-menu-trigger"
            {...maskProps}
            className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring max-md:size-11", className)}
          >
            <Avatar data-vid="0zbejrq">
              <AvatarFallback data-vid="9wpkg3c">{initials || <User data-vid="jn1zo7h" aria-hidden className="size-4" />}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent data-vid="zd8nefn"
          align={align}
          side={side}
          collisionPadding={SHELL_POPOVER_PAD}
          data-shell-popover="identity"
          onCloseAutoFocus={(e) => { if (dialogNext.current) { e.preventDefault(); dialogNext.current = false } }}
          {...maskProps}
          className="w-72 max-w-[calc(100vw-1.5rem)] p-1"
        >
          <ShellIdentityMenuBody data-vid="hqgho5x"
            persona={persona}
            actions={actions}
            has={has}
            darkAvailable={available}
            signOutVariant={signOutVariant}
            onHelp={later(onHelp ?? (() => setHelpOpen(true)))}
            onAbout={later(onAbout ?? (() => setAboutOpen(true)))}
          />
        </DropdownMenuContent>
      </DropdownMenu>
      {onHelp ? null : <ShellHelp data-vid="d3d51tg" actions={actions} open={helpOpen} onOpenChange={setHelpOpen} onCloseAutoFocus={focusTrigger} />}
      {onAbout ? null : <ShellAbout data-vid="fvk1ayc" actions={actions} open={aboutOpen} onOpenChange={setAboutOpen} onCloseAutoFocus={focusTrigger} />}
    </>
  )
}

// ARCH-2085: a sticky header must not cover the first heading or an anchor target. The shell puts the returned ref on its header; the
// header's height is published as --shell-header-h on <html> (for `scroll-mt-(--shell-header-h)`, `pt-(--shell-header-h)` under a fixed
// header) and as scroll-padding-top, so anchors and scrollIntoView land below it. Measured in an effect (never during render:
// hydration-safe) and kept current by a ResizeObserver; removed on unmount.
export function useShellHeaderOffset(): (el: HTMLElement | null) => void {
  // a callback ref (a state setter): a header that mounts later, or is swapped, is measured when it appears
  const [el, setEl] = useState<HTMLElement | null>(null)
  useEffect(() => {
    if (!el) return undefined
    const root = document.documentElement
    let wrote = false
    const measure = () => {
      // a header hidden at this width (a desktop bar next to a phone bar) has no boxes: it never writes
      if (el.getClientRects().length === 0) return
      applyShellHeaderOffset(root, el.getBoundingClientRect().height)
      wrote = true
    }
    measure()
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure)
    ro?.observe(el, { box: "border-box" })
    return () => { ro?.disconnect(); if (wrote) clearShellHeaderOffset(root) }
  }, [el])
  return setEl
}
