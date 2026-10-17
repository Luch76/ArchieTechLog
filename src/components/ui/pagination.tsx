import * as React from "react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react"
import { useChrome } from "@/lib/i18n"

function Pagination({
  className,
  ...props
}: React.ComponentProps<"nav">) {
  const t = useChrome()
  return (
    <nav data-vid="2o4b2g9"
      role="navigation"
      aria-label={t("kit.pagination.label")}
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul data-vid="aoxpmyn"
      data-slot="pagination-content"
      className={cn("flex items-center gap-0.5", className)}
      {...props}
    />
  )
}

function PaginationItem({
  ...props
}: React.ComponentProps<"li">) {
  return <li data-vid="lwhzurz" data-slot="pagination-item" {...props} />
}

function PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}: {
  isActive?: boolean
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"a">) {
  return (
    <Button data-vid="5u278mn"
      asChild
      variant={isActive ? "outline" : "ghost"}
      size={size}
      className={cn(className)}
    >
      <a data-vid="6czwkfz"
        aria-current={isActive ? "page" : undefined}
        data-slot="pagination-link"
        data-active={isActive}
        {...props}
      />
    </Button>
  )
}

function PaginationPrevious({
  className,
  text,
  ...props
}: React.ComponentProps<typeof PaginationLink> & {
  text?: string
}) {
  const t = useChrome()
  return (
    <PaginationLink data-vid="5dh1bwd"
      aria-label={t("kit.pagination.goPrevious")}
      size="default"
      className={cn("pl-1.5!", className)}
      {...props}
    >
      <ChevronLeftIcon data-vid="hkor3pm" data-icon="inline-start" />
      <span data-vid="ol9ekrv" className="hidden sm:block">{text ?? t("kit.pagination.previous")}</span>
    </PaginationLink>
  )
}

function PaginationNext({
  className,
  text,
  ...props
}: React.ComponentProps<typeof PaginationLink> & {
  text?: string
}) {
  const t = useChrome()
  return (
    <PaginationLink data-vid="pm028hf"
      aria-label={t("kit.pagination.goNext")}
      size="default"
      className={cn("pr-1.5!", className)}
      {...props}
    >
      <span data-vid="45zfre3" className="hidden sm:block">{text ?? t("kit.pagination.next")}</span>
      <ChevronRightIcon data-vid="iq4cfv1" data-icon="inline-end" />
    </PaginationLink>
  )
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  const t = useChrome()
  return (
    <span data-vid="pezk5wr"
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn(
        "flex size-8 items-center justify-center [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <MoreHorizontalIcon data-vid="1o94t6h"
      />
      <span data-vid="ezj479l" className="sr-only">{t("kit.pagination.more")}</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
