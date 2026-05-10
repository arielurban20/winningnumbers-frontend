export interface FAQItem {
  question: string
  answer: string
}

export const generalFAQs: FAQItem[] = [
  {
    question: "How often are lottery results updated?",
    answer:
      "Lottery results are updated as soon as possible after each drawing. Most results are available within minutes of the official drawing.",
  },
  {
    question: "Are these official lottery results?",
    answer:
      "While we strive for accuracy, these results are unofficial. Always verify winning numbers with your official state lottery commission before claiming any prizes.",
  },
  {
    question: "What time are lottery drawings held?",
    answer:
      "Drawing times vary by game and state. National games like Powerball draw at 10:59 PM ET and Mega Millions at 11:00 PM ET. State games have various drawing times, often with midday and evening sessions.",
  },
  {
    question: "How do I claim a lottery prize?",
    answer:
      "Prize claim procedures vary by state and prize amount. Small prizes can often be claimed at retailers, while larger prizes may require visiting a lottery office. Check your state lottery website for specific instructions.",
  },
]

export const powerballFAQs: FAQItem[] = [
  {
    question: "What are the Powerball drawing days?",
    answer:
      "Powerball drawings are held every Monday, Wednesday, and Saturday at 10:59 PM Eastern Time.",
  },
  {
    question: "What is Power Play?",
    answer:
      "Power Play is an optional add-on that multiplies non-jackpot prizes by 2x, 3x, 4x, 5x, or 10x (10x available when jackpot is under $150 million). It costs an additional $1 per play.",
  },
  {
    question: "What are the odds of winning Powerball?",
    answer:
      "The odds of winning the Powerball jackpot are 1 in 292.2 million. The overall odds of winning any prize are approximately 1 in 24.9.",
  },
]

export const megaMillionsFAQs: FAQItem[] = [
  {
    question: "What are the Mega Millions drawing days?",
    answer:
      "Mega Millions drawings are held every Tuesday and Friday at 11:00 PM Eastern Time.",
  },
  {
    question: "What is Megaplier?",
    answer:
      "Megaplier is an optional add-on that multiplies non-jackpot prizes by 2x, 3x, 4x, or 5x. It costs an additional $1 per play.",
  },
  {
    question: "What are the odds of winning Mega Millions?",
    answer:
      "The odds of winning the Mega Millions jackpot are 1 in 302.5 million. The overall odds of winning any prize are approximately 1 in 24.",
  },
]

export const pickGameFAQs: FAQItem[] = [
  {
    question: "What is the difference between Straight and Box?",
    answer:
      "In a Straight bet, numbers must match in exact order. In a Box bet, numbers can match in any order. Straight pays more but is harder to win.",
  },
  {
    question: "How often are Pick games drawn?",
    answer:
      "Most Pick games have multiple drawings per day, typically a midday/afternoon drawing and an evening drawing.",
  },
  {
    question: "What are the Pick 3 odds?",
    answer:
      "For a $1 Straight bet, the odds are 1 in 1,000. For a 3-way Box, odds are 1 in 333. For a 6-way Box, odds are 1 in 167.",
  },
]

export function getFAQsForGame(familySlug: string): FAQItem[] {
  if (familySlug === "powerball") return powerballFAQs
  if (familySlug === "mega-millions") return megaMillionsFAQs
  if (familySlug.includes("pick")) return pickGameFAQs
  return generalFAQs
}
