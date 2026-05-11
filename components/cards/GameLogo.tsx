"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface GameLogoProps {
  logoUrl?: string
  logo?: string
  iconUrl?: string
  gameName: string
  gameSlug?: string
  stateSlug?: string
  sourceGameSlug?: string
  isMultistate?: boolean
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  priority?: boolean
}

const sizeClasses = {
  sm: "h-10 w-10",
  md: "h-14 w-14",
  lg: "h-20 w-20",
  xl: "h-28 w-28",
}

const imageSizes = {
  sm: 40,
  md: 56,
  lg: 80,
  xl: 112,
}

const textSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-lg",
  xl: "text-xl",
}

// All US state abbreviations for stripping from slugs (includes xx for multistate)
const STATE_ABBREVS = [
  "al", "ak", "az", "ar", "ca", "co", "ct", "de", "dc", "fl", "ga", "hi", "id",
  "il", "in", "ia", "ks", "ky", "la", "me", "md", "ma", "mi", "mn", "ms", "mo",
  "mt", "ne", "nv", "nh", "nj", "nm", "ny", "nc", "nd", "oh", "ok", "or", "pa",
  "pr", "ri", "sc", "sd", "tn", "tx", "ut", "vt", "va", "wa", "wv", "wi", "wy",
  "xx" // multistate marker
]

// Session/time-of-day suffixes to strip for family-level logo matching
const SESSION_SUFFIXES = [
  // Time periods
  "morning",
  "midday", 
  "daytime",
  "day",
  "evening",
  "eve",
  "night",
  "mid",
  "late-night",
  "early-bird",
  "matinee",
  // Creative time names
  "drive-time",
  "primetime",
  "prime-time",
  "night-owl",
  "lunch-rush",
  "clock-out-cash",
  "midnight-money",
  "morning-buzz",
  "after-hours",
  "coffee-break",
  "lunch-break",
  "rush-hour",
  "brunch",
  "suppertime",
  "afternoon",
  "late-morning",
  // Specific times
  "1pm",
  "6pm", 
  "9am",
  "10pm",
  "11pm",
  "4pm",
  "7pm",
  "1-50pm",
  "7-50pm",
  "11-30pm",
]

// Known multi-state games
const MULTISTATE_GAMES = [
  "powerball",
  "mega-millions",
  "megamillions",
  "lotto-america",
  "lucky-for-life",
  "cash4life",
  "cash-4-life",
  "2by2",
  "millionaire-for-life",
  "powerball-double-play",
]

/**
 * Complete local logos mapping for instant loading (260+ logos)
 * These are served directly from /public/logos/ folder
 * Logos here load instantly with ZERO API latency
 * 
 * Format: "{state}-{game-slug}": "/logos/{filename}"
 * The system tries multiple variations automatically
 */
