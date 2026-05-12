export type JackpotGameKey = "powerball" | "mega-millions"

export interface JackpotHistoryEntry {
  rank: number
  prize: string
  amountMillions: number
  date: string
  lotteryOrState: string
  winners?: string
}

export interface JackpotHistoryGameData {
  gameKey: JackpotGameKey
  gameName: string
  heading: string
  intro: string
  sourceLabel: string
  sourceUrl: string
  entries: JackpotHistoryEntry[]
  updatedAt: string
}

export interface CombinedJackpotEntry extends JackpotHistoryEntry {
  gameKey: JackpotGameKey
  gameName: string
}

export const jackpotHistoryByGame: Record<JackpotGameKey, JackpotHistoryGameData> = {
  powerball: {
    gameKey: "powerball",
    gameName: "Powerball",
    heading: "Top 10 Powerball Jackpots",
    intro:
      "These are the largest Powerball jackpots published by the official Powerball Media Center.",
    sourceLabel: "Official Powerball Media Center",
    sourceUrl: "https://www.powerball.com/media-center",
    updatedAt: "2026-05-11",
    entries: [
      { rank: 1, prize: "$2.040 Billion", amountMillions: 2040, date: "Nov. 7, 2022", lotteryOrState: "California", winners: "1 winner" },
      { rank: 2, prize: "$1.817 Billion", amountMillions: 1817, date: "Dec. 24, 2025", lotteryOrState: "Arkansas", winners: "1 winner" },
      { rank: 3, prize: "$1.787 Billion", amountMillions: 1787, date: "Sept. 6, 2025", lotteryOrState: "Missouri, Texas", winners: "2 winners" },
      { rank: 4, prize: "$1.765 Billion", amountMillions: 1765, date: "Oct. 11, 2023", lotteryOrState: "California", winners: "1 winner" },
      { rank: 5, prize: "$1.586 Billion", amountMillions: 1586, date: "Jan. 13, 2016", lotteryOrState: "California, Florida, Tennessee", winners: "3 winners" },
      { rank: 6, prize: "$1.326 Billion", amountMillions: 1326, date: "Apr. 6, 2024", lotteryOrState: "Oregon", winners: "1 winner" },
      { rank: 7, prize: "$1.080 Billion", amountMillions: 1080, date: "July 19, 2023", lotteryOrState: "California", winners: "1 winner" },
      { rank: 8, prize: "$842.4 Million", amountMillions: 842.4, date: "Jan. 1, 2024", lotteryOrState: "Michigan", winners: "1 winner" },
      { rank: 9, prize: "$768.4 Million", amountMillions: 768.4, date: "Mar. 27, 2019", lotteryOrState: "Wisconsin", winners: "1 winner" },
      { rank: 10, prize: "$758.7 Million", amountMillions: 758.7, date: "Aug. 23, 2017", lotteryOrState: "Massachusetts", winners: "1 winner" },
    ],
  },
  "mega-millions": {
    gameKey: "mega-millions",
    gameName: "Mega Millions",
    heading: "Top 10 Mega Millions Jackpots",
    intro:
      "These are the largest Mega Millions jackpots published by the official Mega Millions jackpot history page.",
    sourceLabel: "Official Mega Millions Jackpot History",
    sourceUrl: "https://www.megamillions.com/About/Jackpot-History.aspx",
    updatedAt: "2026-05-11",
    entries: [
      { rank: 1, prize: "$1.602 Billion", amountMillions: 1602, date: "Aug. 8, 2023", lotteryOrState: "Florida", winners: "1 winner" },
      { rank: 2, prize: "$1.537 Billion", amountMillions: 1537, date: "Oct. 23, 2018", lotteryOrState: "South Carolina", winners: "1 winner" },
      { rank: 3, prize: "$1.348 Billion", amountMillions: 1348, date: "Jan. 13, 2023", lotteryOrState: "Maine", winners: "1 winner" },
      { rank: 4, prize: "$1.337 Billion", amountMillions: 1337, date: "July 29, 2022", lotteryOrState: "Illinois", winners: "1 winner" },
      { rank: 5, prize: "$1.269 Billion", amountMillions: 1269, date: "Dec. 27, 2024", lotteryOrState: "California", winners: "1 winner" },
      { rank: 6, prize: "$1.128 Billion", amountMillions: 1128, date: "Mar. 26, 2024", lotteryOrState: "New Jersey", winners: "1 winner" },
      { rank: 7, prize: "$1.050 Billion", amountMillions: 1050, date: "Jan. 22, 2021", lotteryOrState: "Michigan", winners: "1 winner" },
      { rank: 8, prize: "$983 Million", amountMillions: 983, date: "Nov. 14, 2025", lotteryOrState: "Georgia", winners: "1 winner" },
      { rank: 9, prize: "$810 Million", amountMillions: 810, date: "Sept. 10, 2024", lotteryOrState: "Texas", winners: "1 winner" },
      { rank: 10, prize: "$656 Million", amountMillions: 656, date: "Mar. 30, 2012", lotteryOrState: "Illinois, Kansas, Maryland", winners: "3 winners" },
    ],
  },
}

export function getJackpotHistory(gameKey: JackpotGameKey): JackpotHistoryGameData {
  return jackpotHistoryByGame[gameKey]
}

export function getCombinedTopJackpots(limit = 5): CombinedJackpotEntry[] {
  const all: CombinedJackpotEntry[] = Object.values(jackpotHistoryByGame).flatMap((game) =>
    game.entries.map((entry) => ({
      ...entry,
      gameKey: game.gameKey,
      gameName: game.gameName,
    }))
  )

  return all
    .sort((a, b) => b.amountMillions - a.amountMillions)
    .slice(0, limit)
}

