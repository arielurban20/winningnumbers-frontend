/**
 * Script to download all lottery game logos locally
 * Run with: npx ts-node scripts/download-logos.ts
 * Or: pnpm exec ts-node scripts/download-logos.ts
 * 
 * This downloads logos from the lottery API and saves them to /public/logos/
 * so they can be served locally for instant loading.
 */

import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'
import * as http from 'http'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://lottery.decart.io/api'
const LOGOS_DIR = path.join(process.cwd(), 'public', 'logos')

interface State {
  slug: string
  name: string
}

interface Game {
  slug: string
  name: string
  logo_url?: string
  logo?: string
}

// Create logos directory if it doesn't exist
function ensureLogosDir() {
  if (!fs.existsSync(LOGOS_DIR)) {
    fs.mkdirSync(LOGOS_DIR, { recursive: true })
    console.log(`Created directory: ${LOGOS_DIR}`)
  }
}

// Download a single image
function downloadImage(url: string, filepath: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!url || url.startsWith('data:')) {
      resolve(false)
      return
    }

    const protocol = url.startsWith('https') ? https : http
    
    const file = fs.createWriteStream(filepath)
    
    protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location
        if (redirectUrl) {
          downloadImage(redirectUrl, filepath).then(resolve)
          return
        }
      }
      
      if (response.statusCode !== 200) {
        fs.unlinkSync(filepath)
        resolve(false)
        return
      }
      
      response.pipe(file)
      
      file.on('finish', () => {
        file.close()
        resolve(true)
      })
      
      file.on('error', () => {
        fs.unlinkSync(filepath)
        resolve(false)
      })
    }).on('error', () => {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath)
      }
      resolve(false)
    })
  })
}

// Fetch JSON from API
async function fetchJson<T>(url: string): Promise<T | null> {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http
    
    protocol.get(url, (response) => {
      let data = ''
      
      response.on('data', (chunk) => {
        data += chunk
      })
      
      response.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch {
          resolve(null)
        }
      })
    }).on('error', () => {
      resolve(null)
    })
  })
}

// Get file extension from URL or content-type
function getExtension(url: string): string {
  const urlPath = new URL(url).pathname
  const ext = path.extname(urlPath).toLowerCase()
  
  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext)) {
    return ext
  }
  
  return '.png' // Default to png
}

// Generate safe filename from game slug
function getSafeFilename(gameSlug: string, stateSlug: string): string {
  const safeName = `${stateSlug}-${gameSlug}`.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase()
  return safeName
}

// Main function
async function downloadAllLogos() {
  console.log('='.repeat(60))
  console.log('Lottery Logo Downloader')
  console.log('='.repeat(60))
  
  ensureLogosDir()
  
  // Fetch all states
  console.log('\nFetching states...')
  const states = await fetchJson<State[]>(`${API_BASE_URL}/states`)
  
  if (!states || states.length === 0) {
    console.error('Failed to fetch states')
    return
  }
  
  console.log(`Found ${states.length} states`)
  
  const logoMap: Record<string, string> = {}
  let downloaded = 0
  let failed = 0
  let skipped = 0
  
  // Process each state
  for (const state of states) {
    console.log(`\nProcessing ${state.name} (${state.slug})...`)
    
    const games = await fetchJson<Game[]>(`${API_BASE_URL}/states/${state.slug}/games`)
    
    if (!games) {
      console.log(`  No games found for ${state.slug}`)
      continue
    }
    
    for (const game of games) {
      const logoUrl = game.logo_url || game.logo
      
      if (!logoUrl) {
        skipped++
        continue
      }
      
      const filename = getSafeFilename(game.slug, state.slug)
      const ext = getExtension(logoUrl)
      const filepath = path.join(LOGOS_DIR, `${filename}${ext}`)
      
      // Skip if already downloaded
      if (fs.existsSync(filepath)) {
        logoMap[`${state.slug}/${game.slug}`] = `/logos/${filename}${ext}`
        skipped++
        continue
      }
      
      const success = await downloadImage(logoUrl, filepath)
      
      if (success) {
        logoMap[`${state.slug}/${game.slug}`] = `/logos/${filename}${ext}`
        downloaded++
        console.log(`  ✓ ${game.name}`)
      } else {
        failed++
        console.log(`  ✗ ${game.name} (failed)`)
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(r => setTimeout(r, 100))
    }
  }
  
  // Save logo map for use in the app
  const mapPath = path.join(LOGOS_DIR, 'logo-map.json')
  fs.writeFileSync(mapPath, JSON.stringify(logoMap, null, 2))
  
  console.log('\n' + '='.repeat(60))
  console.log('Summary:')
  console.log(`  Downloaded: ${downloaded}`)
  console.log(`  Skipped (already exists): ${skipped}`)
  console.log(`  Failed: ${failed}`)
  console.log(`  Logo map saved to: ${mapPath}`)
  console.log('='.repeat(60))
}

// Run
downloadAllLogos().catch(console.error)