const LOCAL_LOGOS: Record<string, string> = {
  // Arkansas
  "ar-cash3": "/logos/ar-cash3-1.svg",
  "ar-cash-3": "/logos/ar-cash3-1.svg",
  "ar-cash4": "/logos/ar-cash4-1.svg",
  "ar-cash-4": "/logos/ar-cash4-1.svg",
  "ar-lotto": "/logos/ar-lotto-1.svg",
  "ar-naturalstatejackpot": "/logos/ar-naturalstatejackpot-1.svg",
  "ar-natural-state-jackpot": "/logos/ar-naturalstatejackpot-1.svg",
  "ar-powerball": "/logos/ar-powerball.svg",
  // Arizona
  "az-fantasy5": "/logos/az-fantasy5.svg",
  "az-fantasy-5": "/logos/az-fantasy5.svg",
  "az-pick3": "/logos/az-pick3.svg",
  "az-pick-3": "/logos/az-pick3.svg",
  "az-powerball": "/logos/az-powerball.svg",
  "az-thepick": "/logos/az-thepick.svg",
  "az-the-pick": "/logos/az-thepick.svg",
  "az-tripletwist": "/logos/az-tripletwist.svg",
  "az-triple-twist": "/logos/az-tripletwist.svg",
  // California
  "ca-daily3": "/logos/ca-daily3.svg",
  "ca-daily-3": "/logos/ca-daily3.svg",
  "ca-daily4": "/logos/ca-daily4.svg",
  "ca-daily-4": "/logos/ca-daily4.svg",
  "ca-dailyderby": "/logos/ca-dailyderby.svg",
  "ca-daily-derby": "/logos/ca-dailyderby.svg",
  "ca-fantasy5": "/logos/ca-fantasy5.svg",
  "ca-fantasy-5": "/logos/ca-fantasy5.svg",
  "ca-megamillions": "/logos/ca-megamillions-1.svg",
  "ca-mega-millions": "/logos/ca-megamillions-1.svg",
  "ca-powerball": "/logos/ca-powerball.svg",
  "ca-superlottoplus": "/logos/ca-superlottoplus.svg",
  "ca-superlotto-plus": "/logos/ca-superlottoplus.svg",
  // Colorado
  "co-cash5": "/logos/co-cash5-1.svg",
  "co-cash-5": "/logos/co-cash5-1.svg",
  "co-coloradolottoplus": "/logos/co-colorado-lotto.svg",
  "co-colorado-lotto-plus": "/logos/co-colorado-lotto.svg",
  "co-colorado-lotto": "/logos/co-colorado-lotto.svg",
  "co-megamillions": "/logos/co-megamillions-1.svg",
  "co-mega-millions": "/logos/co-megamillions-1.svg",
  "co-pick3": "/logos/co-pick3-1.svg",
  "co-pick-3": "/logos/co-pick3-1.svg",
  "co-powerball": "/logos/co-powerball-1.svg",
  // Connecticut
  "ct-cash5": "/logos/ct-cash5.svg",
  "ct-cash-5": "/logos/ct-cash5.svg",
  "ct-lotto": "/logos/ct-lotto.svg",
  "ct-megamillions": "/logos/ct-megamillions-1.svg",
  "ct-mega-millions": "/logos/ct-megamillions-1.svg",
  "ct-play3": "/logos/ct-play3.svg",
  "ct-play-3": "/logos/ct-play3.svg",
  "ct-play4": "/logos/ct-play4.svg",
  "ct-play-4": "/logos/ct-play4.svg",
  "ct-powerball": "/logos/ct-powerball.svg",
  // DC
  "dc-dc3": "/logos/dc-dc3.svg",
  "dc-dc-3": "/logos/dc-dc3.svg",
  "dc-dc4": "/logos/dc-dc4.svg",
  "dc-dc-4": "/logos/dc-dc4.svg",
  "dc-dc5": "/logos/dc-dc5.svg",
  "dc-dc-5": "/logos/dc-dc5.svg",
  "dc-megamillions": "/logos/dc-megamillions-1.svg",
  "dc-mega-millions": "/logos/dc-megamillions-1.svg",
  // Delaware
  "de-multiwinlotto": "/logos/de-multiwinlotto.svg",
  "de-multi-win-lotto": "/logos/de-multiwinlotto.svg",
  "de-play3": "/logos/de-play3.svg",
  "de-play-3": "/logos/de-play3.svg",
  "de-play4": "/logos/de-play4.svg",
  "de-play-4": "/logos/de-play4.svg",
  "de-play5": "/logos/de-play5-1.svg",
  "de-play-5": "/logos/de-play5-1.svg",
  // Florida
  "fl-cashpop": "/logos/fl-cashpop.svg",
  "fl-cash-pop": "/logos/fl-cashpop.svg",
  "fl-fantasy5": "/logos/fl-fantasy5-1.svg",
  "fl-fantasy-5": "/logos/fl-fantasy5-1.svg",
  "fl-jackpottripleplay": "/logos/fl-jackpottripleplay.svg",
  "fl-jackpot-triple-play": "/logos/fl-jackpottripleplay.svg",
  "fl-lotto": "/logos/fl-lotto.svg",
  "fl-megamillions": "/logos/fl-megamillions-1.svg",
  "fl-mega-millions": "/logos/fl-megamillions-1.svg",
  "fl-pick2": "/logos/fl-pick2.svg",
  "fl-pick-2": "/logos/fl-pick2.svg",
  "fl-pick3": "/logos/fl-pick3.svg",
  "fl-pick-3": "/logos/fl-pick3.svg",
  "fl-pick4": "/logos/fl-pick4.svg",
  "fl-pick-4": "/logos/fl-pick4.svg",
  "fl-pick5": "/logos/fl-pick5.svg",
  "fl-pick-5": "/logos/fl-pick5.svg",
  "fl-powerball": "/logos/fl-powerball.svg",
  "fl-powerball-dp": "/logos/fl-powerball-dp.svg",
  "fl-powerball-double-play": "/logos/fl-powerball-dp.svg",
  // Georgia
  "ga-cash3": "/logos/ga-cash3.svg",
  "ga-cash-3": "/logos/ga-cash3.svg",
  "ga-cash4": "/logos/ga-cash4.svg",
  "ga-cash-4": "/logos/ga-cash4.svg",
  "ga-cashpop": "/logos/ga-cashpop-4x.png",
  "ga-cash-pop": "/logos/ga-cashpop-4x.png",
  "ga-fantasy5": "/logos/ga-fantasy5.svg",
  "ga-fantasy-5": "/logos/ga-fantasy5.svg",
  "ga-georgiafive": "/logos/ga-georgiafive.svg",
  "ga-georgia-five": "/logos/ga-georgiafive.svg",
  "ga-powerball": "/logos/ga-powerball.svg",
  // Iowa
  "ia-pick3": "/logos/ia-pick3-1.svg",
  "ia-pick-3": "/logos/ia-pick3-1.svg",
  "ia-pick4": "/logos/ia-pick4-1.svg",
  "ia-pick-4": "/logos/ia-pick4-1.svg",
  "ia-powerball": "/logos/ia-powerball-1.svg",
  // Idaho
  "id-idahocash": "/logos/id-idahocash-1.svg",
  "id-idaho-cash": "/logos/id-idahocash-1.svg",
  "id-pick3": "/logos/id-pick3-1.svg",
  "id-pick-3": "/logos/id-pick3-1.svg",
  "id-pick4": "/logos/id-pick4-1.svg",
  "id-pick-4": "/logos/id-pick4-1.svg",
  "id-powerball": "/logos/id-powerball.svg",
  // Illinois
  "il-lotto": "/logos/il-lotto.svg",
  "il-luckydaylotto": "/logos/il-luckydaylotto.svg",
  "il-lucky-day-lotto": "/logos/il-luckydaylotto.svg",
  "il-pick3": "/logos/il-pick3.svg",
  "il-pick-3": "/logos/il-pick3.svg",
  "il-pick4": "/logos/il-pick4.svg",
  "il-pick-4": "/logos/il-pick4.svg",
  "il-powerball": "/logos/il-powerball.svg",
  // Indiana
  "in-cash5": "/logos/in-cash5-1.svg",
  "in-cash-5": "/logos/in-cash5-1.svg",
  "in-cashpop": "/logos/in-cashpop-1.svg",
  "in-cash-pop": "/logos/in-cashpop-1.svg",
  "in-daily3": "/logos/in-daily3-1.svg",
  "in-daily-3": "/logos/in-daily3-1.svg",
  "in-daily4": "/logos/in-daily4-1.svg",
  "in-daily-4": "/logos/in-daily4-1.svg",
  "in-hoosierlotto": "/logos/in-hoosierlotto-1.svg",
  "in-hoosier-lotto": "/logos/in-hoosierlotto-1.svg",
  "in-hoosierlottoplus": "/logos/in-hoosierlottoplus-1.svg",
  "in-hoosier-lotto-plus": "/logos/in-hoosierlottoplus-1.svg",
  "in-quickdraw": "/logos/in-quickdraw-1.svg",
  "in-quick-draw": "/logos/in-quickdraw-1.svg",
  // Kansas
  "ks-2by2": "/logos/ks-2by2-1.svg",
  "ks-megamillions": "/logos/ks-megamillions-2.svg",
  "ks-mega-millions": "/logos/ks-megamillions-2.svg",
  "ks-pick3": "/logos/ks-pick3-1.svg",
  "ks-pick-3": "/logos/ks-pick3-1.svg",
  "ks-powerball": "/logos/ks-powerball.svg",
  "ks-superkansascash": "/logos/ks-superkansascash-1.svg",
  "ks-super-kansas-cash": "/logos/ks-superkansascash-1.svg",
  // Kentucky
  "ky-cashball225": "/logos/ky-cashball225-1.svg",
  "ky-cash-ball-225": "/logos/ky-cashball225-1.svg",
  "ky-megamillions": "/logos/ky-megamillions-2.svg",
  "ky-mega-millions": "/logos/ky-megamillions-2.svg",
  "ky-pick3": "/logos/ky-pick3-1.svg",
  "ky-pick-3": "/logos/ky-pick3-1.svg",
  "ky-pick4": "/logos/ky-pick4-1.svg",
  "ky-pick-4": "/logos/ky-pick4-1.svg",
  "ky-powerball": "/logos/ky-powerball.svg",
  // Louisiana
  "la-easy5": "/logos/la-easy5-1.svg",
  "la-easy-5": "/logos/la-easy5-1.svg",
  "la-lotto": "/logos/la-lotto-1.svg",
  "la-pick3": "/logos/la-pick3-1.svg",
  "la-pick-3": "/logos/la-pick3-1.svg",
  "la-pick4": "/logos/la-pick4-1.svg",
  "la-pick-4": "/logos/la-pick4-1.svg",
  "la-pick5": "/logos/la-pick5-1.svg",
  "la-pick-5": "/logos/la-pick5-1.svg",
  // Massachusetts
  "ma-masscash": "/logos/ma-masscash-2.svg",
  "ma-mass-cash": "/logos/ma-masscash-2.svg",
  "ma-megabucks": "/logos/ma-megabucks-1.svg",
  "ma-numbersgame": "/logos/ma-numbersgame-2.svg",
  "ma-numbers-game": "/logos/ma-numbersgame-2.svg",
  // Maryland
  "md-bonusmatch5": "/logos/md-bonusmatch5.svg",
  "md-bonus-match-5": "/logos/md-bonusmatch5.svg",
  "md-cashpop": "/logos/md-cashpop-2.svg",
  "md-cash-pop": "/logos/md-cashpop-2.svg",
  "md-multimatch": "/logos/md-multimatch.svg",
  "md-multi-match": "/logos/md-multimatch.svg",
  "md-pick3": "/logos/md-pick3.svg",
  "md-pick-3": "/logos/md-pick3.svg",
  "md-pick4": "/logos/md-pick4.svg",
  "md-pick-4": "/logos/md-pick4.svg",
  "md-pick5": "/logos/md-pick5.svg",
  "md-pick-5": "/logos/md-pick5.svg",
  // Maine
  "me-cashpop": "/logos/me-cashpop-2x.png",
  "me-cash-pop": "/logos/me-cashpop-2x.png",
  "me-pick3": "/logos/me-pick3-1.svg",
  "me-pick-3": "/logos/me-pick3-1.svg",
  "me-pick4": "/logos/me-pick4-1.svg",
  "me-pick-4": "/logos/me-pick4-1.svg",
  // Michigan
  "mi-daily3": "/logos/mi-daily3-1.svg",
  "mi-daily-3": "/logos/mi-daily3-1.svg",
  "mi-daily4": "/logos/mi-daily4-1.svg",
  "mi-daily-4": "/logos/mi-daily4-1.svg",
  "mi-fantasy5": "/logos/mi-fantasy5-1.svg",
  "mi-fantasy-5": "/logos/mi-fantasy5-1.svg",
  "mi-keno": "/logos/mi-keno-1.svg",
  "mi-lotto47": "/logos/mi-lotto47-1.svg",
  "mi-lotto-47": "/logos/mi-lotto47-1.svg",
  "mi-megamillions": "/logos/mi-megamillions-2.svg",
  "mi-mega-millions": "/logos/mi-megamillions-2.svg",
  "mi-pokerlotto": "/logos/mi-poker-lotto.svg",
  "mi-poker-lotto": "/logos/mi-poker-lotto.svg",
  "mi-powerball": "/logos/mi-powerball.svg",
  // Minnesota
  "mn-gopher5": "/logos/mn-gopher5.svg",
  "mn-gopher-5": "/logos/mn-gopher5.svg",
  "mn-north5": "/logos/mn-north5.svg",
  "mn-north-5": "/logos/mn-north5.svg",
  "mn-pick3": "/logos/mn-pick3.svg",
  "mn-pick-3": "/logos/mn-pick3.svg",
  "mn-powerball": "/logos/mn-powerball-4x.png",
  // Missouri
  "mo-cashpop": "/logos/mo-cashpop-1.svg",
  "mo-cash-pop": "/logos/mo-cashpop-1.svg",
  "mo-megamillions": "/logos/mo-megamillions-1.svg",
  "mo-mega-millions": "/logos/mo-megamillions-1.svg",
  "mo-momillions": "/logos/mo-mo-millions.svg",
  "mo-mo-millions": "/logos/mo-mo-millions.svg",
  "mo-pick3": "/logos/mo-pick3-1.svg",
  "mo-pick-3": "/logos/mo-pick3-1.svg",
  "mo-pick4": "/logos/mo-pick4-1.svg",
  "mo-pick-4": "/logos/mo-pick4-1.svg",
  "mo-powerball": "/logos/mo-powerball.svg",
  "mo-showmecash": "/logos/mo-showmecash-1.svg",
  "mo-show-me-cash": "/logos/mo-showmecash-1.svg",
  // Mississippi
  "ms-cash3": "/logos/ms-cash3-1.svg",
  "ms-cash-3": "/logos/ms-cash3-1.svg",
  "ms-cash4": "/logos/ms-cash4-1.svg",
  "ms-cash-4": "/logos/ms-cash4-1.svg",
  "ms-cashpop": "/logos/ms-cashpop-1.svg",
  "ms-cash-pop": "/logos/ms-cashpop-1.svg",
  "ms-lottoamerica": "/logos/ms-lottoamerica-1.svg",
  "ms-lotto-america": "/logos/ms-lottoamerica-1.svg",
  "ms-match5": "/logos/ms-mississippi-match-5.svg",
  "ms-match-5": "/logos/ms-mississippi-match-5.svg",
  "ms-mississippi-match-5": "/logos/ms-mississippi-match-5.svg",
  "ms-megamillions": "/logos/ms-megamillions-1.svg",
  "ms-mega-millions": "/logos/ms-megamillions-1.svg",
  "ms-powerball": "/logos/ms-powerball.svg",
  // Montana
  "mt-bigskybonus": "/logos/mt-bigskybonus-1.svg",
  "mt-big-sky-bonus": "/logos/mt-bigskybonus-1.svg",
  "mt-montanacash": "/logos/mt-montanacash-1.svg",
  "mt-montana-cash": "/logos/mt-montanacash-1.svg",
  // North Carolina
  "nc-cash5": "/logos/nc-cash5.svg",
  "nc-cash-5": "/logos/nc-cash5.svg",
  "nc-cashpop": "/logos/nc-cashpop-1.svg",
  "nc-cash-pop": "/logos/nc-cashpop-1.svg",
  "nc-megamillions": "/logos/nc-megamillions-1.svg",
  "nc-mega-millions": "/logos/nc-megamillions-1.svg",
  "nc-pick3": "/logos/nc-pick3-1.svg",
  "nc-pick-3": "/logos/nc-pick3-1.svg",
  "nc-pick4": "/logos/nc-pick4-1.svg",
  "nc-pick-4": "/logos/nc-pick4-1.svg",
  "nc-powerball": "/logos/nc-powerball.svg",
  // North Dakota
  "nd-2by2": "/logos/nd-2by2-1.svg",
  "nd-lottoamerica": "/logos/nd-lottoamerica-1.svg",
  "nd-lotto-america": "/logos/nd-lottoamerica-1.svg",
  "nd-megamillions": "/logos/nd-megamillions-2.svg",
  "nd-mega-millions": "/logos/nd-megamillions-2.svg",
  "nd-powerball": "/logos/nd-powerball-1.svg",
  // Nebraska
  "ne-2by2": "/logos/ne-2by2-1.svg",
  "ne-lottoamerica": "/logos/ne-lottoamerica-1.svg",
  "ne-lotto-america": "/logos/ne-lottoamerica-1.svg",
  "ne-megamillions": "/logos/ne-megamillions-2.svg",
  "ne-mega-millions": "/logos/ne-megamillions-2.svg",
  "ne-pick3": "/logos/ne-pick3-1.svg",
  "ne-pick-3": "/logos/ne-pick3-1.svg",
  "ne-pick4": "/logos/ne-pick4-1.svg",
  "ne-pick-4": "/logos/ne-pick4-1.svg",
  "ne-pick5": "/logos/ne-pick5-1.svg",
  "ne-pick-5": "/logos/ne-pick5-1.svg",
  "ne-myday": "/logos/ne-myday.svg",
  "ne-my-day": "/logos/ne-myday.svg",
  "ne-powerball": "/logos/ne-powerball.svg",
  // New Hampshire
  "nh-megamillions": "/logos/nh-megamillions-2.svg",
  "nh-mega-millions": "/logos/nh-megamillions-2.svg",
  "nh-pick3": "/logos/nh-pick3-1.svg",
  "nh-pick-3": "/logos/nh-pick3-1.svg",
  "nh-pick4": "/logos/nh-pick4-1.svg",
  "nh-pick-4": "/logos/nh-pick4-1.svg",
  "nh-powerball": "/logos/nh-powerball-1.svg",
  // New Jersey
  "nj-cash5": "/logos/nj-cash5.svg",
  "nj-cash-5": "/logos/nj-cash5.svg",
  "nj-jerseycash5": "/logos/nj-cash5.svg",
  "nj-jersey-cash-5": "/logos/nj-cash5.svg",
  "nj-megamillions": "/logos/nj-megamillions-1.svg",
  "nj-mega-millions": "/logos/nj-megamillions-1.svg",
  "nj-pick3": "/logos/nj-pick3-1.svg",
  "nj-pick-3": "/logos/nj-pick3-1.svg",
  "nj-pick4": "/logos/nj-pick4-1.svg",
  "nj-pick-4": "/logos/nj-pick4-1.svg",
  "nj-pick6dp": "/logos/nj-pick6dp.svg",
  "nj-pick-6": "/logos/nj-pick6dp.svg",
  "nj-powerball": "/logos/nj-powerball-1.svg",
  "nj-powerball-dp": "/logos/nj-powerball-dp-1.svg",
  "nj-powerball-double-play": "/logos/nj-powerball-dp-1.svg",
  // New Mexico
  "nm-lottoamerica": "/logos/nm-lottoamerica.svg",
  "nm-lotto-america": "/logos/nm-lottoamerica.svg",
  "nm-megamillions": "/logos/nm-megamillions-1.svg",
  "nm-mega-millions": "/logos/nm-megamillions-1.svg",
  "nm-pick3plus": "/logos/nm-pick3plus.svg",
  "nm-pick-3-plus": "/logos/nm-pick3plus.svg",
  "nm-pick4plus": "/logos/nm-pick4plus.svg",
  "nm-pick-4-plus": "/logos/nm-pick4plus.svg",
  "nm-powerball": "/logos/nm-powerball.svg",
  "nm-roadrunnercash": "/logos/nm-roadrunnercash.svg",
  "nm-roadrunner-cash": "/logos/nm-roadrunnercash.svg",
  // New York
  "ny-lotto": "/logos/ny-lotto.svg",
  "ny-megamillions": "/logos/ny-megamillions-1.svg",
  "ny-mega-millions": "/logos/ny-megamillions-1.svg",
  "ny-numbers": "/logos/ny-numbers.svg",
  "ny-pick10": "/logos/ny-pick10.svg",
  "ny-pick-10": "/logos/ny-pick10.svg",
  "ny-powerball": "/logos/ny-powerball.svg",
  "ny-take5": "/logos/ny-take5.svg",
  "ny-take-5": "/logos/ny-take5.svg",
  "ny-win4": "/logos/ny-win4.svg",
  "ny-win-4": "/logos/ny-win4.svg",
  // Ohio
  "oh-classiclotto": "/logos/oh-classiclotto-1.svg",
  "oh-classic-lotto": "/logos/oh-classiclotto-1.svg",
  "oh-kicker": "/logos/oh-kicker-1.svg",
  "oh-pick3": "/logos/oh-pick3-1.svg",
  "oh-pick-3": "/logos/oh-pick3-1.svg",
  "oh-pick4": "/logos/oh-pick4-1.svg",
  "oh-pick-4": "/logos/oh-pick4-1.svg",
  "oh-pick5": "/logos/oh-pick5-1.svg",
  "oh-pick-5": "/logos/oh-pick5-1.svg",
  "oh-rollingcash5": "/logos/oh-rollingcash5-1.svg",
  "oh-rolling-cash-5": "/logos/oh-rollingcash5-1.svg",
  // Oklahoma
  "ok-cash5": "/logos/ok-cash5-1.svg",
  "ok-cash-5": "/logos/ok-cash5-1.svg",
  "ok-megamillions": "/logos/ok-megamillions-2.svg",
  "ok-mega-millions": "/logos/ok-megamillions-2.svg",
  "ok-pick3": "/logos/ok-pick3-1.svg",
  "ok-pick-3": "/logos/ok-pick3-1.svg",
  "ok-powerball": "/logos/ok-powerball-1.svg",
  // Oregon
  "or-megabucks": "/logos/or-megabucks.svg",
  "or-pick4": "/logos/or-pick4.svg",
  "or-pick-4": "/logos/or-pick4.svg",
  "or-winforlife": "/logos/or-winforlife.svg",
  "or-win-for-life": "/logos/or-winforlife.svg",
  // Pennsylvania
  "pa-cash5": "/logos/pa-cash5.svg",
  "pa-cash-5": "/logos/pa-cash5.svg",
  "pa-cashpop": "/logos/pa-cashpop-1.svg",
  "pa-cash-pop": "/logos/pa-cashpop-1.svg",
  "pa-match6": "/logos/pa-match6.svg",
  "pa-match-6": "/logos/pa-match6.svg",
  "pa-pick2": "/logos/pa-pick2.svg",
  "pa-pick-2": "/logos/pa-pick2.svg",
  "pa-pick3": "/logos/pa-pick3.svg",
  "pa-pick-3": "/logos/pa-pick3.svg",
  "pa-pick4": "/logos/pa-pick4.svg",
  "pa-pick-4": "/logos/pa-pick4.svg",
  "pa-pick5": "/logos/pa-pick5.svg",
  "pa-pick-5": "/logos/pa-pick5.svg",
  "pa-treasurehunt": "/logos/pa-treasurehunt.svg",
  "pa-treasure-hunt": "/logos/pa-treasurehunt.svg",
  // Puerto Rico
  "pr-lotocash": "/logos/pr-lotocash-1.svg",
  "pr-loto-cash": "/logos/pr-lotocash-1.svg",
  "pr-pega2": "/logos/pr-pega2-1.svg",
  "pr-pega-2": "/logos/pr-pega2-1.svg",
  "pr-pega3": "/logos/pr-pega3-1.svg",
  "pr-pega-3": "/logos/pr-pega3-1.svg",
  "pr-pega4": "/logos/pr-pega4-1.svg",
  "pr-pega-4": "/logos/pr-pega4-1.svg",
  "pr-powerball": "/logos/pr-powerball.svg",
  "pr-revancha": "/logos/pr-revancha-1.svg",
  "pr-loteria-tradicional": "/logos/pr-loteria-tradicional.png",
  // Rhode Island
  "ri-numbers": "/logos/ri-numbers-game.svg",
  "ri-the-numbers": "/logos/ri-numbers-game.svg",
  "ri-numbers-game": "/logos/ri-numbers-game.svg",
  "ri-wildmoney": "/logos/ri-wildmoney-1.svg",
  "ri-wild-money": "/logos/ri-wildmoney-1.svg",
  // South Carolina
  "sc-cashpop": "/logos/sc-cashpop.svg",
  "sc-cash-pop": "/logos/sc-cashpop.svg",
  "sc-palmettocash5": "/logos/sc-palmettocash5-1.svg",
  "sc-palmetto-cash-5": "/logos/sc-palmettocash5-1.svg",
  "sc-pick3fireball": "/logos/sc-pick3fireball.svg",
  "sc-pick-3-fireball": "/logos/sc-pick3fireball.svg",
  "sc-pick4fireball": "/logos/sc-pick4fireball.svg",
  "sc-pick-4-fireball": "/logos/sc-pick4fireball.svg",
  // South Dakota
  "sd-dakotacash": "/logos/sd-dakotacash-1.svg",
  "sd-dakota-cash": "/logos/sd-dakotacash-1.svg",
  "sd-lottoamerica": "/logos/sd-lottoamerica-1.svg",
  "sd-lotto-america": "/logos/sd-lottoamerica-1.svg",
  "sd-powerball": "/logos/sd-powerball.svg",
  "sd-powerball-dp": "/logos/sd-powerball-dp.svg",
  "sd-powerball-double-play": "/logos/sd-powerball-dp.svg",
  // Tennessee
  "tn-cash3": "/logos/tn-cash3-1.svg",
  "tn-cash-3": "/logos/tn-cash3-1.svg",
  "tn-cash4": "/logos/tn-cash4-1.svg",
  "tn-cash-4": "/logos/tn-cash4-1.svg",
  "tn-dailytennesseejackpot": "/logos/tn-dailytennesseejackpot-1.svg",
  "tn-daily-tennessee-jackpot": "/logos/tn-dailytennesseejackpot-1.svg",
  "tn-megamillions": "/logos/tn-megamillions-2.svg",
  "tn-mega-millions": "/logos/tn-megamillions-2.svg",
  "tn-powerball": "/logos/tn-powerball.svg",
  "tn-powerball-dp": "/logos/tn-powerball-dp.svg",
  "tn-powerball-double-play": "/logos/tn-powerball-dp.svg",
  "tn-tennesseecash": "/logos/tn-tennesseecash-1.svg",
  "tn-tennessee-cash": "/logos/tn-tennesseecash-1.svg",
  // Texas
  "tx-allornothing": "/logos/tx-allornothing.svg",
  "tx-all-or-nothing": "/logos/tx-allornothing.svg",
  "tx-cash5": "/logos/tx-cash5.svg",
  "tx-cash-5": "/logos/tx-cash5.svg",
  "tx-daily4": "/logos/tx-daily4-1.svg",
  "tx-daily-4": "/logos/tx-daily4-1.svg",
  "tx-lotto": "/logos/tx-lotto-texas.svg",
  "tx-lotto-texas": "/logos/tx-lotto-texas.svg",
  "tx-megamillions": "/logos/tx-megamillions-1.svg",
  "tx-mega-millions": "/logos/tx-megamillions-1.svg",
  "tx-pick3": "/logos/tx-pick3-1.svg",
  "tx-pick-3": "/logos/tx-pick3-1.svg",
  "tx-powerball": "/logos/tx-powerball.svg",
  "tx-texastwostep": "/logos/tx-texastwostep.svg",
  "tx-texas-two-step": "/logos/tx-texastwostep.svg",
  // Virginia
  "va-bankamillion": "/logos/va-bankamillion.svg",
  "va-bank-a-million": "/logos/va-bankamillion.svg",
  "va-cash5": "/logos/va-cash5.svg",
  "va-cash-5": "/logos/va-cash5.svg",
  "va-cashpop": "/logos/va-cashpop.svg",
  "va-cash-pop": "/logos/va-cashpop.svg",
  "va-pick3": "/logos/va-pick3.svg",
  "va-pick-3": "/logos/va-pick3.svg",
  "va-pick4": "/logos/va-pick4.svg",
  "va-pick-4": "/logos/va-pick4.svg",
  "va-pick5": "/logos/va-pick5-1.svg",
  "va-pick-5": "/logos/va-pick5-1.svg",
  // Vermont
  "vt-megamillions": "/logos/vt-megamillions-2.svg",
  "vt-mega-millions": "/logos/vt-megamillions-2.svg",
  "vt-pick3": "/logos/vt-pick3-1.svg",
  "vt-pick-3": "/logos/vt-pick3-1.svg",
  "vt-pick4": "/logos/vt-pick4-1.svg",
  "vt-pick-4": "/logos/vt-pick4-1.svg",
  "vt-powerball": "/logos/vt-powerball.svg",
  // Washington
  "wa-cashpop": "/logos/wa-cashpop-1.svg",
  "wa-cash-pop": "/logos/wa-cashpop-1.svg",
  "wa-hit5": "/logos/wa-hit5-1.svg",
  "wa-hit-5": "/logos/wa-hit5-1.svg",
  "wa-keno": "/logos/wa-daily-keno.svg",
  "wa-daily-keno": "/logos/wa-daily-keno.svg",
  "wa-lotto": "/logos/wa-lotto-1.svg",
  "wa-match4": "/logos/wa-match4-1.svg",
  "wa-match-4": "/logos/wa-match4-1.svg",
  "wa-pick3": "/logos/wa-pick3-1.svg",
  "wa-pick-3": "/logos/wa-pick3-1.svg",
  // Wisconsin
  "wi-allornothing": "/logos/wi-allornothing.svg",
  "wi-all-or-nothing": "/logos/wi-allornothing.svg",
  "wi-badger5": "/logos/wi-badger5.svg",
  "wi-badger-5": "/logos/wi-badger5.svg",
  "wi-megabucks": "/logos/wi-megabucks.svg",
  "wi-pick3": "/logos/wi-pick3.svg",
  "wi-pick-3": "/logos/wi-pick3.svg",
  "wi-pick4": "/logos/wi-pick4.svg",
  "wi-pick-4": "/logos/wi-pick4.svg",
  "wi-powerball": "/logos/wi-powerball.svg",
  "wi-supercash": "/logos/wi-supercash.svg",
  "wi-super-cash": "/logos/wi-supercash.svg",
  // West Virginia
  "wv-cash25": "/logos/wv-cash25.svg",
  "wv-cash-25": "/logos/wv-cash25.svg",
  "wv-daily3": "/logos/wv-daily3.svg",
  "wv-daily-3": "/logos/wv-daily3.svg",
  "wv-daily4": "/logos/wv-daily4.svg",
  "wv-daily-4": "/logos/wv-daily4.svg",
  "wv-megamillions": "/logos/wv-megamillions-1.svg",
  "wv-mega-millions": "/logos/wv-megamillions-1.svg",
  "wv-powerball": "/logos/wv-powerball.svg",
  // Wyoming
  "wy-2by2": "/logos/wy-2by2-2.svg",
  "wy-cowboydraw": "/logos/wy-cowboydraw-2.svg",
  "wy-cowboy-draw": "/logos/wy-cowboydraw-2.svg",
  "wy-megamillions": "/logos/wy-megamillions-2.svg",
  "wy-mega-millions": "/logos/wy-megamillions-2.svg",
  // Multi-state generic (with xx prefix, without prefix, and with -xx suffix)
  "xx-lottoamerica": "/logos/xx-lottoamerica.svg",
  "xx-lotto-america": "/logos/xx-lottoamerica.svg",
  "lottoamerica": "/logos/xx-lottoamerica.svg",
  "lotto-america": "/logos/xx-lottoamerica.svg",
  "lottoamerica-xx": "/logos/xx-lottoamerica.svg",
  "lotto-america-xx": "/logos/xx-lottoamerica.svg",
  "xx-megamillions": "/logos/xx-megamillions-4.svg",
  "xx-mega-millions": "/logos/xx-megamillions-4.svg",
  "megamillions": "/logos/xx-megamillions-4.svg",
  "mega-millions": "/logos/xx-megamillions-4.svg",
  "megamillions-xx": "/logos/xx-megamillions-4.svg",
  "mega-millions-xx": "/logos/xx-megamillions-4.svg",
  "xx-millionaireforlife": "/logos/xx-millionaireforlife-1.svg",
  "xx-millionaire-for-life": "/logos/xx-millionaireforlife-1.svg",
  "millionaireforlife": "/logos/xx-millionaireforlife-1.svg",
  "millionaire-for-life": "/logos/xx-millionaireforlife-1.svg",
  "millionaireforlife-xx": "/logos/xx-millionaireforlife-1.svg",
  "millionaire-for-life-xx": "/logos/xx-millionaireforlife-1.svg",
  // Cash4Life / Lucky for Life reuse the national millionaire-for-life visual asset
  "xx-cash4life": "/logos/xx-millionaireforlife-1.svg",
  "xx-cash-4-life": "/logos/xx-millionaireforlife-1.svg",
  "cash4life": "/logos/xx-millionaireforlife-1.svg",
  "cash-4-life": "/logos/xx-millionaireforlife-1.svg",
  "cash4life-xx": "/logos/xx-millionaireforlife-1.svg",
  "cash-4-life-xx": "/logos/xx-millionaireforlife-1.svg",
  "xx-luckyforlife": "/logos/xx-millionaireforlife-1.svg",
  "xx-lucky-for-life": "/logos/xx-millionaireforlife-1.svg",
  "luckyforlife": "/logos/xx-millionaireforlife-1.svg",
  "lucky-for-life": "/logos/xx-millionaireforlife-1.svg",
  "luckyforlife-xx": "/logos/xx-millionaireforlife-1.svg",
  "lucky-for-life-xx": "/logos/xx-millionaireforlife-1.svg",
  "xx-powerball": "/logos/xx-powerball.svg",
  "powerball": "/logos/xx-powerball.svg",
  "powerball-xx": "/logos/xx-powerball.svg",
  "xx-powerball-dp": "/logos/xx-powerball-dp.svg",
  "powerball-dp": "/logos/xx-powerball-dp.svg",
  "powerball-dp-xx": "/logos/xx-powerball-dp.svg",
  "powerball-double-play": "/logos/xx-powerball-dp.svg",
  "powerball-double-play-xx": "/logos/xx-powerball-dp.svg",
  "xx-tsgimme5": "/logos/xx-tsgimme5-1.svg",
  "tsgimme5": "/logos/xx-tsgimme5-1.svg",
  "gimme5": "/logos/xx-tsgimme5-1.svg",
  "gimme-5": "/logos/xx-tsgimme5-1.svg",
  "xx-tsmegabucks": "/logos/xx-tsmegabucks-1.svg",
  "tsmegabucks": "/logos/xx-tsmegabucks-1.svg",
  "tri-state-megabucks": "/logos/xx-tsmegabucks-1.svg",
  "megabucks": "/logos/xx-tsmegabucks-1.svg",
  // 2by2 multistate
  "2by2": "/logos/ne-2by2-1.svg",
  "2by2-xx": "/logos/ne-2by2-1.svg",
  // Special files
  "favicon": "/logos/favicon.svg",
}

