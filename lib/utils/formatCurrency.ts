/**
 * Format a jackpot amount for display
 * Handles strings like "$100 Million", "$1.5 Billion", or numeric values
 */
export function formatJackpot(value: string | number | undefined | null): string {
  if (!value) return ""
  
  // If it's already a formatted string, return it
  if (typeof value === "string") {
    // Check if it looks like a formatted amount
    if (value.includes("Million") || value.includes("Billion") || value.includes("$")) {
      return value
    }
    
    // Try to parse as number
    const num = parseFloat(value.replace(/[^0-9.-]/g, ""))
    if (isNaN(num)) return value
    value = num
  }
  
  // Format numeric value
  if (typeof value === "number") {
    if (value >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(1)} Billion`
    }
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(0)} Million`
    }
    if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(0)}K`
    }
    return `$${value.toLocaleString()}`
  }
  
  return String(value)
}

/**
 * Format jackpot change indicator
 */
export function formatJackpotChange(change: string | undefined | null): {
  text: string
  isIncrease: boolean
} {
  if (!change) return { text: "", isIncrease: false }
  
  const isIncrease = change.includes("+") || change.toLowerCase().includes("up")
  
  return {
    text: change,
    isIncrease,
  }
}

/**
 * Format a price value
 */
export function formatPrice(price: number | undefined | null): string {
  if (!price) return ""
  return `$${price.toFixed(2)}`
}
