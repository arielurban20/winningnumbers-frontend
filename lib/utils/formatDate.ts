import { format, parseISO, isValid, formatDistanceToNow } from "date-fns"

/**
 * Format a date string for display
 * @param dateString - ISO date string (YYYY-MM-DD or full ISO)
 * @param formatStr - date-fns format string
 */
export function formatDate(
  dateString: string | undefined | null,
  formatStr: string = "MMM d, yyyy"
): string {
  if (!dateString) return ""
  
  try {
    const date = parseISO(dateString)
    if (!isValid(date)) return dateString
    return format(date, formatStr)
  } catch {
    return dateString
  }
}

/**
 * Format date for display in results (e.g., "Jan 15, 2024")
 */
export function formatDrawDate(dateString: string | undefined | null): string {
  return formatDate(dateString, "MMM d, yyyy")
}

/**
 * Format date with day of week (e.g., "Monday, Jan 15, 2024")
 */
export function formatFullDate(dateString: string | undefined | null): string {
  return formatDate(dateString, "EEEE, MMM d, yyyy")
}

/**
 * Format date for CSV export (YYYY-MM-DD)
 */
export function formatDateForCSV(dateString: string | undefined | null): string {
  return formatDate(dateString, "yyyy-MM-dd")
}

/**
 * Format date for sitemap lastmod (YYYY-MM-DD)
 */
export function formatDateForSitemap(dateString: string | undefined | null): string {
  return formatDate(dateString, "yyyy-MM-dd")
}

/**
 * Get relative time from now (e.g., "2 days ago")
 */
export function formatRelativeTime(dateString: string | undefined | null): string {
  if (!dateString) return ""
  
  try {
    const date = parseISO(dateString)
    if (!isValid(date)) return ""
    return formatDistanceToNow(date, { addSuffix: true })
  } catch {
    return ""
  }
}

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 */
export function getTodayISO(): string {
  return format(new Date(), "yyyy-MM-dd")
}

/**
 * Get date X days ago as ISO string
 */
export function getDateDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return format(date, "yyyy-MM-dd")
}