/**
 * Check if a local logo exists for this game
 * Tries multiple key variations for flexible matching
 */
function getLocalLogo(gameSlug: string | undefined, stateSlug: string | undefined): string | null {
  if (!gameSlug) return null
  
  const slug = gameSlug.toLowerCase()
  const state = (stateSlug?.toLowerCase() || "").trim()
  const normalizedFamily = normalizeGameFamilySlug(slug)
  
  // Try exact state-specific match first (only if state is not empty)
  if (state && state !== "xx") {
    const stateKey = `${state}-${normalizedFamily}`
    if (LOCAL_LOGOS[stateKey]) return LOCAL_LOGOS[stateKey]
    
    const stateSlugKey = `${state}-${slug}`
    if (LOCAL_LOGOS[stateSlugKey]) return LOCAL_LOGOS[stateSlugKey]
  }
  
  // Try generic family (no state)
  if (LOCAL_LOGOS[normalizedFamily]) return LOCAL_LOGOS[normalizedFamily]
  if (LOCAL_LOGOS[slug]) return LOCAL_LOGOS[slug]
  
  return null
}

/**
 * Normalize a game slug to its family slug by:
 * 1. Removing trailing state suffix (-ga, -ny, etc.)
 * 2. Removing session/time suffixes (morning, midday, evening, night, etc.)
 */
