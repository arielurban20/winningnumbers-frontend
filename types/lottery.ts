// Domain model types for lottery display

export type DrawStatusColor = "green" | "gray"

export interface NumberBallProps {
  number: number
  statusColor: DrawStatusColor
  size?: "sm" | "md" | "lg"
  ariaLabel?: string
}

export interface BonusBallProps {
  number: number | string
  colorHex: string
  label: string
  size?: "sm" | "md" | "lg"
}

export interface ExtraItemProps {
  label: string
  value: string | number
  colorHex?: string
}

export interface GameCardData {
  id: number
  name: string
  slug: string
  stateName: string
  stateSlug: string
  drawDate: string
  mainNumbers: number[]
  bonusItems: {
    label: string
    number: number | string
    colorHex: string
  }[]
  extraItems: {
    label: string
    value: string | number
    colorHex?: string
  }[]
  jackpotNext?: string
  jackpotChange?: string
  nextDrawText?: string
  nextDrawRelative?: string
  statusColor: DrawStatusColor
  logoUrl?: string
}

export interface SessionTabData {
  id: string
  label: string
  slug: string
}

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface CSVExportRow {
  date: string
  state: string
  game: string
  session: string
  main_numbers: string
  bonus_items: string
  extra_items: string
  jackpot_next: string
}

export interface DateRange {
  startDate: Date
  endDate: Date
}

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}
