import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { notFound } from 'next/navigation'
import { ClassPageClient } from '@/components/seo/ClassPageClient'
import { RacePageClient }  from '@/components/seo/RacePageClient'

const DATA_DIR = join(process.cwd(), 'data')

function readJson(filePath) {
  try { return JSON.parse(readFileSync(filePath, 'utf-8')) } catch { return null }
}

function loadPageData(slug) {
  const cls  = readJson(join(DATA_DIR, 'classes', `${slug}.json`))
  if (cls)  return { type: 'class', data: cls }
  const race = readJson(join(DATA_DIR, 'races',   `${slug}.json`))
  if (race) return { type: 'race',  data: race }
  return null
}

export function generateStaticParams() {
  const classFiles = readdirSync(join(DATA_DIR, 'classes')).filter(f => f.endsWith('.json'))
  const raceFiles  = readdirSync(join(DATA_DIR, 'races')).filter(f => f.endsWith('.json'))
  return [
    ...classFiles.map(f => ({ slug: f.slice(0, -5) })),
    ...raceFiles.map(f  => ({ slug: f.slice(0, -5) })),
  ]
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const page = loadPageData(slug)
  if (!page) return {}

  const { type, data } = page
  const site = 'Whispers Census'

  if (type === 'class') {
    return {
      title: `${data.name} Population & Demographics — WoW Class Data | ${site}`,
      description: buildClassDescription(data),
      alternates: { canonical: `/${slug}` },
    }
  }

  if (data.isDisambiguation) {
    return {
      title: `${data.name} Race Guide — Population & Faction Breakdown | ${site}`,
      description: `${data.name} is a neutral race available to both factions. See which faction players prefer and what classes they play.`,
      alternates: { canonical: `/${slug}` },
    }
  }

  const factionLabel = data.faction ? ` (${data.faction.charAt(0).toUpperCase() + data.faction.slice(1)})` : ''
  return {
    title: `${data.name}${factionLabel} — Class Popularity & Demographics | ${site}`,
    description: buildRaceDescription(data),
    alternates: { canonical: `/${slug}` },
  }
}

function buildClassDescription(data) {
  const ctx = data.general ?? data.pvp ?? data.mythic
  if (!ctx) return `${data.name} population data from retail WoW.`
  const top    = ctx.races?.[0]
  const bottom = ctx.races?.[ctx.races.length - 1]
  const parts  = [`See which races ${data.name} players actually pick.`]
  if (top)    parts.push(`Most played: ${top.name} (${top.percentage.toFixed(1)}%).`)
  if (bottom) parts.push(`Least played: ${bottom.name}.`)
  parts.push('General population, Mythic+, and PvP breakdowns.')
  return parts.join(' ').slice(0, 160)
}

function buildRaceDescription(data) {
  const ctx = data.general ?? data.pvp ?? data.mythic
  if (!ctx) return `${data.name} class popularity data from retail WoW.`
  const top    = ctx.classes?.[0]
  const bottom = ctx.classes?.[ctx.classes.length - 1]
  const parts  = [`See which classes ${data.name} players choose.`]
  if (top)    parts.push(`Most popular: ${top.name} (${top.percentage.toFixed(1)}%).`)
  if (bottom) parts.push(`Least popular: ${bottom.name}.`)
  return parts.join(' ').slice(0, 160)
}

// Load class icon from media manifest (server-only, at build time)
function getClassIcon(slug) {
  const manifest = readJson(join(DATA_DIR, 'media', 'classes.json'))
  return manifest?.[slug]?.icon ?? null
}

export default async function SlugPage({ params }) {
  const { slug } = await params
  const page = loadPageData(slug)
  if (!page) notFound()

  const { type, data } = page

  if (type === 'class') {
    const icon = getClassIcon(slug)
    return <ClassPageClient data={data} icon={icon} />
  }

  return <RacePageClient data={data} />
}
