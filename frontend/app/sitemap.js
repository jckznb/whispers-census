import { readdirSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-static'

const BASE_URL = 'https://whisperscensus.app'

export default function sitemap() {
  const dataDir    = join(process.cwd(), 'data')
  const classFiles = readdirSync(join(dataDir, 'classes')).filter(f => f.endsWith('.json'))
  const raceFiles  = readdirSync(join(dataDir, 'races')).filter(f => f.endsWith('.json'))

  const now = new Date().toISOString()

  return [
    {
      url:            BASE_URL,
      lastModified:   now,
      changeFrequency: 'daily',
      priority:       1.0,
    },
    ...classFiles.map(f => ({
      url:             `${BASE_URL}/${f.slice(0, -5)}`,
      lastModified:    now,
      changeFrequency: 'weekly',
      priority:        0.8,
    })),
    ...raceFiles.map(f => ({
      url:             `${BASE_URL}/${f.slice(0, -5)}`,
      lastModified:    now,
      changeFrequency: 'weekly',
      priority:        0.8,
    })),
  ]
}