function normalizeGameFamilySlug(gameSlug: string): string {
  let slug = gameSlug.toLowerCase().trim()
  
  // 1. Remove trailing state suffix
  for (const state of STATE_ABBREVS) {
    const statePattern = new RegExp(`-${state}$`, "i")
    if (statePattern.test(slug)) {
      slug = slug.replace(statePattern, "")
      break
    }
  }
  
  // 2. Remove session suffixes (try longest matches first)
  const sortedSuffixes = [...SESSION_SUFFIXES].sort((a, b) => b.length - a.length)
  
  for (const suffix of sortedSuffixes) {
    const sessionPattern = new RegExp(`-${suffix}$`, "i")
    if (sessionPattern.test(slug)) {
      slug = slug.replace(sessionPattern, "")
      break
    }
  }
  
  return slug
}

/**
 * Generate initials from game name
 */
function getInitials(name: string): string {
  const words = name.split(/[\s-]+/).filter(Boolean)
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase()
  }
  return words
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("")
}

/**
 * Generate consistent color based on game name
 */
function getColorFromName(name: string): string {
  const colors = [
    "bg-gradient-to-br from-red-500 to-red-600",
    "bg-gradient-to-br from-blue-500 to-blue-600",
    "bg-gradient-to-br from-green-500 to-green-600",
    "bg-gradient-to-br from-purple-500 to-purple-600",
    "bg-gradient-to-br from-orange-500 to-orange-600",
    "bg-gradient-to-br from-pink-500 to-pink-600",
    "bg-gradient-to-br from-teal-500 to-teal-600",
    "bg-gradient-to-br from-indigo-500 to-indigo-600",
  ]
  
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

/**
 * Build all possible logo URL candidates in priority order
 * PRIORITY 1: Local logos from /public/logos/ (instant, zero latency)
 * PRIORITY 2: API URLs if they exist
 * PRIORITY 3: Remote fallbacks from lottery.com CDN (high latency)
 */
function buildLogoCandidates(
  baseUrl: string,
  gameSlug: string | undefined,
  stateSlug: string | undefined,
  sourceGameSlug: string | undefined,
  isMultistate: boolean,
  apiUrls: (string | undefined)[]
): string[] {
  const candidates: string[] = []
  const seen = new Set<string>()
  
  const addCandidate = (url: string) => {
    if (url && !seen.has(url)) {
      seen.add(url)
      candidates.push(url)
    }
  }
  
  if (!gameSlug) {
    apiUrls.forEach((url) => {
      if (url) addCandidate(url)
    })
    return candidates
  }
  
  const slug = gameSlug.toLowerCase()
  const state = stateSlug?.toLowerCase() || ""
  const normalizedFamily = normalizeGameFamilySlug(slug)
  
  // PRIORITY 1: Check for local logo first (instant loading from same domain)
  const localLogo = getLocalLogo(gameSlug, stateSlug)
  if (localLogo) {
    addCandidate(localLogo)
    // If we found a local logo, skip remote attempts to avoid fallback latency
    // But still keep API URLs as secondary backup
  }
  
  // PRIORITY 2: API direct fields as secondary backup
  apiUrls.forEach((url) => {
    if (url) addCandidate(url)
  })
  
  // PRIORITY 3: Remote fallbacks (only if no local logo found)
  // This prevents falling back to slow remote URLs when we have local ones
  if (!localLogo) {
    // State-specific with raw slug
    if (state) {
      addCandidate(`${baseUrl}/${state}-${slug}.svg`)
      addCandidate(`${baseUrl}/${state}-${slug}.png`)
    }
    
    // State-specific with normalized family slug
    if (state && normalizedFamily !== slug) {
      addCandidate(`${baseUrl}/${state}-${normalizedFamily}.svg`)
      addCandidate(`${baseUrl}/${state}-${normalizedFamily}.png`)
    }
    
    // Generic family logo (no state prefix)
    addCandidate(`${baseUrl}/${normalizedFamily}.svg`)
    addCandidate(`${baseUrl}/${normalizedFamily}.png`)
    
    // Also try raw slug as generic
    if (normalizedFamily !== slug) {
      addCandidate(`${baseUrl}/${slug}.svg`)
      addCandidate(`${baseUrl}/${slug}.png`)
    }
    
    // Try sourceGameSlug if provided
    if (sourceGameSlug) {
      const srcNormalized = normalizeGameFamilySlug(sourceGameSlug)
      if (state) {
        addCandidate(`${baseUrl}/${state}-${srcNormalized}.svg`)
        addCandidate(`${baseUrl}/${state}-${srcNormalized}.png`)
      }
      addCandidate(`${baseUrl}/${srcNormalized}.svg`)
      addCandidate(`${baseUrl}/${srcNormalized}.png`)
    }
    
    // Multi-state fallback
    if (isMultistate) {
      for (const msGame of MULTISTATE_GAMES) {
        if (slug.includes(msGame) || normalizedFamily.includes(msGame)) {
          addCandidate(`${baseUrl}/${msGame}.svg`)
          addCandidate(`${baseUrl}/${msGame}.png`)
        }
      }
    }
  }
  
  return candidates
}

/**
 * Game logo component with optimized loading strategy:
 * 
 * Priority order:
 * 1. Local logos from /public/logos/ - INSTANT (< 50ms, same domain)
 * 2. API direct URLs - FAST (100-500ms, API call)
 * 3. Remote CDN fallbacks - SLOW (500-2000ms, external)
 * 4. Fallback avatar with initials - INSTANT (always available)
 * 
 * HYDRATION-SAFE: Logo resolution is deterministic and does not depend on
 * useEffect or client-only state for initial render. The image is always
 * visible immediately (no opacity-0 waiting for onLoad).
 */
export function GameLogo({
  logoUrl,
  logo,
  iconUrl,
  gameName,
  gameSlug,
  stateSlug,
  sourceGameSlug,
  isMultistate,
  size = "md",
  className,
  priority = false,
}: GameLogoProps) {
  const [failedSources, setFailedSources] = useState<Set<string>>(new Set())

  const baseUrl = process.env.NEXT_PUBLIC_LOGO_BASE_URL || "https://winningnumbers.us/assets/logos"
  
  // Determine if this is a multistate game (deterministic, no useEffect)
  const normalizedSlug = (gameSlug || gameName).toLowerCase()
  const isMultistateGame = isMultistate || MULTISTATE_GAMES.some(
    (ms) => normalizedSlug.includes(ms) || gameName.toLowerCase().includes(ms.replace(/-/g, " "))
  )

  // Build array of sources to try in order (deterministic, same on server and client)
  const sources = buildLogoCandidates(
    baseUrl,
    gameSlug,
    stateSlug,
    sourceGameSlug,
    isMultistateGame,
    [logoUrl, logo, iconUrl]
  )

  // Find the first source that hasn't failed
  const currentSrc = sources.find(src => !failedSources.has(src))
  const allFailed = !currentSrc

  // Stable key for React based on the current source
  const imageKey = `logo-${gameSlug || gameName}-${currentSrc || "fallback"}`

  const handleImageError = (failedSrc: string) => {
    setFailedSources(prev => {
      const next = new Set(prev)
      next.add(failedSrc)
      return next
    })
  }

  const initials = getInitials(gameName)
  const bgColor = getColorFromName(gameName)

  // Show initials fallback if no sources or all failed
  if (sources.length === 0 || allFailed) {
    return (
      <div
        className={cn(
          "flex flex-shrink-0 items-center justify-center rounded-xl",
          bgColor,
          "font-bold text-white",
          "shadow-lg shadow-black/20",
          sizeClasses[size],
          textSizeClasses[size],
          className
        )}
        role="img"
        aria-label={`${gameName} logo`}
      >
        {initials}
      </div>
    )
  }

  // Real logo: clean transparent wrapper with just the image
  // Image is ALWAYS visible (no opacity-0 state) - this fixes hydration issues
  return (
    <div
      className={cn(
        "flex flex-shrink-0 items-center justify-center overflow-hidden",
        sizeClasses[size],
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={imageKey}
        src={currentSrc}
        alt={`${gameName} logo`}
        className="h-full w-full object-contain"
        loading={priority ? "eager" : "lazy"}
        width={imageSizes[size]}
        height={imageSizes[size]}
        onError={() => handleImageError(currentSrc!)}
      />
    </div>
  )
}
