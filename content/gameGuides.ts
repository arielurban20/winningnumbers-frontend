export interface GameGuide {
  title: string
  description: string[]
  howToPlay: string[]
  odds?: string
}

export const gameGuides: Record<string, GameGuide> = {
  powerball: {
    title: "Powerball",
    description: [
      "Powerball is a multi-state lottery game with jackpots that can reach hundreds of millions of dollars. It is played in 45 states, the District of Columbia, Puerto Rico, and the US Virgin Islands.",
      "Drawings are held every Monday, Wednesday, and Saturday at 10:59 PM ET. The jackpot starts at $20 million and grows until someone wins.",
    ],
    howToPlay: [
      "Select 5 numbers from 1-69 for the white balls",
      "Select 1 number from 1-26 for the red Powerball",
      "Optional: Add Power Play for 2x-10x non-jackpot prizes",
      "Match all 6 numbers to win the jackpot",
    ],
    odds: "1 in 292.2 million",
  },
  "mega-millions": {
    title: "Mega Millions",
    description: [
      "Mega Millions is one of America's biggest lottery games with jackpots that frequently exceed $100 million. It is played in 45 states, the District of Columbia, and the US Virgin Islands.",
      "Drawings are held every Tuesday and Friday at 11:00 PM ET. The jackpot starts at $20 million and increases with each rollover.",
    ],
    howToPlay: [
      "Select 5 numbers from 1-70 for the white balls",
      "Select 1 number from 1-25 for the gold Mega Ball",
      "Optional: Add Megaplier for 2x-5x non-jackpot prizes",
      "Match all 6 numbers to win the jackpot",
    ],
    odds: "1 in 302.5 million",
  },
  "pick-3": {
    title: "Pick 3",
    description: [
      "Pick 3 is a daily lottery game where players select three numbers. It offers multiple ways to play and win with different bet types.",
      "Drawings are typically held twice daily, offering morning/day and evening/night sessions in most states.",
    ],
    howToPlay: [
      "Select 3 numbers from 0-9",
      "Choose your play type: Straight, Box, or Combo",
      "Select your wager amount",
      "Win by matching numbers in your chosen play style",
    ],
  },
  "pick-4": {
    title: "Pick 4",
    description: [
      "Pick 4 is a daily lottery game similar to Pick 3 but with four numbers. It offers larger prizes with the same play types and flexibility.",
      "Drawings are typically held twice daily in most states.",
    ],
    howToPlay: [
      "Select 4 numbers from 0-9",
      "Choose your play type: Straight, Box, or Combo",
      "Select your wager amount",
      "Win by matching numbers in your chosen play style",
    ],
  },
  default: {
    title: "Lottery Game",
    description: [
      "This lottery game offers chances to win prizes by matching numbers. Check the latest results and past draws to see winning numbers.",
      "Play responsibly and verify all results with your official state lottery commission.",
    ],
    howToPlay: [
      "Select your numbers according to the game rules",
      "Purchase your ticket before the drawing cutoff",
      "Watch the drawing or check results online",
      "Claim any prizes according to your state's rules",
    ],
  },
}

export function getGameGuide(familySlug: string): GameGuide {
  return gameGuides[familySlug] || gameGuides.default
}
